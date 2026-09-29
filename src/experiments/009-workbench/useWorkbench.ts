import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_ASK, SCENARIO, type Act, type Block, type Beat, type Msg } from './scenario'

export interface WkState {
  typed: string
  messages: Msg[]
  thinking: boolean
  ws: { open: boolean; title: string; blocks: Block[]; streaming: number; done: boolean }
}

const fresh = (): WkState => ({
  typed: '', messages: [], thinking: false,
  ws: { open: false, title: '', blocks: [], streaming: -1, done: false },
})

let uid = 0
const nid = (p: string) => p + ++uid

const CANNED = [
  '收到。演示环境里回复是固定的。点右上角的播放键可以看完整流程，包括右边 Workspace 里报告的生成过程。',
  '好，我记下了。左边对话、右边产物，你可以随时打断或者关掉右边。',
]
let ci = 0

export function useWorkbench({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<WkState>(fresh)
  const r = useRef({ elapsed: 0, idx: 0, typing: null as any, typedLen: 0, disc: fresh(), mode: 'demo' as 'demo' | 'live' })
  const timers = useRef<number[]>([])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({
      ...D,
      messages: D.messages.map((m) => ({ ...m, blocks: m.blocks ? [...m.blocks] : undefined, acts: m.acts ? m.acts.map((a) => ({ ...a })) : undefined })),
      ws: { ...D.ws, blocks: [...D.ws.blocks] },
    })
  }, [])

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  useEffect(() => {
    clearTimers()
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const S = r.current, D = S.disc
      S.elapsed += (now - last) * speed
      last = now
      let dirty = false
      if (S.mode === 'demo') {
        while (S.idx < SCENARIO.length && SCENARIO[S.idx].t <= S.elapsed) {
          const stop = applyBeat(S, SCENARIO[S.idx]); S.idx++; dirty = true
          if (stop) break
        }
        if (S.typing) {
          const p = Math.min(1, (S.elapsed - S.typing.t0) / S.typing.dur)
          const n = Math.round(p * S.typing.text.length)
          if (n !== S.typedLen) { S.typedLen = n; D.typed = S.typing.text.slice(0, n); dirty = true }
          if (p >= 1) S.typing = null
        }
      }
      if (dirty) commit()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, commit])

  const api = {
    send: useCallback((text: string) => {
      const t = text.trim(); if (!t) return
      const D = r.current.disc
      r.current.mode = 'live'
      D.messages = [...D.messages, { id: nid('u'), role: 'user', text: t }]
      D.typed = ''; D.thinking = true
      commit()
      const id = nid('m')
      const reply = CANNED[ci++ % CANNED.length]
      timers.current.push(window.setTimeout(() => {
        const D2 = r.current.disc
        D2.thinking = false
        D2.messages = [...D2.messages, { id, role: 'agent', blocks: [{ kind: 'p', text: reply }], done: true }]
        commit()
      }, 1000))
    }, [commit]),

    toggleActs: useCallback((id: string) => {
      const m = r.current.disc.messages.find((x) => x.id === id)
      if (!m) return
      m.actsOpen = !m.actsOpen
      commit()
    }, [commit]),

    toggleWs: useCallback(() => {
      const D = r.current.disc
      D.ws.open = !D.ws.open
      commit()
    }, [commit]),

    stop: useCallback(() => {
      clearTimers()
      const D = r.current.disc
      D.thinking = false
      const m = [...D.messages].reverse().find((x) => x.role === 'agent')
      if (m) { m.streaming = -1; m.done = true; m.acts = m.acts?.map((a) => (a.state === 'running' ? { ...a, state: 'done' as const } : a)) }
      D.ws.streaming = -1
      commit()
    }, [commit]),

    newTask: useCallback(() => {
      clearTimers()
      r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }
      setState(r.current.disc)
    }, []),

    pick: useCallback((t: string) => { r.current.disc.typed = t; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api }
}

function applyBeat(S: { elapsed: number; typing: any; typedLen: number; disc: WkState }, b: Beat): boolean {
  const D = S.disc
  const msg = (id: string): Msg => {
    let m = D.messages.find((x) => x.id === id)
    if (!m) { m = { id, role: 'agent', blocks: [] }; D.messages = [...D.messages, m] }
    return m
  }
  switch (b.op) {
    case 'type': S.typing = { text: b.text, dur: b.dur, t0: S.elapsed }; S.typedLen = 0; D.typed = ''; return false
    case 'send':
      S.typing = null
      D.messages = [...D.messages, { id: nid('u'), role: 'user', text: D.typed || DEFAULT_ASK }]
      D.typed = ''; D.thinking = true
      return false
    case 'text': { const m = msg(b.id); m.blocks = [{ kind: 'p', text: b.text }]; D.thinking = false; return false }
    case 'acts': msg(b.id).acts = b.labels.map((label, i) => ({ id: 'k' + i, label, state: i === 0 ? 'running' : 'pending' })); return false
    case 'act': {
      const m = D.messages.find((x) => x.id === b.id)
      if (m?.acts?.[b.i]) { m.acts[b.i].state = b.state; if (b.note) m.acts[b.i].note = b.note }
      return false
    }
    case 'actsOpen': { const m = D.messages.find((x) => x.id === b.id); if (m) m.actsOpen = b.open; return false }
    case 'block': { const m = msg(b.id); m.blocks = [...(m.blocks ?? []), b.block]; return false }
    case 'streaming': { const m = D.messages.find((x) => x.id === b.id); if (m) m.streaming = b.index; return false }
    case 'finish': { const m = D.messages.find((x) => x.id === b.id); if (m) { m.streaming = -1; m.done = true } return false }
    case 'ws': D.ws.open = b.open; return false
    case 'wsTitle': D.ws.title = b.title; return false
    case 'wsBlock': D.ws.blocks = [...D.ws.blocks, b.block]; return false
    case 'wsStream': D.ws.streaming = b.index; return false
    case 'wsDone': D.ws.streaming = -1; D.ws.done = true; return false
    case 'end': return true
  }
}
