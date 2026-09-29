import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { LANES, TOTAL, laneAt } from './scenario'

export interface View { start: number; dur: number }

export interface ChronicleState {
  live: boolean
  laneId: string | null
  segIdx: number
  zoomed: boolean
  selected: string | null
  hover: string | null
}

interface BarRef { el: HTMLElement; from: number; to: number; gap: boolean }
interface TickRef { el: HTMLElement; line: HTMLElement; label: HTMLElement }

const TICK_STEPS = [500, 1000, 2000, 5000, 10000, 20000, 60000]
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

export function useChronicle(opts: {
  playing: boolean
  speed: number
  runId: number
  chartRef: RefObject<HTMLDivElement | null>
  headRef: RefObject<HTMLDivElement | null>
  ticksRef: RefObject<HTMLDivElement | null>
  ovViewRef: RefObject<HTMLDivElement | null>
  ovHeadRef: RefObject<HTMLDivElement | null>
  clockRef: RefObject<HTMLSpanElement | null>
}) {
  const { playing, speed, runId, chartRef, headRef, ticksRef, ovViewRef, ovHeadRef, clockRef } = opts

  const [state, setState] = useState<ChronicleState>({
    live: true, laneId: null, segIdx: -1, zoomed: false, selected: null, hover: null,
  })

  const L = useRef({ realT: 0, t: 0, isLive: true, follow: true, view: { start: 0, dur: TOTAL } as View })
  const bars = useRef<BarRef[]>([])
  const ticks = useRef<TickRef[]>([])
  const paintRef = useRef<() => void>(() => {})
  const keyRef = useRef('')

  // 每次渲染后重建元素缓存（只在离散状态变化时跑，不是每帧）
  useEffect(() => {
    const c = chartRef.current
    if (c) {
      bars.current = Array.from(c.querySelectorAll<HTMLElement>('[data-bar]')).map((el) => ({
        el,
        from: Number(el.dataset.from),
        to: Number(el.dataset.to),
        gap: el.dataset.gap === '1',
      }))
    }
    const tk = ticksRef.current
    if (tk) {
      ticks.current = Array.from(tk.querySelectorAll<HTMLElement>('.cr-tick')).map((el) => ({
        el,
        line: el.querySelector('i') as HTMLElement,
        label: el.querySelector('span') as HTMLElement,
      }))
    }
  })

  // 重开
  useEffect(() => {
    L.current = { realT: 0, t: 0, isLive: true, follow: true, view: { start: 0, dur: TOTAL } }
    keyRef.current = ''
    setState({ live: true, laneId: null, segIdx: -1, zoomed: false, selected: null, hover: null })
    paintRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    const paint = () => {
      const S = L.current
      const c = chartRef.current
      if (!c) return
      const W = c.clientWidth
      const v = S.view
      const pxPerMs = W / v.dur

      // ① 条：从 start 长到 min(t, end)
      for (const b of bars.current) {
        const from = Math.max(b.from, v.start)
        const to = Math.min(Math.min(S.t, b.to), v.start + v.dur)
        if (to <= from) { b.el.style.opacity = '0'; continue }
        b.el.style.opacity = '1'
        b.el.style.transform = 'translate3d(' + ((from - v.start) * pxPerMs).toFixed(1) + 'px,0,0)'
        b.el.style.width = Math.max(1, (to - from) * pxPerMs - (b.gap ? 2 : 0)).toFixed(1) + 'px'
      }

      // ② 播放头
      if (headRef.current) {
        const x = (S.t - v.start) * pxPerMs
        headRef.current.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)'
        headRef.current.style.opacity = x >= -1 && x <= W + 1 ? '1' : '0'
      }

      // ③ 刻度
      let step = TICK_STEPS[TICK_STEPS.length - 1]
      for (const s of TICK_STEPS) { if (v.dur / s <= 9) { step = s; break } }
      const first = Math.ceil(v.start / step) * step
      for (let i = 0; i < ticks.current.length; i++) {
        const tk = ticks.current[i]
        const tt = first + i * step
        if (tt > v.start + v.dur + step * 0.5) { tk.el.style.opacity = '0'; continue }
        const x = (tt - v.start) * pxPerMs
        tk.el.style.opacity = x >= -40 && x <= W + 40 ? '1' : '0'
        tk.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)'
        tk.label.textContent = (step >= 1000 ? (tt / 1000).toFixed(0) : (tt / 1000).toFixed(1)) + 's'
      }

      // ④ 概览视窗
      if (ovViewRef.current) {
        ovViewRef.current.style.left = ((v.start / TOTAL) * 100).toFixed(3) + '%'
        ovViewRef.current.style.width = ((v.dur / TOTAL) * 100).toFixed(3) + '%'
      }
      if (ovHeadRef.current) ovHeadRef.current.style.left = ((S.t / TOTAL) * 100).toFixed(3) + '%'

      // ⑤ 计时
      if (clockRef.current) clockRef.current.textContent = (S.t / 1000).toFixed(2) + 's'
    }
    paintRef.current = paint

    if (!playing) { paint(); return }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const S = L.current
      S.realT = Math.min(TOTAL, S.realT + (now - last) * speed)
      last = now
      if (S.isLive) S.t = S.realT
      if (S.follow && S.isLive) {
        const want = S.t - S.view.dur * 0.78
        if (want > S.view.start || S.t < S.view.start) {
          S.view.start = clamp(want, 0, Math.max(0, TOTAL - S.view.dur))
        }
      }
      paint()

      const a = laneAt(S.t)
      const key = (a ? a.lane.id + '#' + a.seg : '') + (S.isLive ? 'L' : '')
      if (key !== keyRef.current) {
        keyRef.current = key
        setState((p) => ({ ...p, live: S.isLive, laneId: a ? a.lane.id : null, segIdx: a ? a.seg : -1 }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, chartRef, headRef, ticksRef, ovViewRef, ovHeadRef, clockRef])

  const sync = useCallback(() => {
    const S = L.current
    const a = laneAt(S.t)
    keyRef.current = (a ? a.lane.id + '#' + a.seg : '') + (S.isLive ? 'L' : '')
    setState((p) => ({ ...p, live: S.isLive, laneId: a ? a.lane.id : null, segIdx: a ? a.seg : -1 }))
  }, [])

  /** 点击定位：把播放头放到某个时刻，并暂停实时跟随 */
  const scrubTo = useCallback((clientX: number) => {
    const c = chartRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const S = L.current
    const f = clamp((clientX - r.left) / r.width, 0, 1)
    S.t = clamp(S.view.start + f * S.view.dur, 0, TOTAL)
    S.isLive = false
    paintRef.current()
    sync()
  }, [chartRef, sync])

  /** 拖动平移（抓住图纸拖） */
  const panBy = useCallback((dxPx: number) => {
    const c = chartRef.current
    if (!c) return
    const S = L.current
    S.view.start = clamp(S.view.start - dxPx * (S.view.dur / c.clientWidth), 0, Math.max(0, TOTAL - S.view.dur))
    S.follow = false
    paintRef.current()
  }, [chartRef])

  /** 滚轮缩放：以鼠标位置为锚点 */
  const zoomAt = useCallback((factor: number, clientX: number) => {
    const c = chartRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const S = L.current
    const f = clamp((clientX - r.left) / r.width, 0, 1)
    const anchor = S.view.start + f * S.view.dur
    const nd = clamp(S.view.dur * factor, 2400, TOTAL)
    S.view.dur = nd
    S.view.start = clamp(anchor - f * nd, 0, Math.max(0, TOTAL - nd))
    S.follow = false
    setState((p) => (p.zoomed === nd < TOTAL * 0.5 ? p : { ...p, zoomed: nd < TOTAL * 0.5 }))
    paintRef.current()
  }, [chartRef])

  const fit = useCallback(() => {
    const S = L.current
    S.view = { start: 0, dur: TOTAL }
    S.follow = true
    setState((p) => (p.zoomed ? { ...p, zoomed: false } : p))
    paintRef.current()
  }, [])

  const goLive = useCallback(() => {
    const S = L.current
    S.isLive = true
    S.follow = true
    S.t = S.realT
    paintRef.current()
    sync()
  }, [sync])

  const setHover = useCallback((id: string | null) => {
    setState((p) => (p.hover === id ? p : { ...p, hover: id }))
  }, [])
  const setSelected = useCallback((id: string | null) => {
    setState((p) => (p.selected === id ? p : { ...p, selected: id }))
  }, [])

  /** 跳到某条泳道的开始（点泳道名用） */
  const jumpTo = useCallback((t: number) => {
    const S = L.current
    S.t = clamp(t, 0, TOTAL)
    S.isLive = false
    if (S.t < S.view.start || S.t > S.view.start + S.view.dur) {
      S.view.start = clamp(S.t - S.view.dur * 0.3, 0, Math.max(0, TOTAL - S.view.dur))
    }
    paintRef.current()
    sync()
  }, [sync])

  return { state, L, lanes: LANES, scrubTo, panBy, zoomAt, fit, goLive, setHover, setSelected, jumpTo }
}
