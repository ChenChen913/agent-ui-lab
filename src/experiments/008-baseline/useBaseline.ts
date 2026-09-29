import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO, DEFAULT_ASK, type Act, type Block, type Beat, type Msg } from './scenario'

export interface B8State {
  typed: string
  messages: Msg[]
  thinking: boolean
}

const fresh = (): B8State => ({ typed: '', messages: [], thinking: false })

let uid = 0
const nid = (p: string) => p + ++uid

/** 用户真打字时用的固定回复 —— 演示环境不接 LLM */
const CANNED: { text: string; acts: string[] }[] = [
  { text: '收到。这是演示环境，回复是固定的。点右上角的播放键可以看完整的执行流程。', acts: ['理解请求', '生成回复'] },
  { text: '好的，我记下了。这个界面里你可以随时打字、点建议、或者展开执行过程看看。', acts: ['理解请求'] },
  { text: '明白。真实接入模型之后这里会是它的回答；现在它只是一段占位文本。', acts: ['理解请求', '生成回复'] },
]
let cannedIdx = 0

export function useBaseline({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<B8State>(fresh)
  const r = useRef({
    elapsed: 0, idx: 0,
    typing: null as null | { text: string; dur: number; t0: number },
    typedLen: 0,
    disc: fresh(),
    mode: 'demo' as 'demo' | 'live',
  })
  const timers = useRef<number[]>([])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ ...D, messages: D.messages.map((m) => ({ ...m, blocks: m.blocks ? [...m.blocks] : undefined, acts: m.acts ? m.acts.map((a) => ({ ...a })) : undefined })) })
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
      const S = r.current
      const D = S.disc
      S.elapsed += (now - last) * speed
      last = now
      let dirty = false
      if (S.mode === 'demo') {
        while (S.idx < SCENARIO.length && SCENARIO[S.idx].t <= S.elapsed) {
          const stop = applyBeat(S, SCENARIO[S.idx])
          S.idx++
          dirty = true
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
    /** 用户真的发了一条 */
    send: useCallback((text: string) => {
      const D = r.current.disc
      const t = text.trim()
      if (!t) return
      r.current.mode = 'live'
      D.messages = [...D.messages, { id: nid('u'), role: 'user', text: t }]
      D.typed = ''
      D.thinking = true
      commit()
      const id = nid('m')
      const c = CANNED[cannedIdx++ % CANNED.length]
      const t1 = window.setTimeout(() => {
        const D2 = r.current.disc
        D2.thinking = false
        D2.messages = [...D2.messages, { id, role: 'agent', blocks: [], acts: c.acts.map((label, i) => ({ id: 'k' + i, label, state: i === 0 ? 'running' : 'pending' })) }]
        commit()
      }, 850)
      c.acts.forEach((_, i) => {
        timers.current.push(window.setTimeout(() => {
          const m = r.current.disc.messages.find((x) => x.id === id)
          if (!m || !m.acts) return
          if (m.acts[i]) m.acts[i].state = 'done'
          if (m.acts[i + 1]) m.acts[i + 1].state = 'running'
          commit()
        }, 1400 + i * 700))
      })
      timers.current.push(t1)
      timers.current.push(window.setTimeout(() => {
        const m = r.current.disc.messages.find((x) => x.id === id)
        if (!m) return
        m.acts = m.acts?.map((a) => ({ ...a, state: 'done' as const }))
        m.blocks = [{ kind: 'p', text: c.text }]
        commit()
      }, 1500 + c.acts.length * 700))
    }, [commit]),

    toggleActs: useCallback((id: string) => {
      const m = r.current.disc.messages.find((x) => x.id === id)
      if (!m) return
      m.actsOpen = !m.actsOpen
      commit()
    }, [commit]),

    /** 停止生成 */
    stop: useCallback(() => {
      clearTimers()
      const D = r.current.disc
      D.thinking = false
      const m = [...D.messages].reverse().find((x) => x.role === 'agent')
      if (m) { m.streaming = -1; m.done = true; m.acts = m.acts?.map((a) => (a.state === 'running' ? { ...a, state: 'done' as const } : a)) }
      commit()
    }, [commit]),

    newChat: useCallback(() => {
      clearTimers()
      r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }
      setState(r.current.disc)
    }, []),

    pick: useCallback((text: string) => { r.current.disc.typed = text; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api }
}

function applyBeat(S: { elapsed: number; typing: any; typedLen: number; disc: B8State }, b: Beat): boolean {
  const D = S.disc
  const msg = (id: string): Msg => {
    let m = D.messages.find((x) => x.id === id)
    if (!m) { m = { id, role: 'agent', blocks: [] }; D.messages = [...D.messages, m] }
    return m
  }

  switch (b.op) {
    case 'type':
      S.typing = { text: b.text, dur: b.dur, t0: S.elapsed }
      S.typedLen = 0
      D.typed = ''
      return false

    case 'send':
      S.typing = null
      D.messages = [...D.messages, { id: nid('u'), role: 'user', text: D.typed || DEFAULT_ASK }]
      D.typed = ''
      D.thinking = true
      return false

    case 'acts': {
      D.thinking = false
      msg(b.id).acts = b.labels.map((label, i) => ({ id: 'k' + i, label, state: i === 0 ? 'running' : 'pending' }))
      return false
    }

    case 'act': {
      const m = D.messages.find((x) => x.id === b.id)
      if (m?.acts?.[b.i]) { m.acts[b.i].state = b.state; if (b.note) m.acts[b.i].note = b.note }
      return false
    }

    case 'block': {
      const m = msg(b.id)
      m.blocks = [...(m.blocks ?? []), b.block]
      return false
    }

    case 'streaming': {
      const m = D.messages.find((x) => x.id === b.id)
      if (m) m.streaming = b.index
      return false
    }

    case 'finish': {
      const m = D.messages.find((x) => x.id === b.id)
      if (m) { m.streaming = -1; m.done = true }
      return false
    }

    case 'openActs': {
      const m = D.messages.find((x) => x.id === b.id)
      if (m) m.actsOpen = b.open
      return false
    }

    case 'end':
      return true
  }
}
