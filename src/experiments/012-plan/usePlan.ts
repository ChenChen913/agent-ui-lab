import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, typingFrame, type BeatRunner } from '../../shared/beat'
import { DEFAULT_ASK, PLAN, SCENARIO, ripple, type Beat, type Step } from './scenario'

export interface P12State {
  typed: string
  intro: string
  steps: Step[]
  summary: string | null
  result: { title: string; desc: string; meta: string } | null
}

const fresh = (): P12State => ({ typed: '', intro: '', steps: [], summary: null, result: null })

let uid = 0
const nid = (p: string) => p + ++uid
const clone = (steps: Step[]) => steps.map((s) => ({ ...s, deps: [...s.deps], items: s.items ? s.items.map((i) => ({ ...i })) : undefined }))

const CANNED = [
  '收到。演示环境里我的回复是固定的，点右上角的播放键可以看完整的重排流程。',
  '好。你可以直接点任何一步改它，改完我会沿着依赖关系告诉你哪些步骤要重做。',
]
let ci = 0

export function usePlan({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<P12State>(fresh)
  const r = useRef<BeatRunner<P12State>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const timers = useRef<number[]>([])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ ...D, steps: clone(D.steps) })
  }, [])

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  useEffect(() => {
    clearTimers()
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, typing: typingFrame, commit })

  /** 改一步：算涟漪，把下游标成 stale，并给出汇总 */
  const doRipple = useCallback((id: string) => {
    const D = r.current.disc
    const hit = new Set(ripple(D.steps, id))
    D.steps = D.steps.map((s) => (hit.has(s.id) ? { ...s, state: 'stale' as const } : s))
    const names = D.steps.filter((s) => hit.has(s.id)).map((s) => s.no)
    const keep = D.steps.filter((s) => !hit.has(s.id) && s.id !== id).map((s) => s.no)
    D.summary = names.length
      ? '这一步改了：' + names.join('、') + ' 要重做' + (keep.length ? '，' + keep.join('、') + ' 不受影响' : '')
      : '这一步改了，不影响其他步骤'
    commit()
    const t = window.setTimeout(() => {
      const D2 = r.current.disc
      D2.steps = D2.steps.map((s) => (s.state === 'stale' ? { ...s, state: 'pending', output: undefined } : s))
      D2.summary = null
      commit()
    }, 1700)
    timers.current.push(t)
  }, [commit])

  const api = {
    send: useCallback((text: string) => {
      const t = text.trim(); if (!t) return
      const D = r.current.disc
      r.current.mode = 'live'
      D.typed = ''
      D.intro = '收到。我先拆成几步，任何一步你都可以当场改。'
      D.steps = clone(PLAN)
      commit()
      timers.current.push(window.setTimeout(() => {
        const D2 = r.current.disc
        D2.steps = D2.steps.map((s, i) => (i === 0 ? { ...s, state: 'done' as const, output: '技术路线 / 商业模式 / 开源生态 / 定价' } : s))
        D2.intro = CANNED[ci++ % CANNED.length]
        commit()
      }, 1800))
    }, [commit]),

    /** 用户手动改某一步的标题 */
    editStep: useCallback((id: string, title: string) => {
      const s = r.current.disc.steps.find((x) => x.id === id)
      if (!s) return
      s.title = title
      s.state = 'pending'
      s.output = undefined
      commit()
      doRipple(id)
    }, [commit, doRipple]),

    removeStep: useCallback((id: string) => {
      const D = r.current.disc
      D.steps = D.steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, no: i + 1, deps: s.deps.filter((d) => d !== id) }))
      commit()
      doRipple(id)
    }, [commit, doRipple]),

    addStep: useCallback((title: string) => {
      const D = r.current.disc
      D.steps = [...D.steps, { id: nid('s'), no: D.steps.length + 1, title, detail: '你加的', state: 'pending', deps: [] }]
      commit()
    }, [commit]),

    /** 回答 Agent 抛出来的口径问题 —— 这就是演示里那次重排 */
    answer: useCallback((id: string, text: string) => {
      const s = r.current.disc.steps.find((x) => x.id === id)
      if (!s) return
      s.question = undefined
      s.options = undefined
      s.answer = text
      s.state = 'pending'
      commit()
      doRipple(id)
    }, [commit, doRipple]),

    interrupt: useCallback(() => {
      clearTimers()
      const D = r.current.disc
      D.steps = D.steps.map((s) => (s.state === 'running' ? { ...s, state: 'pending' as const, note: '被你打断' } : s))
      D.summary = '已打断'
      commit()
    }, [commit]),

    reset: useCallback(() => {
      clearTimers()
      r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }
      setState(r.current.disc)
    }, []),

    pick: useCallback((t: string) => { r.current.disc.typed = t; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api }
}

function applyBeat(S: BeatRunner<P12State>, b: Beat): boolean {
  const D = S.disc
  const step = (id: string) => D.steps.find((x) => x.id === id)
  switch (b.op) {
    case 'type': S.typing = { text: b.text, dur: b.dur, t0: S.elapsed }; S.typedLen = 0; D.typed = ''; return false
    case 'send': S.typing = null; D.typed = ''; return false
    case 'intro': D.intro = b.text; return false
    case 'plan': D.steps = clone(PLAN); return false
    case 'step': { const s = step(b.id); if (s) Object.assign(s, b.patch); return false }
    case 'items': { const s = step(b.id); if (s) s.items = b.labels.map((label) => ({ label, state: 'pending' as const })); return false }
    case 'item': { const s = step(b.id); if (s?.items?.[b.i]) s.items[b.i].state = b.state; return false }
    case 'ask': { const s = step(b.id); if (s) { s.state = 'asking'; s.question = b.question; s.options = b.options } return false }
    case 'answer': { const s = step(b.id); if (s) { s.question = undefined; s.options = undefined; s.answer = b.text; s.state = 'running'; s.note = '重新搜索' } return false }
    case 'ripple': {
      const hit = new Set(ripple(D.steps, b.id))
      D.steps = D.steps.map((s) => (hit.has(s.id) ? { ...s, state: 'stale' as const } : s))
      D.summary = b.summary
      return false
    }
    case 'apply':
      D.steps = D.steps.map((s) => (s.state === 'stale' ? { ...s, state: 'pending' as const, output: undefined } : s))
      D.summary = null
      return false
    case 'result': D.result = { title: b.title, desc: b.desc, meta: b.meta }; return false
    case 'end': return true
  }
}
