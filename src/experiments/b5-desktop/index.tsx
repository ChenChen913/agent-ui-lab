import { useEffect, useRef, useState } from 'react'
import { SIZES, TABLE, CHECK, CONFIRM } from './scenario'
import { useDesktop, type Win } from './useDesktop'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * B5 · Desktop —— 「Agent 不是网页，是活在你桌面上的一个存在」
 *
 * 三个层次：
 *   ① 桌面本身 —— 一个地方，不是一个页面。环境光随 Agent 状态微微变化。
 *   ② Agent 本体 —— 右下角常驻的方块。呼吸、变形、需要你的时候会变空心并脉冲。
 *   ③ 任务窗口 —— 一个任务 = 一个窗口。可以拖、可以最小化、可以恢复。
 */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

export default function Desktop({ playing, speed, runId }: Ctl) {
  const [draft, setDraft] = useState('')
  const [ask, setAsk] = useState('')
  const [localRun, setLocalRun] = useState(0)
  const deskRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { state, clockRef, api } = useDesktop({
    playing, speed, runId: runId + localRun, askOverride: ask,
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); api.summon(); return }
      if (e.key === 'Escape') api.closePalette()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [api])

  useEffect(() => { if (state.palette) inputRef.current?.focus() }, [state.palette])

  const live = draft || state.typed
  const running = state.wins.filter((x) => !x.minimized && x.state !== 'done')
  const fill = running.length
    ? running.reduce((a, x) => a + x.progress, 0) / running.length
    : state.presence === 'done' ? 1 : 0

  const submit = () => {
    const t = (draft || state.typed).trim()
    if (!t) return
    setDraft('')
    setAsk(t)
    setLocalRun((n) => n + 1)
    api.closePalette()
  }

  return (
    <div className="dk" data-presence={state.presence} ref={deskRef}>
      <i className="dk-amb" data-k="thinking" />
      <i className="dk-amb" data-k="working" />
      <i className="dk-amb" data-k="waiting" />
      <i className="dk-amb" data-k="done" />

      {/* 桌面上的时间 */}
      <span className="dk-clock" ref={clockRef}>--:--</span>

      {/* 当前目标 */}
      {state.ask && (
        <div className="dk-ask">
          <i className="dk-ask-dot" />
          {state.ask}
        </div>
      )}

      {/* 任务窗口 */}
      {state.wins.map((win) => (
        <WinBox key={win.id} win={win} deskRef={deskRef} api={api} />
      ))}

      {/* 命令面板 */}
      {state.palette && (
        <div className="dk-palette" onClick={() => inputRef.current?.focus()}>
          <div className="dk-palette-box">
            <span className="dk-palette-mark">›</span>
            <span className="dk-palette-text">{live || '给 Agent 一件事…'}</span>
            <i className="dk-caret" />
            <span className="dk-palette-hint">↵</span>
          </div>
        </div>
      )}

      {/* 通知 */}
      {state.notify && (
        <button className="dk-notify" data-tone={state.notify.tone} onClick={api.dismissNotify}>
          <span className="dk-notify-mark" />
          <span className="dk-notify-text">
            <b>{state.notify.title}</b>
            <em>{state.notify.body}</em>
          </span>
        </button>
      )}

      {/* Dock = 任务列表 */}
      <div className="dk-dock">
        {state.wins.length === 0 ? (
          <span className="dk-dock-empty">没有在跑的任务</span>
        ) : (
          state.wins.map((win) => (
            <button
              key={win.id}
              className="dk-chip"
              data-state={win.state}
              data-min={win.minimized ? '1' : '0'}
              onClick={() => { api.center(win.id); api.front(win.id) }}
              title={win.title}
            >
              <span className="dk-chip-glyph">
                {win.kind === 'table' ? '▦' : win.kind === 'checklist' ? '☰' : '!'}
              </span>
              <span className="dk-chip-prog" style={{ transform: 'scaleX(' + win.progress.toFixed(3) + ')' }} />
              <span className="dk-chip-tip">{win.title}</span>
            </button>
          ))
        )}
      </div>

      {/* Agent 本体 */}
      <button
        className="dk-presence"
        data-state={state.presence}
        onClick={api.summon}
        title="⌘K 唤起 Agent"
      >
        <span className="dk-presence-fill" style={{ height: (fill * 100).toFixed(1) + '%' }} />
        <span className="dk-presence-core"><i /><i /><i /></span>
        <span className="dk-presence-ring" />
      </button>

      <input
        ref={inputRef}
        className="dk-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
        spellCheck={false}
        aria-label="给 Agent 一件事"
      />
    </div>
  )
}

function WinBox({ win, deskRef, api }: { win: Win; deskRef: React.RefObject<HTMLDivElement | null>; api: any }) {
  const dims = SIZES[win.kind]
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; w: number; h: number } | null>(null)
  const shown = Math.round(win.progress * win.items)

  const bar = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.stopPropagation()
      api.front(win.id)
      const rect = deskRef.current?.getBoundingClientRect()
      if (!rect) return
      drag.current = { sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y, w: rect.width, h: rect.height }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d) return
      api.move(
        win.id,
        clamp(d.ox + ((e.clientX - d.sx) / d.w) * 100, -1, 94),
        clamp(d.oy + ((e.clientY - d.sy) / d.h) * 100, 1, 84),
      )
    },
    onPointerUp: () => { drag.current = null },
  }

  return (
    <section
      className="dk-win"
      data-kind={win.kind}
      data-state={win.state}
      data-min={win.minimized ? '1' : '0'}
      style={{ left: win.x + '%', top: win.y + '%', width: dims.w, minHeight: dims.h, zIndex: win.z }}
      onPointerDown={() => api.front(win.id)}
    >
      <header className="dk-win-bar" {...bar}>
        <span className="dk-win-title">{win.title}</span>
        <span className="dk-win-state">
          {win.state === 'done' ? '✓' : win.state === 'warn' ? '!' : win.state === 'waiting' ? '?' : ''}
        </span>
        <span className="dk-win-btns">
          <button className="dk-wbtn" title="最小化" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); api.toggleMin(win.id) }}>–</button>
          <button className="dk-wbtn" title="关闭" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); api.close(win.id) }}>×</button>
        </span>
      </header>

      <div className="dk-win-body">
        {win.kind === 'table' && (
          <table className="dk-table">
            <thead>
              <tr>{TABLE.head.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {TABLE.rows.map((r, i) => (
                <tr key={i} className={i < shown ? 'is-in' : ''}>
                  {r.map((c, j) => <td key={j}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {win.kind === 'checklist' && (
          <ul className="dk-check">
            {CHECK.map((c, i) => {
              const warn = !!c.warn && win.state === 'warn'
              return (
                <li key={i} className={i < shown ? 'is-in' : ''} data-warn={warn ? '1' : '0'}>
                  <span className="dk-check-mark">{warn ? '!' : '✓'}</span>
                  <span className="dk-check-name">{c.name}</span>
                  <span className="dk-check-ver">
                    {c.from === c.to ? c.to + ' 已是最新' : c.from + ' → ' + c.to}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {win.kind === 'confirm' && (
          <div className="dk-confirm">
            <p className="dk-confirm-body">{CONFIRM.body}</p>
            <div className="dk-confirm-btns">
              <button className="dk-cbtn is-yes" onClick={() => api.close(win.id)}>{CONFIRM.yes}</button>
              <button className="dk-cbtn" onClick={() => api.close(win.id)}>{CONFIRM.no}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
