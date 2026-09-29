import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, typingFrame, type BeatRunner } from '../../shared/beat'
import { DEFAULT_ASK, SCENARIO, type Beat, type Block, type Msg, type StepState } from './scenario'

export interface HmState {
  typed: string
  messages: Msg[]
  steps: { id: string; label: string; state: StepState }[]
  stepsOpen: boolean
  ctx: { files: number; sources: number; tools: number; memory: boolean; open: boolean }
}

const fresh = (): HmState => ({
  typed: '', messages: [], steps: [], stepsOpen: false,
  ctx: { files: 0, sources: 0, tools: 0, memory: false, open: false },
})

let uid = 0
const nid = (p: string) => p + ++uid
const CANNED = [
  '收到。演示环境里回复是固定的，点右上角的播放键可以看到完整的一次执行。',
  '好。左边是导航，右边是 Context，它记录我这轮用了什么。',
]
let ci = 0

export function useHome({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<HmState>(fresh)
  const r = useRef<BeatRunner<HmState>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const timers = useRef<number[]>([])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({
      ...D,
      messages: D.messages.map((m) => ({ ...m, blocks: m.blocks ? [...m.blocks] : undefined })),
      steps: D.steps.map((s) => ({ ...s })),
      ctx: { ...D.ctx },
    })
  }, [])

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  useEffect(() => {
    clearTimers()
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, typing: typingFrame, commit })

  const api = {
    send: useCallback((text: string) => {
      const t = text.trim(); if (!t) return
      const D = r.current.disc
      r.current.mode = 'live'
      D.messages = [...D.messages, { id: nid('u'), role: 'user', text: t }]
      D.typed = ''
      D.steps = [{ id: 's1', label: '思考', state: 'running' }]
      commit()
      const id = nid('m')
      const reply = CANNED[ci++ % CANNED.length]
      timers.current.push(window.setTimeout(() => {
        const D2 = r.current.disc
        D2.steps = [{ id: 's1', label: '思考', state: 'done' }, { id: 's2', label: '生成回复', state: 'done' }]
        D2.messages = [...D2.messages, { id, role: 'agent', blocks: [{ kind: 'p', text: reply }], done: true }]
        D2.ctx.tools = 1
        commit()
      }, 1200))
    }, [commit]),

    toggleSteps: useCallback(() => { r.current.disc.stepsOpen = !r.current.disc.stepsOpen; commit() }, [commit]),
    toggleCtx: useCallback(() => { r.current.disc.ctx.open = !r.current.disc.ctx.open; commit() }, [commit]),
    goHome: useCallback(() => {
      clearTimers()
      r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }
      setState(r.current.disc)
    }, []),
    pick: useCallback((t: string) => { r.current.disc.typed = t; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api }
}

function applyBeat(S: BeatRunner<HmState>, b: Beat): boolean {
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
      D.typed = ''
      return false
    case 'steps': D.steps = b.labels.map((label, i) => ({ id: 'k' + i, label, state: i === 0 ? 'running' : 'pending' })); return false
    case 'step': if (D.steps[b.i]) D.steps[b.i].state = b.state; return false
    case 'block': { const m = msg(b.id); m.blocks = [...(m.blocks ?? []), b.block]; return false }
    case 'streaming': { const m = D.messages.find((x) => x.id === b.id); if (m) m.streaming = b.index; return false }
    case 'finish': { const m = D.messages.find((x) => x.id === b.id); if (m) { m.streaming = -1; m.done = true } return false }
    case 'ctx':
      if (b.files != null) D.ctx.files = b.files
      if (b.sources != null) D.ctx.sources = b.sources
      if (b.tools != null) D.ctx.tools = b.tools
      if (b.memory != null) D.ctx.memory = b.memory
      return false
    case 'end': return true
  }
}
