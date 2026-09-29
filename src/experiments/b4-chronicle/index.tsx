import { useEffect, useRef, useState } from 'react'
import { LANES, TOTAL, ASK, EVAL_GROUP, GAPS, MARKERS, breadcrumb } from './scenario'
import { useChronicle } from './useChronicle'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 004 · Chronicle —— 「时间不是序号，是长度」
 *
 * X 轴是真实毫秒。一根条有多长，它真的就花了多久。
 * 并行的三路调研变成三条上下对齐的泳道 —— 谁慢一眼就看出来。
 *
 * 整张图是当前时刻 t 的纯函数（条从 start 长到 min(t,end)，播放头在 t），
 * 所以拖动播放头 = 时间旅行，不需要第二套渲染逻辑。
 */

const ROW = 34
const BARH = 16
const TICKS = 16

const EVAL_TOP = LANES.findIndex((l) => l.id === EVAL_GROUP.lanes[0])
const pct = (v: number) => (v / TOTAL) * 100 + '%'

export default function Chronicle({ playing, speed, runId }: Ctl) {
  const chartRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const ticksRef = useRef<HTMLDivElement>(null)
  const ovViewRef = useRef<HTMLDivElement>(null)
  const ovHeadRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const drag = useRef({ active: false, lastX: 0, moved: 0, target: null as HTMLElement | null })
  const [theme, setTheme] = useState('paper')

  const { state, scrubTo, panBy, zoomAt, fit, goLive, setHover, setSelected, jumpTo } = useChronicle({
    playing, speed, runId, chartRef, headRef, ticksRef, ovViewRef, ovHeadRef, clockRef,
  })

  // 滚轮缩放要用非 passive 的原生监听
  useEffect(() => {
    const c = chartRef.current
    if (!c) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomAt(Math.exp((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.0015), e.clientX)
    }
    c.addEventListener('wheel', onWheel, { passive: false })
    return () => c.removeEventListener('wheel', onWheel)
  }, [zoomAt, chartRef])

  const onDown = (e: React.PointerEvent) => {
    drag.current = { active: true, lastX: e.clientX, moved: 0, target: e.target as HTMLElement }
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (d.active) {
      const dx = e.clientX - d.lastX
      d.lastX = e.clientX
      d.moved += Math.abs(dx)
      if (d.moved > 3) panBy(dx)
      return
    }
    const el = (e.target as HTMLElement).closest('[data-bar]') as HTMLElement | null
    setHover(el ? el.dataset.bar + '#' + el.dataset.seg : null)
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    if (d.moved > 3) return
    const el = d.target?.closest?.('[data-bar]') as HTMLElement | null
    if (el) { setSelected(el.dataset.bar + '#' + el.dataset.seg); return }
    setSelected(null)
    scrubTo(e.clientX)
  }

  const lane = LANES.find((l) => l.id === state.laneId) ?? null
  const seg = lane && state.segIdx >= 0 ? lane.segments[state.segIdx] : null

  const hoverLane = state.hover ? LANES.find((l) => l.id === state.hover!.split('#')[0]) : null
  const hoverSeg = state.hover ? hoverLane?.segments[Number(state.hover.split('#')[1])] : null

  return (
    <div className="cr" data-theme={theme}>
      <div className="cr-frame">
        <header className="cr-head">
          <div className="cr-head-l">
            <span className="cr-brand">CHRONICLE</span>
            <span className="cr-ask">{ASK}</span>
          </div>
          <div className="cr-head-r">
            <span className="cr-meta">
              {(TOTAL / 1000).toFixed(1)}s · {LANES.length} 条泳道 · 3 路并行
            </span>
            <button
              className="cr-btn"
              onClick={() => setTheme((t) => (t === 'paper' ? 'blueprint' : 'paper'))}
            >
              {theme === 'paper' ? '深色' : '图纸'}
            </button>
          </div>
        </header>

        {/* 概览：整条会话的缩略图 + 可拖的视窗 */}
        <div className="cr-ov">
          {LANES.map((l, i) => {
            const s = l.segments[0].start
            const e = l.segments[l.segments.length - 1].end
            return (
              <i
                key={l.id}
                className="cr-ov-bar"
                style={{ top: i * 4, left: pct(s), width: pct(e - s) }}
              />
            )
          })}
          {GAPS.map((g, i) => (
            <i key={i} className="cr-ov-gap" style={{ left: pct(g.start), width: pct(g.end - g.start) }} />
          ))}
          {MARKERS.map((m, i) => (
            <i key={i} className="cr-ov-mark" style={{ left: pct(m.t) }} />
          ))}
          <div className="cr-ov-view" ref={ovViewRef} />
          <div className="cr-ov-head" ref={ovHeadRef} />
        </div>

        <div className="cr-body">
          {/* 左侧泳道名 + 并行组的方括号 */}
          <div className="cr-gutter" style={{ height: LANES.length * ROW }}>
            <div
              className="cr-group"
              style={{ top: EVAL_TOP * ROW, height: EVAL_GROUP.lanes.length * ROW }}
            >
              <span className="cr-group-label">{EVAL_GROUP.label}</span>
            </div>
            {LANES.map((l, i) => (
              <button
                key={l.id}
                className={
                  'cr-lane-name' +
                  (l.group ? ' is-group' : '') +
                  (state.laneId === l.id ? ' is-active' : '') +
                  (state.hover?.startsWith(l.id + '#') ? ' is-hover' : '')
                }
                style={{ top: i * ROW, height: ROW }}
                onClick={() => jumpTo(l.segments[0].start)}
                title={l.note}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* 时间轴本体 */}
          <div
            className="cr-chart"
            ref={chartRef}
            style={{ height: LANES.length * ROW }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={() => setHover(null)}
          >
            {LANES.map((l, i) => (
              <div key={l.id} className="cr-row" style={{ top: i * ROW, height: ROW }} />
            ))}

            {LANES.map((l, i) =>
              l.segments.map((s, j) => {
                const id = l.id + '#' + j
                return (
                  <div
                    key={id}
                    className="cr-bar"
                    data-bar={l.id}
                    data-seg={j}
                    data-from={s.start}
                    data-to={s.end}
                    data-gap={j < l.segments.length - 1 ? '1' : '0'}
                    data-kind={s.kind ?? 'run'}
                    data-on={state.hover === id || state.selected === id ? '1' : '0'}
                    style={{ top: i * ROW + (ROW - BARH) / 2, height: BARH }}
                  />
                )
              })
            )}

            {GAPS.map((g, i) => (
              <div key={i} className="cr-gapband" style={{ left: pct(g.start), width: pct(g.end - g.start) }} />
            ))}

            <div className="cr-ticks" ref={ticksRef}>
              {Array.from({ length: TICKS }).map((_, i) => (
                <div className="cr-tick" key={i}><i /><span /></div>
              ))}
            </div>

            <div className="cr-playhead" ref={headRef}><i /></div>
          </div>
        </div>

        <footer className="cr-foot">
          <div className="cr-foot-l">
            {hoverSeg ? (
              <>
                <span className="cr-crumb is-hover">{breadcrumb(hoverLane!)} › {hoverSeg.label}</span>
                <span className="cr-detail">{hoverSeg.detail}</span>
              </>
            ) : lane && seg ? (
              <>
                <span className="cr-crumb">{breadcrumb(lane)} › {seg.label}</span>
                <span className="cr-detail">{seg.detail ?? lane.note}</span>
              </>
            ) : (
              <>
                <span className="cr-crumb is-gap">⌁ 空档</span>
                <span className="cr-detail">
                  这会儿没有任何步骤在跑 —— 0.7 秒的空白。聊天记录里，这段时间是不存在的。
                </span>
              </>
            )}
          </div>
          <div className="cr-foot-r">
            {state.selected && <span className="cr-locked">已锁定</span>}
            <span className="cr-clock" ref={clockRef}>0.00s</span>
            {state.zoomed && <button className="cr-btn" onClick={fit}>适应</button>}
            {!state.live && <button className="cr-btn is-primary" onClick={goLive}>回到实时</button>}
          </div>
        </footer>
      </div>
    </div>
  )
}
