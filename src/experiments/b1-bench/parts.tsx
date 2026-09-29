import { useEffect, useRef, type CSSProperties } from 'react'
import type { Span } from './useBench'

/** 数字滚动：直接写 DOM，不触发 React 重渲染 */
export function Counter({ span, speed, className }: { span: Span; speed: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ms = Math.max(1, span.dur / speed)
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
      el.textContent = String(Math.round(span.from + (span.to - span.from) * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [span.from, span.to, span.dur, span.seq, speed])

  return <span ref={ref} className={className}>{span.from}</span>
}

/** 进度条走 CSS 动画；换 seq 就重放 */
export function barStyle(span: Span, speed: number): CSSProperties {
  return {
    '--from': `${span.from * 100}%`,
    '--to': `${span.to * 100}%`,
    '--dur': `${Math.round(span.dur / speed)}ms`,
  } as CSSProperties
}
