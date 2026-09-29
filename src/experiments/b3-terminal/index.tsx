import { useEffect, useMemo, useRef, useState } from 'react'
import '@fontsource-variable/jetbrains-mono'
import { useTerminal, type Entry } from './useTerminal'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 003 · Terminal —— 「Agent 就是一个跑在终端里的进程」
 *
 * 核心区分（整个设计的骨架）：
 *   \n 追加  = 已定论 → 写进 scrollback，永久
 *   \r 原地  = 未定论 → 在状态行 / 进度行上原地重绘
 *
 * 终端的两种输出模式，正好对应 Agent 的两种状态。
 * 品味的关键细节：进度条一格一格跳，不是平滑增长 —— 平滑的是网页，跳的才是终端。
 */

const THEMES = ['amber', 'green', 'mono'] as const
const THEME_LABEL: Record<string, string> = { amber: '琥珀', green: '磷绿', mono: '单色' }
const RULE = '─'.repeat(200)

export default function Terminal({ playing, speed, runId }: Ctl) {
  const [cmd, setCmd] = useState('')
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)
  const [localRun, setLocalRun] = useState(0)
  const [theme, setTheme] = useState<string>('amber')
  const [folded, setFolded] = useState<Set<number>>(new Set())

  const inputRef = useRef<HTMLInputElement>(null)
  const { state, scrollRef, clockRef, spinRef, stick, interrupt, clearLog } = useTerminal({
    playing, speed, runId: runId + localRun, cmdOverride: cmd,
  })

  // 自动滚到底（除非用户自己往上翻了）
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stick.current) return
    el.scrollTop = el.scrollHeight
  }, [state.entries, state.typing, scrollRef])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32
  }

  // Esc / Ctrl-C
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'c' && e.ctrlKey)) {
        e.preventDefault()
        interrupt()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [interrupt])

  // 每个条目属于哪个 task —— 用来支持点击折叠
  const owned = useMemo(() => {
    let owner: number | null = null
    return state.entries.map((e) => {
      if (e.kind === 'task') owner = e.key
      return { e, owner }
    })
  }, [state.entries])

  const toggle = (key: number) =>
    setFolded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    setHistory((h) => [t, ...h].slice(0, 40))
    setHIdx(-1)
    setDraft('')
    if (t === 'clear' || t === 'cls') { clearLog(); return }
    setCmd(t)
    setLocalRun((n) => n + 1)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const n = Math.min(hIdx + 1, history.length - 1)
      if (n >= 0) { setHIdx(n); setDraft(history[n]) }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const n = hIdx - 1
      if (n < 0) { setHIdx(-1); setDraft('') } else { setHIdx(n); setDraft(history[n]) }
    }
  }

  const live = draft || (state.running ? '' : state.typing)
  const pct = state.status.pct
  const cells = 28
  const on = pct == null ? 0 : Math.round((pct / 100) * cells)

  return (
    <div className="tm" data-theme={theme}>
      <div className="tm-window" onClick={() => inputRef.current?.focus()}>
        <header className="tm-title">
          <span className="tm-title-l">
            <b>agent</b>@lab<span className="tm-faint">:</span>~/agent-ui-lab
            <span className="tm-faint"> — 依赖升级</span>
          </span>
          <span className="tm-title-r">
            <span className="tm-faint">{state.status.step}/07</span>
            <button
              className="tm-btn"
              onClick={(e) => {
                e.stopPropagation()
                setTheme(THEMES[(THEMES.indexOf(theme as never) + 1) % THEMES.length])
              }}
            >
              {THEME_LABEL[theme]}
            </button>
          </span>
        </header>

        <div className="tm-body" ref={scrollRef} onScroll={onScroll}>
          {owned.map(({ e, owner }) => {
            if (owner != null && folded.has(owner) && e.kind !== 'task') return null
            return (
              <Row
                key={e.key}
                e={e}
                folded={e.kind === 'task' && folded.has(e.key)}
                onToggle={toggle}
              />
            )
          })}

          {!state.running && (
            <div className="tm-l tm-prompt">
              <span className="tm-p">❯</span>
              <span className="tm-draft">{live}</span>
              <i className="tm-caret" />
            </div>
          )}
        </div>

        <footer className="tm-status">
          <span className="tm-spin" ref={spinRef}>·</span>
          <span className={'tm-status-text tm-' + state.status.tone}>{state.status.text}</span>
          <span className="tm-mini">
            <span className="tm-mini-on">{'━'.repeat(on)}</span>
            {on < cells && <span className="tm-mini-head">╸</span>}
            <span className="tm-mini-off">{'─'.repeat(Math.max(0, cells - on - 1))}</span>
          </span>
          <span className="tm-status-pct">{pct == null ? '  --' : String(pct).padStart(3) + '%'}</span>
          <span className="tm-status-clock" ref={clockRef}>0.00s</span>
        </footer>

        <input
          ref={inputRef}
          className="tm-input"
          value={draft}
          disabled={state.running}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          aria-label="终端输入"
        />
      </div>
    </div>
  )
}

function Row({ e, folded, onToggle }: { e: Entry; folded: boolean; onToggle: (k: number) => void }) {
  switch (e.kind) {
    case 'blank':
      return <div className="tm-l tm-blank" />

    case 'cmd':
      return (
        <div className="tm-l tm-cmd">
          <span className="tm-p">❯</span> {e.text}
        </div>
      )

    case 'task':
      return (
        <div className="tm-l tm-task" onClick={(ev) => { ev.stopPropagation(); onToggle(e.key) }}>
          <span className="tm-task-t">{folded ? '▸' : '▾'} {e.text}</span>
          <span className="tm-task-rule">{RULE}</span>
          <span className={'tm-task-ms' + (e.ms == null ? ' is-run' : '')}>
            {e.ms == null ? '运行中' : (e.ms / 1000).toFixed(2) + 's'}
          </span>
        </div>
      )

    case 'note':
      return (
        <div className={'tm-l tm-note tm-' + e.tone} style={{ paddingLeft: e.indent * 2 + 'ch' }}>
          {e.text}
        </div>
      )

    case 'bar':
      return (
        <div className={'tm-l tm-bar' + (e.done ? ' is-done' : '')}>
          <span className="tm-bar-l">{e.label}</span>
          <span className="tm-bar-b">
            <span className="tm-bar-on">{'▓'.repeat(e.filled)}</span>
            <span className="tm-bar-off">{'░'.repeat(Math.max(0, e.cells - e.filled))}</span>
          </span>
          <span className="tm-bar-p">{String(e.pct).padStart(3)}%</span>
        </div>
      )

    case 'result':
      return (
        <div className="tm-l tm-result">
          <div className="tm-res-rule">
            <span>┌─ </span>
            <span className="tm-res-title">{e.title}</span>
            <span className="tm-res-bar"> {RULE}</span>
            <span className="tm-faint"> ─</span>
          </div>
          <div className="tm-res-body">
            <div className="tm-res-head">{e.head}</div>
            {e.lines.map((l, i) => (
              <div className="tm-res-item" key={i}>{l}</div>
            ))}
          </div>
          <div className="tm-res-rule">
            <span>└</span>
            <span className="tm-res-bar">{RULE}</span>
          </div>
        </div>
      )
  }
}
