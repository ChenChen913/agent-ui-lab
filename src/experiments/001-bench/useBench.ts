import { useEffect, useRef, useState } from 'react'
import { SCENARIO, type Beat, type StepKind } from './scenario'

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
}

function initial(): BenchState {
  return { order: [], steps: {}, activeId: null, output: null, done: false }
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
 * 按时间线推进剧本。
 *
 * 只有「节拍」会触发 React 重渲染；进度条和计数器交给 CSS / rAF 自己跑，
 * 所以 60fps 下不会有每帧 setState。
 */
export function useBench({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<BenchState>(initial)
  const ref = useRef({ elapsed: 0, idx: 0, draft: initial(), seq: { n: 0 } })

  // 重开
  useEffect(() => {
    ref.current = { elapsed: 0, idx: 0, draft: initial(), seq: { n: 0 } }
    setState(ref.current.draft)
  }, [runId])

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

  return state
}
