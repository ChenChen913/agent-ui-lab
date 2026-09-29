import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp, Check, ChevronDown, ChevronRight, Copy, HelpCircle, Mic,
  MoreHorizontal, Paperclip, PanelLeft, Plus, RefreshCw, Settings, Square,
  ThumbsDown, ThumbsUp,
} from 'lucide-react'
import { AGENT, HISTORY, SUGGESTIONS, type Act, type Block, type Msg } from './scenario'
import { useBaseline } from './useBaseline'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 008 · Baseline —— 通用聊天式 Agent 界面
 *
 * 这是用户打开产品时真正看到的那一层。前七个实验都在研究「Agent 干活的过程」，
 * 这一个研究的是承载它的那个壳：侧栏、无气泡的对话、悬浮输入框、克制的执行状态。
 *
 * 默认不自动播放 —— 第一眼必须是用户登录后看到的空状态。
 */
export default function Baseline({ playing, speed, runId }: Ctl) {
  const { state, api } = useBaseline({ playing, speed, runId })
  const [rail, setRail] = useState(true)
  const [focus, setFocus] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const empty = state.messages.length === 0 && !state.thinking
  const busy = state.thinking || state.messages.some((m) => m.role === 'agent' && m.streaming != null && m.streaming >= 0)
  const running = state.messages.some((m) => m.acts?.some((a) => a.state === 'running'))

  // 输入框自动增高，但不无限扩大
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 168) + 'px'
  }, [state.typed])

  const submit = () => { if (state.typed.trim()) api.send(state.typed) }

  return (
    <div className="bl" data-rail={rail ? '1' : '0'}>
      <aside className="bl-rail">
        <div className="bl-brand">
          <span className="bl-logo">◇</span>
          <span className="bl-brand-n">{AGENT.name}</span>
        </div>

        <button className="bl-new" onClick={api.newChat}>
          <Plus size={15} strokeWidth={2} />
          新建对话
        </button>

        <nav className="bl-hist">
          {HISTORY.map((g) => (
            <div key={g.group} className="bl-hist-g">
              <div className="bl-hist-t">{g.group}</div>
              {g.items.map((it) => (
                <button key={it.id} className="bl-hist-i" data-active={it.active ? '1' : '0'}>
                  {it.title}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="bl-rail-foot">
          <button className="bl-foot-i"><Settings size={14} strokeWidth={1.8} />设置</button>
          <button className="bl-foot-i"><HelpCircle size={14} strokeWidth={1.8} />帮助</button>
          <div className="bl-user">
            <span className="bl-avatar">陈</span>
            <span className="bl-user-n">陈晨</span>
            <span className="bl-user-p">个人版</span>
          </div>
        </div>
      </aside>

      <main className="bl-main">
        <header className="bl-top">
          <button className="bl-icon" onClick={() => setRail((v) => !v)} title="折叠侧栏">
            <PanelLeft size={16} strokeWidth={1.8} />
          </button>
          <div className="bl-top-t">{empty ? '新对话' : '季度报告要点'}</div>
          <button className="bl-icon" title="更多"><MoreHorizontal size={16} strokeWidth={1.8} /></button>
        </header>

        <div className="bl-scroll">
          <div className="bl-col">
            {empty ? (
              <div className="bl-welcome">
                <div className="bl-wm">◇</div>
                <h1 className="bl-hi">下午好</h1>
                <p className="bl-sub">今天想让我帮你完成什么？</p>
                <div className="bl-sugs">
                  {SUGGESTIONS.map((s) => (
                    <button key={s.title} className="bl-sug" onClick={() => { api.pick(s.title); taRef.current?.focus() }}>
                      <b>{s.title}</b>
                      <span>{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bl-thread">
                {state.messages.map((m) => (
                  <Bubble key={m.id} m={m} onToggle={() => api.toggleActs(m.id)} />
                ))}
                {state.thinking && (
                  <div className="bl-think"><i className="bl-think-d" />思考中</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bl-dock">
          <div className="bl-composer" data-focus={focus ? '1' : '0'}>
            <textarea
              ref={taRef}
              className="bl-ta"
              rows={1}
              value={state.typed}
              placeholder={running ? 'Agent 正在执行…' : '说点什么…'}
              onChange={(e) => api.setTyped(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
              }}
            />
            <div className="bl-bar">
              <button className="bl-cbtn" title="添加附件"><Paperclip size={15} strokeWidth={1.8} /></button>
              <button className="bl-cbtn" title="语音"><Mic size={15} strokeWidth={1.8} /></button>
              <button className="bl-model">
                {AGENT.name} {AGENT.model}
                <ChevronDown size={13} strokeWidth={2} />
              </button>
              <div className="bl-sp" />
              {busy ? (
                <button className="bl-stop" onClick={api.stop} title="停止生成"><Square size={11} fill="currentColor" strokeWidth={0} /></button>
              ) : (
                <button className="bl-send" onClick={submit} disabled={!state.typed.trim()} title="发送">
                  <ArrowUp size={15} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
          <div className="bl-note">Agent 可能会出错，请核对重要信息。</div>
        </div>
      </main>
    </div>
  )
}

function Bubble({ m, onToggle }: { m: Msg; onToggle: () => void }) {
  if (m.role === 'user') {
    return (
      <div className="bl-u">
        <div className="bl-u-in">{m.text}</div>
      </div>
    )
  }

  const acts = m.acts ?? []
  const running = acts.filter((a) => a.state === 'running').length
  const allDone = acts.length > 0 && acts.every((a) => a.state === 'done')

  return (
    <div className="bl-a">
      <div className="bl-a-mark">◇</div>
      <div className="bl-a-body">
        {(m.blocks ?? []).map((b, i) => (
          <div key={i} className={'bl-b' + (i === m.streaming ? ' is-stream' : '')}>
            <RenderBlock b={b} />
          </div>
        ))}

        {acts.length > 0 && (
          <div className="bl-acts" data-done={allDone ? '1' : '0'}>
            <button className="bl-acts-h" onClick={onToggle}>
              <span className="bl-acts-d" data-live={running ? '1' : '0'} />
              <span>
                {running
                  ? '正在执行 ' + acts.length + ' 个步骤'
                  : allDone ? '执行了 ' + acts.length + ' 个步骤' : '等待执行'}
              </span>
              <ChevronRight size={13} strokeWidth={2} className={'bl-chev' + (m.actsOpen ? ' is-open' : '')} />
            </button>
            <div className="bl-acts-l" data-open={m.actsOpen ? '1' : '0'}>
              <div className="bl-acts-in">
                {acts.map((a) => <ActRow key={a.id} a={a} />)}
              </div>
            </div>
          </div>
        )}

        {m.done && (
          <div className="bl-tools">
            <button title="复制"><Copy size={13} strokeWidth={1.8} /></button>
            <button title="重新生成"><RefreshCw size={13} strokeWidth={1.8} /></button>
            <button title="有帮助"><ThumbsUp size={13} strokeWidth={1.8} /></button>
            <button title="没帮助"><ThumbsDown size={13} strokeWidth={1.8} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function ActRow({ a }: { a: Act }) {
  return (
    <div className="bl-act" data-s={a.state}>
      <span className="bl-act-m">
        {a.state === 'done' ? <Check size={12} strokeWidth={2.4} /> : a.state === 'running' ? <i /> : <span className="bl-act-o" />}
      </span>
      <span className="bl-act-l">{a.label}</span>
      {a.note && <em className="bl-act-n">{a.note}</em>}
    </div>
  )
}

function RenderBlock({ b }: { b: Block }) {
  switch (b.kind) {
    case 'p': return <p>{b.text}</p>
    case 'ul': return <ul>{b.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    case 'ol': return <ol>{b.items.map((t, i) => <li key={i}>{t}</li>)}</ol>
    case 'quote': return <blockquote>{b.text}</blockquote>
    case 'code': return <pre className="bl-code"><code>{b.code}</code></pre>
    case 'table': return (
      <div className="bl-tw">
        <table>
          <thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
  }
}
