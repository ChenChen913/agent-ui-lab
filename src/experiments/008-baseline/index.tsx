import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp, Copy, FileText, HelpCircle, Mic, MoreHorizontal, Paperclip,
  PanelLeft, PanelRight, Plus, RefreshCw, Settings, Square, ThumbsDown, ThumbsUp, X,
} from 'lucide-react'
import { AGENT, type Msg, type Part } from './scenario'
import { useBaseline } from './useBaseline'
import Markdown from './markdown'
import { ArtifactBody, ChartBody, ICONS, Proc, ReadBody, RunBody, SearchBody, ThinkingBody } from './parts'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 008 · Baseline —— 通用聊天式 Agent 界面（高保真版）
 *
 * 概念没变：用户登录之后看到的那一层。
 * 变的是完成度 —— 一条 Agent 回复里，思考、搜索、读文件、跑代码、出图表、
 * 正文、产出全部真的渲染出来，一样都不是占位符。
 *
 * 默认不自动播放：第一眼是用户打开产品时的空状态。
 */
export default function Baseline({ playing, speed, runId }: Ctl) {
  const { state, api } = useBaseline({ playing, speed, runId })
  const [rail, setRail] = useState(true)
  const [focus, setFocus] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const idle = state.messages.length === 0
  const busy = state.messages.some((m) => m.role === 'agent' && (m.streaming ?? -1) >= 0)
  const lastAgent = [...state.messages].reverse().find((m) => m.role === 'agent')
  const isOpen = (id: string) => open[id] !== false

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }
  }, [state.typed])
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight }, [state.messages])

  const submit = () => { if (state.typed.trim()) api.send(state.typed) }

  return (
    <div className="bl" data-rail={rail ? '1' : '0'} data-canvas={state.canvasOpen ? '1' : '0'}>
      {/* ── 侧栏 ─────────────────────────────────────── */}
      <aside className="bl-rail">
        <div className="bl-brand"><span className="bl-logo">◇</span><span className="bl-brand-n">{AGENT.name}</span></div>
        <button className="bl-new" onClick={api.newChat}><Plus size={15} strokeWidth={2} />新建对话</button>
        <nav className="bl-hist">
          {[['今天', ['季度报告要点', '周报润色']], ['昨天', ['竞品定价对比', '重构方案评审']], ['更早', ['用户访谈整理', '数据口径对齐', '上线检查清单']]].map(([g, items]) => (
            <div key={g as string}>
              <div className="bl-hist-t">{g as string}</div>
              {(items as string[]).map((it) => <button key={it} className="bl-hist-i" data-active={it === '季度报告要点' ? '1' : '0'}>{it}</button>)}
            </div>
          ))}
        </nav>
        <div className="bl-rail-foot">
          <button className="bl-foot-i"><Settings size={14} strokeWidth={1.8} />设置</button>
          <button className="bl-foot-i"><HelpCircle size={14} strokeWidth={1.8} />帮助</button>
          <div className="bl-user"><span className="bl-avatar">陈</span><span>陈晨</span><span className="bl-user-p">个人版</span></div>
        </div>
      </aside>

      {/* ── 主区 ─────────────────────────────────────── */}
      <main className="bl-main">
        <header className="bl-top">
          <button className="bl-icon" onClick={() => setRail((v) => !v)} title="折叠侧栏"><PanelLeft size={16} strokeWidth={1.8} /></button>
          <div className="bl-top-t">{idle ? '新对话' : '季度报告要点'}</div>
          {!idle && (
            <button className="bl-icon" data-on={state.canvasOpen ? '1' : '0'} onClick={api.toggleCanvas} title="产物">
              <PanelRight size={16} strokeWidth={1.8} />
            </button>
          )}
          <button className="bl-icon" title="更多"><MoreHorizontal size={16} strokeWidth={1.8} /></button>
        </header>

        <div className="bl-scroll" ref={bodyRef}>
          <div className="bl-col">
            {idle ? (
              <div className="bl-welcome">
                <div className="bl-wm">◇</div>
                <h1>下午好</h1>
                <p>今天想让我帮你完成什么？</p>
                <div className="bl-sugs">
                  {[['读一份文档', '提炼要点和结论'], ['比较两个方案', '列出取舍'], ['整理会议记录', '输出待办'], ['查最近的进展', '给出来源']].map(([t, h]) => (
                    <button key={t} className="bl-sug" onClick={() => { api.pick(t); taRef.current?.focus() }}><b>{t}</b><span>{h}</span></button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bl-thread">
                {state.messages.map((m) => m.role === 'user'
                  ? <UserMsg key={m.id} m={m} />
                  : <AgentMsg key={m.id} m={m} isOpen={isOpen} toggle={(id) => setOpen((o) => ({ ...o, [id]: o[id] === false }))} />)}
              </div>
            )}
          </div>
        </div>

        <div className="bl-dock">
          <div className="bl-composer" data-focus={focus ? '1' : '0'}>
            <textarea
              ref={taRef} className="bl-ta" rows={1} value={state.typed}
              placeholder={busy ? 'Agent 正在执行…' : '说点什么…'}
              onChange={(e) => api.setTyped(e.target.value)}
              onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            />
            <div className="bl-bar">
              <button className="bl-cbtn" title="附件"><Paperclip size={15} strokeWidth={1.8} /></button>
              <button className="bl-cbtn" title="语音"><Mic size={15} strokeWidth={1.8} /></button>
              <button className="bl-model">{AGENT.name} {AGENT.model}<span className="bl-caret">▾</span></button>
              <div className="bl-sp" />
              {busy
                ? <button className="bl-stop" title="停止"><Square size={10} fill="currentColor" strokeWidth={0} /></button>
                : <button className="bl-send" onClick={submit} disabled={!state.typed.trim()} title="发送"><ArrowUp size={15} strokeWidth={2.2} /></button>}
            </div>
          </div>
          <div className="bl-note">Agent 可能会出错，请核对重要信息。</div>
        </div>
      </main>

      {/* ── Canvas ───────────────────────────────────── */}
      <aside className="bl-canvas">
        <div className="bl-canvas-in">
          <header className="bl-cv-h">
            <FileText size={14} strokeWidth={1.8} />
            <span>{lastAgent ? '季度报告要点.md' : '产物'}</span>
            <button className="bl-icon" onClick={api.toggleCanvas} title="关闭"><X size={15} strokeWidth={1.8} /></button>
          </header>
          <div className="bl-cv-b">
            {lastAgent
              ? <div className="bl-cv-doc"><Markdown text={(lastAgent.parts ?? []).filter((p): p is Extract<Part, { kind: 'md' }> => p.kind === 'md').map((p) => p.text).join('\n\n')} /></div>
              : <div className="bl-cv-empty"><FileText size={22} strokeWidth={1.4} /><p>Agent 产出的文档会出现在这里。</p></div>}
          </div>
          {lastAgent && <footer className="bl-cv-f"><button>下载 .md</button><button>在新标签打开</button></footer>}
        </div>
      </aside>
    </div>
  )
}

function UserMsg({ m }: { m: Msg }) {
  return (
    <div className="bl-u">
      <div className="bl-u-in">
        {m.text}
        {m.files && (
          <div className="bl-files">
            {m.files.map((f) => (
              <span key={f.name} className="bl-file" data-k={f.kind}>
                <FileText size={14} strokeWidth={1.7} />
                <span className="bl-file-n">{f.name}</span>
                <span className="bl-file-s">{f.size}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentMsg({ m, isOpen, toggle }: { m: Msg; isOpen: (id: string) => boolean; toggle: (id: string) => void }) {
  const parts = m.parts ?? []
  const proc = parts.filter((p) => p.kind === 'thinking' || p.kind === 'search' || p.kind === 'read' || p.kind === 'run')
  const secs = proc.reduce((a, p) => a + (p.kind === 'thinking' ? p.secs : p.kind === 'run' ? p.ms / 1000 : 0.6), 0)

  return (
    <div className="bl-a">
      <div className="bl-a-mark">◇</div>
      <div className="bl-a-body">
        {proc.length > 0 && (
          <div className="bl-proc">
            <div className="bl-proc-h">
              {m.done ? ICONS.done : <span className="pc-ring" />}
              {m.done ? '执行了 ' + proc.length + ' 步 · ' + secs.toFixed(1) + 's' : '正在执行 ' + proc.length + ' 步'}
            </div>
            {parts.map((p) => {
              if (p.kind === 'thinking') return (
                <Proc key={p.id} icon={ICONS.thinking} label="思考" note={p.secs ? p.secs + 's' : undefined} state={p.state} open={isOpen(p.id)} onToggle={() => toggle(p.id)}>
                  <ThinkingBody p={p} />
                </Proc>
              )
              if (p.kind === 'search') return (
                <Proc key={p.id} icon={ICONS.search} label={'搜索 · ' + p.query} note={p.hits.length ? p.hits.length + ' 条' : undefined} state={p.state} open={isOpen(p.id)} onToggle={() => toggle(p.id)}>
                  <SearchBody p={p} />
                </Proc>
              )
              if (p.kind === 'read') return (
                <Proc key={p.id} icon={ICONS.read} label={'读取 · ' + p.file} note={p.pages ? p.pages + ' 页' : undefined} state={p.state} open={isOpen(p.id)} onToggle={() => toggle(p.id)}>
                  <ReadBody p={p} />
                </Proc>
              )
              if (p.kind === 'run') return (
                <Proc key={p.id} icon={ICONS.run} label="运行代码" note={p.ms ? (p.ms / 1000).toFixed(1) + 's' : undefined} state={p.state} open={isOpen(p.id)} onToggle={() => toggle(p.id)}>
                  <RunBody p={p} />
                </Proc>
              )
              return null
            })}
          </div>
        )}

        {parts.map((p) => {
          if (p.kind === 'chart') return <div key={p.id} className="bl-chart"><ChartBody p={p} /></div>
          if (p.kind === 'md') return (
            <div key={p.id} className={'bl-mdb' + (parts.indexOf(p) === m.streaming ? ' is-stream' : '')}>
              <Markdown text={p.text} />
            </div>
          )
          if (p.kind === 'artifact') return <div key={p.id} className="bl-art"><ArtifactBody p={p} /></div>
          return null
        })}

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
