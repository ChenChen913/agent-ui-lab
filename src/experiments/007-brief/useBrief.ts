import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO, TOTAL, DEFAULT_ASK, type Beat, type Clause, type Stage, type StepState } from './scenario'

export interface BriefState {
  stage: Stage
  typed: string
  ask: string
  clauses: Clause[]
  stamped: boolean
}

/** 回答被吸收进条款正文之后的样子 —— 这就是「对话消失」的具体含义 */
const ANSWER_INTO: Record<string, string> = {
  'c2:A、B、C': '三条产品线：A、B、C',
  'c3:不含税': '按 GMV（不含税）',
  'c4:可以': '周报 4 份（读不到 analytics）',
  'c3:改用含税': '按含税 GMV',
}

function absorb(c: Clause, text: string) {
  const hit = ANSWER_INTO[c.id + ':' + text]
  if (hit) c.text = hit
}

const fresh = (ask = ''): BriefState => ({
  stage: 'idle', typed: '', ask, clauses: [], stamped: false,
})

export function useBrief({ playing, speed, runId, askOverride }: {
  playing: boolean; speed: number; runId: number; askOverride?: string
}) {
  const [state, setState] = useState<BriefState>(() => fresh(askOverride ?? ''))
  const r = useRef({
    elapsed: 0, idx: 0,
    typing: null as null | { text: string; dur: number; t0: number },
    typedLen: 0,
    disc: fresh(askOverride ?? ''),
  })
  const timers = useRef<number[]>([])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({
      ...D,
      clauses: D.clauses.map((c) => ({ ...c, steps: c.steps ? c.steps.map((s) => ({ ...s })) : undefined })),
    })
  }, [])

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  useEffect(() => {
    clearTimers()
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(askOverride ?? '') }
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

      while (S.idx < SCENARIO.length && SCENARIO[S.idx].t <= S.elapsed) {
        dirty = applyBeat(S, SCENARIO[S.idx], askOverride ?? '') || dirty
        S.idx++
      }

      if (S.typing) {
        const p = Math.min(1, (S.elapsed - S.typing.t0) / S.typing.dur)
        const n = Math.round(p * S.typing.text.length)
        if (n !== S.typedLen) { S.typedLen = n; D.typed = S.typing.text.slice(0, n); dirty = true }
        if (p >= 1) S.typing = null
      }

      if (dirty) commit()
      if (S.idx < SCENARIO.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, askOverride, commit])

  // ── 用户能做的事 ─────────────────────────────────────────
  const patch = (id: string, p: Partial<Clause>) => {
    const c = r.current.disc.clauses.find((x) => x.id === id)
    if (c) Object.assign(c, p)
    commit()
  }

  const api = {
    /** 回答某一条的提问 */
    answer: useCallback((id: string, text: string) => {
      const c = r.current.disc.clauses.find((x) => x.id === id)
      if (!c) return
      c.answer = text
      c.question = undefined
      c.options = undefined
      absorb(c, text)
      commit()
      const t = window.setTimeout(() => {
        const c2 = r.current.disc.clauses.find((x) => x.id === id)
        if (c2 && c2.state === 'asking') { c2.state = 'draft'; commit() }
      }, 900)
      timers.current.push(t)
    }, [commit]),

    /** 只重跑这一条 */
    rerun: useCallback((id: string) => {
      const c = r.current.disc.clauses.find((x) => x.id === id)
      if (!c) return
      c.state = 'working'
      c.note = undefined
      c.answer = undefined
      c.steps = undefined
      c.open = true
      r.current.disc.stage = 'working'
      r.current.disc.stamped = false
      commit()
      const t = window.setTimeout(() => {
        const c2 = r.current.disc.clauses.find((x) => x.id === id)
        if (c2 && c2.state === 'working') {
          c2.state = 'done'
          c2.note = '1460 字 · 1.7s'
          c2.open = false
          commit()
        }
      }, 2000)
      timers.current.push(t)
    }, [commit]),

    toggleOpen: useCallback((id: string) => {
      const c = r.current.disc.clauses.find((x) => x.id === id)
      if (!c || !c.steps) return
      c.open = !c.open
      commit()
    }, [commit]),

    /** 确认并开始 */
    start: useCallback(() => {
      const D = r.current.disc
      if (D.stage !== 'ready') return
      D.stage = 'working'
      commit()
      const order = ['c1', 'c4', 'c2', 'c3', 'c5']
      order.forEach((id, i) => {
        const t1 = window.setTimeout(() => {
          const c = D.clauses.find((x) => x.id === id)
          if (c && c.state === 'draft') { c.state = 'working'; commit() }
        }, 300 + i * 2600)
        const t2 = window.setTimeout(() => {
          const c = D.clauses.find((x) => x.id === id)
          if (c && c.state === 'working') { c.state = 'done'; c.note = '1.2s'; commit() }
        }, 2600 + i * 2600)
        timers.current.push(t1, t2)
      })
      const done = window.setTimeout(() => {
        D.stage = 'done'; D.stamped = true; commit()
      }, 300 + order.length * 2600)
      timers.current.push(done)
    }, [commit]),

    /** 加一条它没想到的约束 */
    addClause: useCallback((text: string) => {
      const D = r.current.disc
      const nos = ['一', '二', '三', '四', '五', '六', '七', '八']
      const c: Clause = {
        id: 'x' + Date.now(), no: nos[D.clauses.length] ?? '·',
        title: '补充', text, state: 'draft', note: '已加入委托',
      }
      D.clauses = [...D.clauses, c]
      commit()
    }, [commit]),

    /** 打断 */
    interrupt: useCallback(() => {
      const D = r.current.disc
      clearTimers()
      const cur = D.clauses.find((c) => c.state === 'working')
      if (cur) { cur.state = 'error'; cur.note = '被你打断' }
      D.stage = 'done'
      commit()
    }, [commit]),

    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api, total: TOTAL, patch }
}

