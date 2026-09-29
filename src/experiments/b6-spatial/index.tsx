import { useEffect, useRef } from 'react'
import { NODES, EDGES, QUESTION, type NodeState } from './scenario'
import { useField } from './useField'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 006 · Spatial —— 「一片场」
 *
 * Agent 处理过的每一样东西，在这片场里有一个位置。
 * 相关的东西靠得近，重要的大，久远的暗。
 * Agent 的注意力 = 一个会移动、会聚焦的镜头 —— **模糊度就是注意力**。
 *
 * 整部片子的形状：展开 → 连接 → 收敛。
 */

const KIND_LABEL: Record<string, string> = {
  root: '问题', branch: '方向', source: '来源', finding: '发现',
}

export default function Spatial({ playing, speed, runId }: Ctl) {
  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLSpanElement>(null)
  const drag = useRef({ active: false, lx: 0, ly: 0, moved: 0, target: null as HTMLElement | null })

  const { state, api } = useField({ playing, speed, runId, rootRef, gridRef, ringRef, zoomRef })

  useEffect(() => {
    const r = rootRef.current
    if (!r) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = r.getBoundingClientRect()
      api.zoomAt(
        Math.exp((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.0016),
        e.clientX - rect.left,
        e.clientY - rect.top,
      )
    }
    r.addEventListener('wheel', onWheel, { passive: false })
    return () => r.removeEventListener('wheel', onWheel)
  }, [api, rootRef])

  const onDown = (e: React.PointerEvent) => {
    drag.current = { active: true, lx: e.clientX, ly: e.clientY, moved: 0, target: e.target as HTMLElement }
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (d.active) {
      const dx = e.clientX - d.lx
      const dy = e.clientY - d.ly
      d.lx = e.clientX; d.ly = e.clientY
      d.moved += Math.abs(dx) + Math.abs(dy)
      if (d.moved > 4) api.panBy(dx, dy)
      return
    }
    const el = (e.target as HTMLElement).closest('[data-node]') as HTMLElement | null
    api.setHover(el ? el.dataset.node! : null)
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    if (d.moved > 4) return
    const el = d.target?.closest?.('[data-node]') as HTMLElement | null
    api.pick(el ? el.dataset.node! : null)
    void e
  }

  const focus = NODES.find((n) => n.id === state.focusId) ?? null
  const hover = NODES.find((n) => n.id === state.hoverId) ?? null
  const shown = state.visible.length

  return (
    <div
      className="sp"
      ref={rootRef}
      data-free={state.free ? '1' : '0'}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={() => api.setHover(null)}
    >
      <div className="sp-grid" ref={gridRef} />

      {/* 焦点环：注意力落在哪里 */}
      <div className="sp-ring" ref={ringRef} />

      {/* 连线 */}
      <svg className="sp-edges">
        {EDGES.map((e) => (
          <line key={e.id} data-edge={e.id} data-kind={e.kind}
            data-on={state.edges.includes(e.id) ? '1' : '0'} />
        ))}
      </svg>

      {/* 节点 */}
      <div className="sp-nodes">
        {NODES.map((n) => (
          <span
            key={n.id}
            className="sp-node"
            data-node={n.id}
            data-kind={n.kind}
            data-state={(state.states[n.id] ?? 'idle') as NodeState}
            data-on={state.visible.includes(n.id) ? '1' : '0'}
            data-hot={state.hoverId === n.id || state.focusId === n.id ? '1' : '0'}
            style={{ ['--sz' as never]: n.size + 'px' }}
          >
            <i className="sp-ripple" />
            <i className="sp-dot" />
            <i className="sp-halo" />
            <span className="sp-label">{n.label}</span>
          </span>
        ))}
      </div>

      {/* 结果：收敛之后在正中央长出来 */}
      {state.answer && (
        <div className="sp-answer">
          <div className="sp-answer-kicker">结论</div>
          <h2 className="sp-answer-title">{state.answer.title}</h2>
          {state.answer.lines.map((l, i) => (
            <p className="sp-answer-line" key={i}>{l}</p>
          ))}
        </div>
      )}

      {/* 极简的操作层 */}
      <div className="sp-hud sp-hud-tl">
        <span className="sp-q">{QUESTION}</span>
      </div>

      <div className="sp-hud sp-hud-tr">
        <span className="sp-focus">
          {hover ? hover.label : focus ? focus.label : '自由探索'}
        </span>
        <span className="sp-focus-kind">{hover ? KIND_LABEL[hover.kind] : focus ? KIND_LABEL[focus.kind] : ''}</span>
        <span className="sp-zoom" ref={zoomRef}>0.90×</span>
      </div>

      <div className="sp-hud sp-hud-bl">
        <span>{String(shown).padStart(2, '0')} 个节点</span>
        <span className="sp-dim">{state.edges.length} 条关联</span>
        <span className="sp-dim">拖拽平移 · 滚轮缩放 · 点击节点</span>
      </div>

      {state.free && (
        <button className="sp-follow" onClick={api.follow}>
          <i /> 跟随 Agent
        </button>
      )}
    </div>
  )
}
