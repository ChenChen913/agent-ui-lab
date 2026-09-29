import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp, Copy, FileText, Mic, Paperclip,
  RefreshCw, Square, ThumbsDown, ThumbsUp,
} from 'lucide-react'
import { AGENT, type Msg } from './scenario'
import { useBaseline } from './useBaseline'
import Markdown from './markdown'
import { ArtifactBody, ChartBody, ICONS, Proc, ReadBody, RunBody, SearchBody, ThinkingBody } from './parts'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 008 · 入口与对话
 *
 * 原 Baseline 与原 Home 是两个几乎一样的模板：一个带侧栏，一个去掉侧栏。
 * 合并之后它回答一个完整的问题——用户从打开产品到拿到结果，走的是一条什么路：
 *
 *   首页态  输入框悬在正中，问候语和几件事，没有别的家具
 *   ↳ 提交
 *   对话态  同一个输入框落到底部，过程、工具、图表、正文按它们本来的样子长出来
 *
 * 刻意不放侧栏、不放产物面板 —— 那是 009 Workbench 的领域。
 * 这里只有「一问一答」这条最纯粹的主干。
 */
const SUGGESTIONS: [string, string][] = [
  ['读一份文档', '提炼要点和结论'],
  ['比较两个方案', '列出取舍'],
  ['整理会议记录', '输出待办'],
  ['查最近的进展', '给出来源'],
]

export default function Baseline({ playing, speed, runId }: Ctl) {
  const { state, api } = useBaseline({ playing, speed, runId })
  const [focus, setFocus] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const idle = state.messages.length === 0
  const busy = state.messages.some((m) => m.role === 'agent' && (m.streaming ?? -1) >= 0)
  const isOpen = (id: string) => open[id] !== false

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }
  }, [state.typed])
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight }, [state.messages])

  const submit = () => { if (state.typed.trim()) api.send(state.typed) }

  const composer = (inHero: boolean) => (
    <div className={inHero ? 'bl-composer bl-composer-hero' : 'bl-composer'} data-focus={focus ? '1' : '0'}>
      <textarea
        ref={taRef} className="bl-ta" rows={1} value={state.typed}
        placeholder={busy ? 'Agent 正在执行…' : '问点什么…'}
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
  )

  /* ── 首页态：输入框悬在正中 ─────────────────────────── */
  if (idle) {
    const hour = new Date().getHours()
    const greet = hour < 5 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
    return (
      <div className="bl bl-home">
        <div className="bl-hero">
          <div className="bl-hero-mark">◇</div>
          <h1 className="bl-greet">{greet}</h1>
          <p className="bl-hero-sub">今天想让我帮你完成什么？</p>
          {composer(true)}
          <div className="bl-hero-sugs">
            {SUGGESTIONS.map(([t, h]) => (
              <button key={t} className="bl-sug" onClick={() => { api.pick(t); taRef.current?.focus() }}><b>{t}</b><span>{h}</span></button>
            ))}
          </div>
        </div>
        <div className="bl-home-note">Agent 可能会出错，请核对重要信息。</div>
      </div>
    )
  }

  /* ── 对话态：零家具，只有这条对话 ───────────────────── */
  return (
    <div className="bl bl-thread-page">
      <header className="bl-top">
        <button className="bl-logo-btn" onClick={api.home} title="回到首页"><span>◇</span></button>
        <div className="bl-top-t">{state.messages[0]?.text ?? '新对话'}</div>
      </header>

      <div className="bl-scroll" ref={bodyRef}>
        <div className="bl-col">
          <div className="bl-thread">
            {state.messages.map((m) => m.role === 'user'
              ? <UserMsg key={m.id} m={m} />
              : <AgentMsg key={m.id} m={m} isOpen={isOpen} toggle={(id) => setOpen((o) => ({ ...o, [id]: o[id] === false }))} />)}
          </div>
        </div>
      </div>

      <div className="bl-dock">
        {composer(false)}
        <div className="bl-note">Agent 可能会出错，请核对重要信息。</div>
      </div>
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
