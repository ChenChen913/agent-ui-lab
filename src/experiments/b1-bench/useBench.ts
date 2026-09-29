import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO, USER_ASK, type Beat, type StepKind } from './scenario'

export interface Sub { id: string; text: string; done: boolean }

/** 一段被插值的时间区间：从 from 到 to，用时 dur，seq 用来给 CSS 动画换 key */
export interface Span { from: number; to: number; dur: number; seq: number }

export interface BenchStep {
  id: string
  label: string
  kind: StepKind
  detail?: string
  note?: string
  retry?: string
  subs: Sub[]
  bar: Span | null
  count: Span | null
  duration?: number
}

export interface BenchState {
  /** 全部出现过的步骤，最新的在前 */
  order: string[]
  steps: Record<string, BenchStep>
  activeId: string | null
  output: { title: string; meta: string } | null
  done: boolean
  /** 屏幕上那句「用户说了什么」。默认用剧本里的问句，用户自己提问后换成他自己的话 */
  ask: string
}

function initial(): BenchState {
  return { order: [], steps: {}, activeId: null, output: null, done: false, ask: USER_ASK }
}

function applyBeat(d: BenchState, b: Beat, seq: { n: number }) {
  switch (b.op) {
    case 'start':
      d.steps[b.id] = {
        id: b.id, label: b.label, kind: b.kind, detail: b.detail,
        subs: [], bar: null, count: null,
      }
      d.order = [b.id, ...d.order]
      d.activeId = b.id
      break

    case 'detail': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, detail: b.text }
      break
    }

    case 'progress': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, bar: { from: s.bar?.to ?? 0, to: b.to, dur: b.dur, seq: ++seq.n } }
      break
    }

    case 'count': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, count: { from: s.count?.to ?? 0, to: b.to, dur: b.dur, seq: ++seq.n } }
      break
    }

    case 'note': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, note: b.text }
      break
    }

    case 'sub': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, subs: [...s.subs, { id: b.sid, text: b.text, done: false }] }
      break
    }

    case 'subdone': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, subs: s.subs.map((x) => (x.id === b.sid ? { ...x, done: true } : x)) }
      break
    }

    case 'retry': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, retry: b.text }
      break
    }

    case 'sink': {
      const s = d.steps[b.id]
      if (s) d.steps[b.id] = { ...s, duration: b.dur, bar: null }
      if (d.activeId === b.id) d.activeId = null
      break
    }

    case 'output':
      d.output = { title: b.title, meta: b.meta }
      break

    case 'end':
      d.done = true
      break
  }
}

/**
 * 用户自己提问时走的那条路。
 *
 * B1 的观点是「过程应该有一个清晰的现在和一个已经过去」，
 * 所以这里不用另一套语法 —— 同样是把目前的步骤放在最上面，
 * 做完一步就沉降下去。只是步子小一些，让人看得见自己触发的结果。
 */
const LIVE_PLAN: Beat[] = [
  { t: 0, op: 'start', id: 'live-think', label: '正在理解你的问题', kind: 'think' },
  { t: 700, op: 'detail', id: 'live-think', text: '先确认你要的是什么' },
  { t: 1300, op: 'sink', id: 'live-think', dur: 1 },

  { t: 1600, op: 'start', id: 'live-search', label: '正在检索可用资料', kind: 'search' },
  { t: 2100, op: 'progress', id: 'live-search', to: 1, dur: 1200 },
  { t: 2500, op: 'count', id: 'live-search', to: 5, dur: 900 },
  { t: 3400, op: 'sink', id: 'live-search', dur: 1.6 },

  { t: 3700, op: 'start', id: 'live-write', label: '正在写回答', kind: 'write' },
  { t: 4100, op: 'sub', id: 'live-write', sid: 'w1', text: '整理要点' },
  { t: 4600, op: 'subdone', id: 'live-write', sid: 'w1' },
  { t: 4750, op: 'sub', id: 'live-write', sid: 'w2', text: '组织语言' },
  { t: 5300, op: 'subdone', id: 'live-write', sid: 'w2' },
  { t: 5600, op: 'sink', id: 'live-write', dur: 1.4 },

  { t: 6200, op: 'output', title: '回答已经写好', meta: '你自己触发的这一段过程' },
  { t: 6200, op: 'end' },
]

/**
 * 按时间线推进剧本。
 *
 * 只有「节拍」会触发 React 重渲染；进度条和计数器交给 CSS / rAF 自己跑，
 * 所以 60fps 下不会有每帧 setState。
 */
export function useBench({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<BenchState>(initial)
  const ref = useRef({ elapsed: 0, idx: 0, draft: initial(), seq: { n: 0 } })
  const timers = useRef<number[]>([])
  const busyRef = useRef(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  // 重开
  useEffect(() => {
    clearTimers()
    busyRef.current = false
    setBusy(false)
    setDraft('')
    ref.current = { elapsed: 0, idx: 0, draft: initial(), seq: { n: 0 } }
    setState(ref.current.draft)
  }, [runId, clearTimers])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const r = ref.current
      r.elapsed += (now - last) * speed
      last = now

      let changed = false
      while (r.idx < SCENARIO.length && SCENARIO[r.idx].t <= r.elapsed) {
        applyBeat(r.draft, SCENARIO[r.idx], r.seq)
        r.idx++
        changed = true
      }
      if (changed) setState({ ...r.draft })
      if (r.idx < SCENARIO.length) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId])

  useEffect(() => clearTimers, [clearTimers])

  /** 用户真的开口：剧本让位，按 LIVE_PLAN 跑一段用户自己触发的过程 */
  const submit = useCallback(() => {
    const text = draft.trim()
    if (!text || busyRef.current) return

    clearTimers()
    const r = ref.current
    r.idx = SCENARIO.length // 演示剧本到此为止
    r.draft = { ...initial(), ask: text }
    r.seq = { n: 0 }
    setDraft('')
    busyRef.current = true
    setBusy(true)
    setState({ ...r.draft })

    const tail = LIVE_PLAN[LIVE_PLAN.length - 1].t
    for (const b of LIVE_PLAN) {
      timers.current.push(
        window.setTimeout(() => {
          const cur = ref.current
          applyBeat(cur.draft, b, cur.seq)
          setState({ ...cur.draft })
          if (b.t === tail) {
            busyRef.current = false
            setBusy(false)
          }
        }, b.t),
      )
    }
  }, [draft, clearTimers])

  return { state, api: { draft, setDraft, submit, busy } }
}
