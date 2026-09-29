import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp, Book, Check, ChevronDown, FileText, Layers, MoreHorizontal,
  Paperclip, PanelRight, Plus, RotateCcw, Settings, Square, Wrench, X, XCircle, Zap,
} from 'lucide-react'
import { AGENT, HISTORY, type Act, type Block, type Msg } from './scenario'
import { useWorkbench } from './useWorkbench'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * A3 · 过程与产物 —— 聊天 + 工作状态双层结构（Workbench + 原 014 Settle）
 *
 * 左边是对话，右边是 Workspace。
 * 报告不是「最后一条消息」，它出现在右边的面板里，边写边长；
 * 而且每一段都连着产出它的那一步 —— 撤掉一步，看文档少掉什么。
 */
export default function Workbench({ playing, speed, runId }: Ctl) {
  const { state, api } = useWorkbench({ playing, speed, runId })
  const [focus, setFocus] = useState(false)
  /** 当前高亮的一步（acts 下标）；悬停步骤或段落时设置，两边互相呼应 */
  const [hl, setHl] = useState<number | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const wsBodyRef = useRef<HTMLDivElement>(null)

  const empty = state.messages.length === 0 && !state.thinking
  const busy = state.thinking || state.messages.some((m) => m.role === 'agent' && (m.streaming ?? -1) >= 0)
  const taskName = empty ? '新任务' : (state.messages[0]?.text ?? '新任务')

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px' }
  }, [state.typed])

  // 对话和报告都跟着内容走
  useEffect(() => { const e = bodyRef.current; if (e) e.scrollTop = e.scrollHeight }, [state.messages, state.thinking])
  useEffect(() => { const e = wsBodyRef.current; if (e) e.scrollTop = e.scrollHeight }, [state.ws.items, state.ws.streaming])

  const submit = () => { if (state.typed.trim()) api.send(state.typed) }

  return (
    <div className="wk" data-ws={state.ws.open ? '1' : '0'}>
      {/* ── 窄侧栏 ───────────────────────────────────── */}
      <aside className="wk-rail">
        <div className="wk-brand">
          <span className="wk-logo">◇</span>
          <div className="wk-brand-t">
            <b>{AGENT.name}</b>
            <span className="wk-online"><i />Online</span>
          </div>
        </div>

        <button className="wk-new" onClick={api.newTask}><Plus size={14} strokeWidth={2.2} />新任务</button>

        <nav className="wk-hist">
          {HISTORY.map((g) => (
            <div key={g.group} className="wk-hist-g">
              <div className="wk-hist-t">{g.group}</div>
              {g.items.map((it) => (
                <button key={it} className="wk-hist-i" data-active={it === '新能源汽车市场' ? '1' : '0'}>{it}</button>
              ))}
            </div>
          ))}
        </nav>

        <div className="wk-rail-foot">
          <button className="wk-fi"><Settings size={14} strokeWidth={1.8} />设置</button>
          <button className="wk-fi"><Book size={14} strokeWidth={1.8} />知识</button>
          <button className="wk-fi"><Wrench size={14} strokeWidth={1.8} />工具</button>
          <button className="wk-fi"><Zap size={14} strokeWidth={1.8} />模型<span className="wk-fi-v">Atlas 2</span></button>
        </div>
      </aside>

      {/* ── 中央对话 ─────────────────────────────────── */}
      <main className="wk-chat">
        <header className="wk-top">
          <div className="wk-top-t">{taskName}</div>
          <button className="wk-icon" data-on={state.ws.open ? '1' : '0'} onClick={api.toggleWs} title="Workspace">
            <PanelRight size={16} strokeWidth={1.8} />
          </button>
          <button className="wk-icon" title="更多"><MoreHorizontal size={16} strokeWidth={1.8} /></button>
        </header>

        <div className="wk-scroll" ref={bodyRef}>
          <div className="wk-col">
            {empty ? (
              <div className="wk-empty">
                <div className="wk-empty-m">◇</div>
                <h1>交给 {AGENT.name} 一个目标</h1>
                <p>它会拆解、调用工具、执行，然后把结果放进右边的 Workspace。</p>
                <div className="wk-chips">
                  {['研究一个市场', '读一份长文档', '对比两个方案'].map((t) => (
                    <button key={t} className="wk-chip" onClick={() => { api.pick(t); taRef.current?.focus() }}>{t}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="wk-thread">
                {state.messages.map((m) => (
                  <Row
                    key={m.id} m={m} onToggle={() => api.toggleActs(m.id)}
                    hl={hl} setHl={setHl} onDrop={api.dropSrc} onRestore={api.restoreSrc}
                  />
                ))}
                {state.thinking && <div className="wk-think"><i />正在理解任务</div>}
              </div>
            )}
          </div>
        </div>

        <div className="wk-dock">
          <div className="wk-composer" data-focus={focus ? '1' : '0'}>
            <textarea
              ref={taRef} className="wk-ta" rows={1} value={state.typed}
              placeholder={busy ? 'Agent 正在执行…' : '输入你的任务…'}
              onChange={(e) => api.setTyped(e.target.value)}
              onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            />
            <div className="wk-bar">
              <button className="wk-cbtn" title="附件"><Paperclip size={15} strokeWidth={1.8} /></button>
              <button className="wk-cbtn" title="工具"><Wrench size={15} strokeWidth={1.8} /></button>
              {state.typed.trim().length > 12 && !busy && <span className="wk-hint">将由 Agent 执行任务</span>}
              <div className="wk-sp" />
              {busy
                ? <button className="wk-stop" onClick={api.stop} title="停止"><Square size={10} fill="currentColor" strokeWidth={0} /></button>
                : <button className="wk-send" onClick={submit} disabled={!state.typed.trim()} title="执行"><ArrowUp size={15} strokeWidth={2.2} /></button>}
            </div>
          </div>
        </div>
      </main>

      {/* ── 右侧 Workspace ───────────────────────────── */}
      <aside className="wk-ws">
        <div className="wk-ws-in">
          <header className="wk-ws-h">
            <FileText size={14} strokeWidth={1.8} />
            <span className="wk-ws-t">{state.ws.title || 'Workspace'}</span>
            {state.ws.done && <span className="wk-ws-badge">已生成</span>}
            <button className="wk-icon" onClick={api.toggleWs} title="关闭"><X size={15} strokeWidth={1.8} /></button>
          </header>

          <div className="wk-ws-b" ref={wsBodyRef}>
            {state.ws.items.length === 0 ? (
              <div className="wk-ws-empty">
                <Layers size={20} strokeWidth={1.5} />
                <p>Agent 产出的报告、表格、代码会出现在这里。</p>
              </div>
            ) : (
              <article className="wk-doc">
                {state.ws.items.map((it, i) => (
                  <div
                    key={i}
                    className={'wk-db' + (i === state.ws.streaming ? ' is-stream' : '')}
                    data-state={it.state}
                    data-hl={hl === it.src ? '1' : '0'}
                    onMouseEnter={() => setHl(it.src)}
                    onMouseLeave={() => setHl(null)}
                  >
                    <span className="wk-db-src">{it.state === 'dropped' ? '已随「撤掉的一步」消失' : '来自第 ' + (it.src + 1) + ' 步'}</span>
                    <DocBlock b={it.block} />
                  </div>
                ))}
              </article>
            )}
          </div>

          {state.ws.items.length > 0 && (
            <footer className="wk-ws-f">
              <span className="wk-ws-tip">每段的角标是产出它的那一步。悬停或撤掉一步，看产物少掉什么。</span>
              <button className="wk-wf-b">下载 .md</button>
              <button className="wk-wf-b">在新标签打开</button>
            </footer>
          )}
        </div>
      </aside>
    </div>
  )
}

function Row({ m, onToggle, hl, setHl, onDrop, onRestore }: {
  m: Msg; onToggle: () => void; hl: number | null
  setHl: (i: number | null) => void; onDrop: (i: number) => void; onRestore: (i: number) => void
}) {
  if (m.role === 'user') return <div className="wk-u"><div className="wk-u-in">{m.text}</div></div>

  const acts = m.acts ?? []
  const running = acts.some((a) => a.state === 'running')
  const cur = acts.findIndex((a) => a.state === 'running')

  return (
    <div className="wk-a">
      <div className="wk-a-mark">◇</div>
      <div className="wk-a-body">
        {acts.length > 0 && (
          <div className="wk-acts" data-open={m.actsOpen ? '1' : '0'}>
            <button className="wk-acts-h" onClick={onToggle}>
              {running
                ? <span className="wk-acts-ring" />
                : <span className="wk-acts-ok"><Check size={11} strokeWidth={2.6} /></span>}
              <span className="wk-acts-t">
                {running
                  ? '正在执行 ' + acts.length + ' 个步骤 · 预计很快完成'
                  : '已完成 ' + acts.length + ' 个步骤'}
              </span>
              <ChevronDown size={14} strokeWidth={2} className="wk-chev" />
            </button>

            <div className="wk-acts-b">
              <div className="wk-acts-bi">
                <ol className="wk-steps">
                  {acts.map((a, i) => (
                    <Step
                      key={a.id} a={a} last={i === acts.length - 1} active={i === cur}
                      hl={hl === i}
                      onEnter={() => setHl(i)}
                      onLeave={() => setHl(null)}
                      onDrop={() => onDrop(i)}
                      onRestore={() => onRestore(i)}
                    />
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {(m.blocks ?? []).map((b, i) => (
          <div key={i} className={'wk-b' + (i === m.streaming ? ' is-stream' : '')}>
            <DocBlock b={b} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Step({ a, last, active, hl, onEnter, onLeave, onDrop, onRestore }: {
  a: Act; last: boolean; active: boolean; hl: boolean
  onEnter: () => void; onLeave: () => void; onDrop: () => void; onRestore: () => void
}) {
  return (
    <li
      className="wk-step" data-s={a.state} data-active={active ? '1' : '0'} data-dropped={a.dropped ? '1' : '0'} data-hl={hl ? '1' : '0'}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
    >
      <span className="wk-step-rail">
        <span className="wk-step-dot" />
        {!last && <span className="wk-step-line" />}
      </span>
      <span className="wk-step-l">{a.label}</span>
      {a.note && <em className="wk-step-n">{a.note}</em>}
      {a.state === 'done' && !a.dropped && (
        <button className="wk-step-x" onClick={onDrop} title={'撤掉「' + a.label + '」，看产物少掉什么'}>
          <X size={12} strokeWidth={2.2} />
        </button>
      )}
      {a.dropped && (
        <button className="wk-step-undo" onClick={onRestore} title="放回来">
          <RotateCcw size={12} strokeWidth={2.2} />
          放回来
        </button>
      )}
    </li>
  )
}

function DocBlock({ b }: { b: Block }) {
  switch (b.kind) {
    case 'h': return <h3>{b.text}</h3>
    case 'p': return <p>{b.text}</p>
    case 'ul': return <ul>{b.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    case 'quote': return <blockquote>{b.text}</blockquote>
    case 'table': return (
      <div className="wk-tw"><table>
        <thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table></div>
    )
  }
}
