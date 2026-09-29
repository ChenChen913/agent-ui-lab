import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, typingFrame, type BeatRunner } from '../../shared/beat'
import { DEFAULT_ASK, SCENARIO, type Beat, type Task } from './scenario'

export interface W13State { typed: string; tasks: Task[] }
const fresh = (): W13State => ({ typed: '', tasks: [] })
let uid = 0
const nid = (p: string) => p + ++uid
const clone = (t: Task[]) => t.map((x) => ({ ...x, steps: x.steps.map((s) => ({ ...s })), alert: x.alert ? { ...x.alert, options: [...x.alert.options] } : undefined }))
const CANNED = ['收到。演示环境里回复是固定的，点右上角的播放键可以看到三种不同分量的过程。', '好。']
let ci = 0

export function useWeight({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<W13State>(fresh)
  const r = useRef<BeatRunner<W13State>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const timers = useRef<number[]>([])
  const commit = useCallback(() => { const D = r.current.disc; setState({ ...D, tasks: clone(D.tasks) }) }, [])
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
      const id = nid('t')
      D.tasks = [...D.tasks, { id, ask: t, size: 'mini', steps: [], open: false }]
      D.typed = ''; commit()
      timers.current.push(window.setTimeout(() => {
        const x = r.current.disc.tasks.find((y) => y.id === id)
        if (x) { x.answer = CANNED[ci++ % CANNED.length]; x.steps = [{ label: '理解', state: 'done' }, { label: '生成', state: 'done' }]; commit() }
      }, 1400))
    }, [commit]),
    toggle: useCallback((id: string) => { const t = r.current.disc.tasks.find((x) => x.id === id); if (t) t.open = !t.open; commit() }, [commit]),
    answerAlert: useCallback((id: string, text: string) => {
      const t = r.current.disc.tasks.find((x) => x.id === id)
      if (t) { t.alert = undefined; t.steps = t.steps.map((s, i) => (i === 1 ? { ...s, state: 'done', note: text } : s)) }
      commit()
    }, [commit]),
    reset: useCallback(() => { clearTimers(); r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }; setState(r.current.disc) }, []),
    pick: useCallback((t: string) => { r.current.disc.typed = t; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }
  return { state, api }
}

function applyBeat(S: BeatRunner<W13State>, b: Beat): boolean {
  const D = S.disc
  const t = (id: string) => D.tasks.find((x) => x.id === id)
  switch (b.op) {
    case 'type': S.typing = { text: b.text, dur: b.dur, t0: S.elapsed }; S.typedLen = 0; D.typed = ''; return false
    case 'send': S.typing = null; D.tasks = [...D.tasks, { id: b.id, ask: b.ask || D.typed || DEFAULT_ASK, size: 'none', steps: [], open: false }]; D.typed = ''; return false
    case 'size': { const x = t(b.id); if (x) { x.size = b.size; if (b.grew) x.grew = true } return false }
    case 'steps': { const x = t(b.id); if (x) x.steps = b.labels.map((label) => ({ label, state: 'pending' as const })); return false }
    case 'step': { const x = t(b.id); if (x?.steps[b.i]) { x.steps[b.i].state = b.state; if (b.note) x.steps[b.i].note = b.note } return false }
    case 'answer': { const x = t(b.id); if (x) { x.answer = b.text; x.grew = x.grew } return false }
    case 'alert': { const x = t(b.id); if (x) x.alert = { text: b.text, options: b.options }; return false }
    case 'clear': return false
    case 'end': return true
  }
}