function applyBeat(
  S: { elapsed: number; typing: any; typedLen: number; disc: BriefState },
  b: Beat,
  askOverride: string,
): boolean {
  const D = S.disc
  switch (b.op) {
    case 'type':
      S.typing = { text: askOverride || b.text, dur: b.dur, t0: S.elapsed }
      S.typedLen = 0
      D.typed = ''
      return true

    case 'submit':
      S.typing = null
      D.ask = askOverride || D.typed || DEFAULT_ASK
      D.typed = ''
      D.stage = 'drafting'
      return true

    case 'stage':
      D.stage = b.stage
      return true

    case 'clause':
      D.clauses = [...D.clauses, { id: b.id, no: b.no, title: b.title, text: b.text, state: 'draft' }]
      return true

    case 'set': {
      const c = D.clauses.find((x) => x.id === b.id)
      if (c) Object.assign(c, b.patch)
      return true
    }

    case 'ask': {
      const c = D.clauses.find((x) => x.id === b.id)
      if (c) { c.state = 'asking'; c.question = b.question; c.options = b.options; c.answer = undefined }
      return true
    }

    case 'answer': {
      const c = D.clauses.find((x) => x.id === b.id)
      if (c) {
        c.answer = b.text
        c.question = undefined
        c.options = undefined
        absorb(c, b.text)
        if (c.state === 'asking') c.state = 'draft'
      }
      return true
    }

    case 'steps': {
      const c = D.clauses.find((x) => x.id === b.id)
      if (c) {
        c.steps = b.labels.map((label) => ({ label, state: 'pending' as StepState }))
        c.open = true
      }
      return true
    }

    case 'step': {
      const c = D.clauses.find((x) => x.id === b.id)
      if (c && c.steps && c.steps[b.i]) c.steps[b.i].state = b.state
      return true
    }

    case 'rerun': {
      const c = D.clauses.find((x) => x.id === b.id)
      if (c) {
        c.state = 'working'; c.note = undefined; c.answer = undefined
        c.steps = undefined; c.open = true
      }
      return true
    }

    case 'stamp':
      D.stamped = true
      return true

    case 'end':
      return false
  }
}
