import { useCallback, useEffect, useRef, useState } from 'react'
import { useStroke, measureEm } from './useStroke'
import { RESULT, TOTAL, KNOT_AT } from './scenario'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 002 · One Line —— 「一支笔画一条线」
 *
 * 整个界面就是一支笔在纸上画一条线；Agent 干活的过程 = 这条线被画出来的过程。
 * 所有 Agent 状态都从「线是一根有张力的弦」这一条物理规律推导出来：
 *   绞 / 扫 / 飞白 / 结 / 静止 / 回笔 / 浓墨 / 裂开
 *
 * 零色彩。状态全部由「形状」承载。
 */

const TYPE_PX = 14

export default function OneLine({ playing, speed, runId }: Ctl) {
  const [ask, setAsk] = useState('')
  const [draft, setDraft] = useState('')
  const [localRun, setLocalRun] = useState(0)
  const [hoverTag, setHoverTag] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const areaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { state, rootRef, clockRef, interrupt } = useStroke({
    playing,
    speed,
    runId: runId + localRun,
    askOverride: ask,
  })

  const preSend = state.phase === 'idle' || state.phase === 'typing'
  const live = draft || (preSend ? state.typed : '')
  const typedW = preSend && live ? measureEm(live) * TYPE_PX : 0

  useEffect(() => {
    rootRef.current?.style.setProperty('--typedw', typedW + 'px')
  }, [typedW, rootRef])

  // Esc = 中断（全局）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); interrupt() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [interrupt])

  // 悬停：字幕跟着鼠标，显示「那一步」是什么
  const onMove = useCallback((e: React.MouseEvent) => {
    const box = areaRef.current?.getBoundingClientRect()
    const el = rootRef.current
    if (!box || !el) return
    const f = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width))
    el.style.setProperty('--tagx', f.toFixed(4))
    el.dataset.hover = '1'
    el.dataset.side = f > 0.68 ? 'left' : 'right'
    let hit: string | null = null
    for (const m of state.marks) if (m.at <= f + 0.002) hit = m.tag
    setHoverTag(hit)
  }, [state.marks, rootRef])

  const onLeave = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    el.style.removeProperty('--tagx')
    delete el.dataset.hover
    setHoverTag(null)
  }, [rootRef])

  const commit = () => {
    setAsk(draft.trim())
    setDraft('')
    setLocalRun((n) => n + 1)
  }

  const tag = hoverTag ?? state.tag
  const showChip = !preSend && state.ask

  return (
    <div className="ol" ref={rootRef} data-phase={state.phase} data-theme={theme}>
      <div className="ol-band" onClick={() => inputRef.current?.focus()}>
        <div className="ol-meta">
          <span className="ol-meta-step">
            {state.step > 0 ? String(state.step).padStart(2, '0') + ' / 07' : ''}
          </span>
          <span className="ol-meta-right">
            <button
              className="ol-theme"
              onClick={(e) => { e.stopPropagation(); setTheme((t) => (t === 'light' ? 'dark' : 'light')) }}
            >
              {theme === 'light' ? '暗场' : '白场'}
            </button>
            <span className="ol-meta-clock" ref={clockRef}>0.0s</span>
          </span>
        </div>

        <div className="ol-area" ref={areaRef} onMouseMove={onMove} onMouseLeave={onLeave}>
          {/* ── 那条线本身（裂开时它是上半） ── */}
          <div className="ol-edge ol-edge-top">
            <div className="ol-rail" />

            <div className="ol-ink"><i className="ol-flow" /></div>

            <i className="ol-gap" style={{ left: '34.75%', opacity: 'var(--g0,0)' }} />
            <i className="ol-gap" style={{ left: '41.50%', opacity: 'var(--g1,0)' }} />
            <i className="ol-gap" style={{ left: '48.25%', opacity: 'var(--g2,0)' }} />

            <div className="ol-twistwrap"><i className="ol-twist" /></div>

            <div className="ol-scanwrap">
              <i className="ol-scan" data-d="0" />
              <i className="ol-scan" data-d="1" />
            </div>

            <div className="ol-strands">
              <i className="ol-strand" data-i="0" />
              <i className="ol-strand" data-i="1"><b className="ol-snapgap" /></i>
              <i className="ol-strand" data-i="2" />
            </div>

            <i className="ol-knot" style={{ left: KNOT_AT * 100 + '%' }} />

            <div className="ol-type">
              <span className="ol-type-text">{live || '说点什么…'}</span>
              <i className="ol-type-caret" />
            </div>

            <div className="ol-tag">
              {tag ? <i className="ol-tag-dot" /> : null}
              {tag}
            </div>

            <i className="ol-tip" />
          </div>

          {/* ── 裂开后显现的结果 ── */}
          <div
            className="ol-reveal"
            data-revealed={state.revealed ? '1' : '0'}
            onClick={(e) => { e.stopPropagation(); setLocalRun((n) => n + 1) }}
          >
            <div className="ol-reveal-inner">
              <div className="ol-result-kicker">结论</div>
              <h2 className="ol-result-title">{RESULT.title}</h2>
              <ul className="ol-result-list">
                {RESULT.items.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
              <div className="ol-result-foot">{RESULT.foot}</div>
            </div>
          </div>

          {/* ── 下半：合上的那条线 ── */}
          <div className="ol-edge ol-edge-bot" />
        </div>

        <div className="ol-foot">
          <span className="ol-chip" data-on={showChip ? '1' : '0'}>{state.ask || '\u00a0'}</span>
          <span className="ol-hint">
            {state.phase === 'done'
              ? '点击结果 · 重新开始'
              : preSend
                ? '点一下这里 · 输入你的问题 · Enter 开始'
                : '悬停线上任意处回看 · Esc 中断'}
          </span>
        </div>

        <input
          ref={inputRef}
          className="ol-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
          spellCheck={false}
          aria-label="输入你的问题"
        />
      </div>

      <div className="ol-legend">
        <span>002 · ONE LINE</span>
        <span>{(TOTAL / 1000).toFixed(1)}s · 13 个状态 · 0 种颜色</span>
      </div>
    </div>
  )
}
