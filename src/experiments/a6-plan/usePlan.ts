import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAN, SCENARIO, planTotal, reflow, type Beat, type P6State, type Step } from './scenario'

/**
 * A6 · The Plan 的引擎
 *
 * 时间轴上的两根东西每帧都在动：playhead 和正在跑的那根条的填充。
 * 它们不走 React —— 直接改 DOM 上的 style，所以 60fps 下没有一次重渲染。
 * React 只在「哪一步开始 / 落地 / 被改了」这些离散时刻才动。
 *
 * 循环停下的条件写死在这里：剧本走完、且没有一步还在跑。
 */

const fresh = (): P6State => ({ steps: [], total: 0 })

export function usePlan({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<P6State>(fresh)
  const r = useRef({ elapsed: 0, idx: 0, disc: fresh(), mode: 'demo' as 'demo' | 'live' })
  const dom = useRef({
    head: null as HTMLDivElement | null,
    now: null as HTMLSpanElement | null,
    fills: {} as Record<string, HTMLSpanElement | null>,
  })

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, disc: fresh(), mode: 'demo' }
    setState(fresh())
    // dom 里的引用不清 —— 它们由 ref callback 维护，清了 paint 就找不到画布
  }, [runId])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ steps: D.steps.map((s) => ({ ...s })), total: D.total, edited: D.edited })
  }, [])

  const paint = useCallback(() => {
    const R = r.current
    const D = R.disc
    const total = D.total || 1
    if (dom.current.head) dom.current.head.style.left = ((R.elapsed / total) * 100).toFixed(3) + '%'
    if (dom.current.now) dom.current.now.textContent = (R.elapsed / 1000).toFixed(1) + 's'
    for (const s of D.steps) {
      const el = dom.current.fills[s.id]
      if (!el) continue
      const p = s.state === 'done' ? 1 : s.state === 'running' ? Math.min(1, s.run / s.dur) : 0
      el.style.width = (p * 100).toFixed(2) + '%'
    }
  }, [])

  /** live 模式下没人来喊「这一步完了」，跑满就自己落地，并把下一步点起来 */
  const advance = (dt: number) => {
    const D = r.current.disc
    let changed = false
    for (const s of D.steps) {
      if (s.state !== 'running') continue
      s.run += dt
      if (s.run >= s.dur && r.current.mode === 'live') {
        s.run = s.dur
        s.state = 'done'
        changed = true
        const nxt = D.steps.find((x) => x.after === s.id && x.state === 'pending')
        if (nxt) { nxt.state = 'running'; nxt.run = 0 }
      }
    }
    return changed
  }

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const R = r.current
      const dt = (now - last) * speed
      last = now
      R.elapsed += dt

      let dirty = false
      if (advance(dt)) dirty = true
      if (R.mode === 'demo') {
        while (R.idx < SCENARIO.length && SCENARIO[R.idx].t <= R.elapsed) {
          const b = SCENARIO[R.idx]
          R.idx++
          if (b.op === 'end') { R.idx = SCENARIO.length; dirty = true; break }
          applyBeat(R.disc, b)
          dirty = true
        }
      }
      paint()
      if (dirty) commit()

      const busy = R.disc.steps.some((s) => s.state === 'running')
      if ((R.mode === 'demo' && R.idx < SCENARIO.length) || busy) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, commit, paint])

  const api = {
    bindHead: useCallback((el: HTMLDivElement | null) => { dom.current.head = el }, []),
    bindNow: useCallback((el: HTMLSpanElement | null) => { dom.current.now = el }, []),
    bindFill: useCallback((id: string, el: HTMLSpanElement | null) => { dom.current.fills[id] = el }, []),

    /** 改一步的时长。后面挂在它后面的整排跟着挪 —— 涟漪是真的重算 */
    stretch: useCallback((id: string, add: number) => {
      const D = r.current.disc
      const s = D.steps.find((x) => x.id === id)
      if (!s) return
      s.dur = Math.max(1200, s.dur + add)
      reflow(D.steps)
      D.total = planTotal(D.steps)
      D.edited = id
      r.current.mode = 'live'
      commit()
    }, [commit]),

    /** 改一步写的是什么 */
    relabel: useCallback((id: string, label: string) => {
      const D = r.current.disc
      const s = D.steps.find((x) => x.id === id)
      if (!s || !label.trim()) return
      s.label = label.trim()
      D.edited = id
      r.current.mode = 'live'
      commit()
    }, [commit]),

    reset: useCallback(() => {
      const steps = PLAN.map((s) => ({ ...s }))
      reflow(steps)
      r.current = { elapsed: 0, idx: 0, disc: { steps, total: planTotal(steps) }, mode: 'live' }
      steps[0].state = 'running'
      r.current.disc.steps = steps
      commit()
    }, [commit]),
  }

  return { state, api }
}

function applyBeat(D: P6State, b: Beat) {
  switch (b.op) {
    case 'plan':
      D.steps = reflow(b.steps.map((s) => ({ ...s })))
      D.total = planTotal(D.steps)
      return
    case 'run': {
      const s = D.steps.find((x) => x.id === b.id)
      if (s && s.state === 'pending') { s.state = 'running'; s.run = 0 }
      return
    }
    case 'done': {
      const s = D.steps.find((x) => x.id === b.id)
      if (s) { s.state = 'done'; s.run = s.dur; if (b.note) s.note = b.note }
      const nxt = D.steps.find((x) => x.after === b.id && x.state === 'pending')
      if (nxt) { nxt.state = 'running'; nxt.run = 0 }
      return
    }
    case 'fix': {
      const s = D.steps.find((x) => x.id === b.id)
      if (!s) return
      s.label = b.label
      s.dur += b.add
      reflow(D.steps)
      D.total = planTotal(D.steps)
      D.edited = b.id
      return
    }
  }
}

export type { Step }
