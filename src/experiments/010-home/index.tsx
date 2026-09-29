import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp, Book, Check, ChevronRight, Clock, FileText, Globe, Home as HomeIcon,
  Layers, Link2, MoreHorizontal, Paperclip, Plus, Search, Settings, Sparkles,
  Square, Wrench, X,
} from 'lucide-react'
import { AGENT, NAV, SUGGESTIONS, type Block, type Msg, type Step } from './scenario'
import { useHome } from './useHome'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 010 · Home —— 下一代 AI Operating System 的感觉
 *
 * 和 008 / 009 最大的区别：
 *   1. 首页就是这个产品本身，输入框悬在正中，不贴在底部
 *   2. Agent 状态是一行微小的指示器，做完自动收起
 *   3. 右侧是 Context（它用了什么），默认收起
 */
export default function Home({ playing, speed, runId }: Ctl) {
  const { state, api } = useHome({ playing, speed, runId })
  const [focus, setFocus] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const onHome = state.messages.length === 0
  const live = state.steps.some((s) => s.state === 'running')
  const allDone = state.steps.length > 0 && state.steps.every((s) => s.state === 'done')
  const cur = state.steps.find((s) => s.state === 'running')
  const ctxCount = state.ctx.files + state.ctx.sources + state.ctx.tools + (state.ctx.memory ? 1 : 0)

  const hour = new Date().getHours()
  const greet = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px' }
  }, [state.typed, onHome])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.messages, state.steps])

  const composer = (
    <div className="hm-composer" data-focus={focus ? '1' : '0'}>
      <textarea
        ref={taRef} className="hm-ta" rows={1} value={state.typed}
        placeholder="Ask anything…"
        onChange={(e) => api.setTyped(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (state.typed.trim()) api.send(state.typed) } }}
      />
      <div className="hm-bar">
        <button className="hm-cbtn" title="附件"><Plus size={15} strokeWidth={2} /></button>
        <span className="hm-cbtn-t">Attach</span>
        <button className="hm-cbtn" title="工具"><Wrench size={14} strokeWidth={1.8} /></button>
        <span className="hm-cbtn-t">Tools</span>
        <div className="hm-sp" />
        <button className="hm-model">Model<ChevronRight size={13} strokeWidth={2} className="hm-model-c" /></button>
        <button
          className="hm-send"
          onClick={() => { if (state.typed.trim()) api.send(state.typed) }}
          disabled={!state.typed.trim()}
          title="发送"
        >
          <ArrowUp size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )

  if (onHome) {
    return (
      <div className="hm hm-home">
        <button className="hm-home-logo" title={AGENT.name}>
          <span>◇</span>
        </button>

        <div className="hm-home-in">
          <h1 className="hm-greet">{greet}</h1>
          <p className="hm-sub">今天想让我帮你完成什么？</p>

          <div className="hm-sugs">
            {SUGGESTIONS.map((s) => (
              <button key={s.k} className="hm-sug" onClick={() => { api.pick(s.title); taRef.current?.focus() }}>
                <b>{s.title}</b>
                <span>{s.hint}</span>
              </button>
            ))}
          </div>

          <div className="hm-home-composer">{composer}</div>
        </div>

        <div className="hm-home-foot">
          <button className="hm-foot-b"><Sparkles size={13} strokeWidth={1.8} />记忆已开启</button>
        </div>
      </div>
    )
  }

  return (
    <div className="hm hm-app" data-ctx={state.ctx.open ? '1' : '0'}>
      <nav className="hm-nav">
        <button className="hm-nav-brand" onClick={api.goHome} title="回到首页">◇</button>
        <div className="hm-nav-items">
          {NAV.map((n, i) => (
            <button key={n.id} className="hm-nav-i" data-active={i === 0 ? '1' : '0'} onClick={api.goHome}>
              <NavIcon id={n.id} />
              <span>{n.label}</span>
            </button>
          ))}
        </div>
        <button className="hm-nav-i hm-nav-set"><Settings size={16} strokeWidth={1.7} /></button>
      </nav>

      <main className="hm-main">
        <header className="hm-top">
          <div className="hm-top-t">{state.messages[0]?.text ?? '新对话'}</div>
          <button className="hm-ctx-btn" data-on={state.ctx.open ? '1' : '0'} onClick={api.toggleCtx}>
            <Layers size={14} strokeWidth={1.8} />
            Context
            {ctxCount > 0 && <em>{ctxCount}</em>}
          </button>
        </header>

        <div className="hm-scroll" ref={scrollRef}>
          <div className="hm-col">
            <div className="hm-thread">
              {state.messages.map((m, i) => (
                <div key={m.id} className="hm-item">
                  <Bubble m={m} />
                  {m.role === 'user' && isLastUser(state.messages, i) && state.steps.length > 0 && (
                    <Status steps={state.steps} live={live} done={allDone} open={state.stepsOpen} cur={cur?.label} onToggle={api.toggleSteps} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hm-dock">{composer}</div>
      </main>

      <aside className="hm-ctx">
        <div className="hm-ctx-in">
          <header className="hm-ctx-h">
            <span>Context</span>
            <button className="hm-icon" onClick={api.toggleCtx} title="收起"><X size={15} strokeWidth={1.8} /></button>
          </header>
          <div className="hm-ctx-b">
            <CtxRow icon={<FileText size={13} strokeWidth={1.7} />} n={state.ctx.files} label="文件" />
            <CtxRow icon={<Link2 size={13} strokeWidth={1.7} />} n={state.ctx.sources} label="来源" />
            <CtxRow icon={<Wrench size={13} strokeWidth={1.7} />} n={state.ctx.tools} label="工具" />
            <div className="hm-ctx-sep" />
            <CtxRow icon={<Clock size={13} strokeWidth={1.7} />} n={state.ctx.memory ? 1 : 0} label="记忆" />
          </div>
        </div>
      </aside>
    </div>
  )
}

const isLastUser = (ms: Msg[], i: number) => ms[i].role === 'user' && !ms.slice(i + 1).some((x) => x.role === 'user')

function NavIcon({ id }: { id: string }) {
  const p = { size: 16, strokeWidth: 1.7 } as const
  if (id === 'home') return <HomeIcon {...p} />
  if (id === 'tasks') return <Layers {...p} />
  if (id === 'lib') return <Book {...p} />
  return <Sparkles {...p} />
}

function CtxRow({ icon, n, label }: { icon: React.ReactNode; n: number; label: string }) {
  return (
    <div className="hm-ctx-r" data-empty={n === 0 ? '1' : '0'}>
      <span className="hm-ctx-ic">{icon}</span>
      <span className="hm-ctx-n">{n}</span>
      <span className="hm-ctx-l">{label}</span>
    </div>
  )
}

function Status({ steps, live, done, open, cur, onToggle }: {
  steps: Step[]; live: boolean; done: boolean; open: boolean; cur?: string; onToggle: () => void
}) {
  return (
    <div className="hm-status" data-done={done ? '1' : '0'}>
      <button className="hm-status-h" onClick={onToggle}>
        {live ? <i className="hm-status-d" /> : <Check size={12} strokeWidth={2.6} />}
        <span>{live ? cur : steps.length + ' 步'}</span>
        <ChevronRight size={12} strokeWidth={2} className={'hm-status-c' + (open ? ' is-open' : '')} />
      </button>
      <div className="hm-status-b" data-open={open ? '1' : '0'}>
        <div className="hm-status-bi">
          {steps.map((s) => (
            <div key={s.id} className="hm-step" data-s={s.state}>
              <span className="hm-step-d" />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Bubble({ m }: { m: Msg }) {
  if (m.role === 'user') return <div className="hm-u">{m.text}</div>
  return (
    <div className="hm-a">
      {m.blocks?.map((b, i) => (
        <div key={i} className={'hm-b' + (i === m.streaming ? ' is-stream' : '')}>
          <DocBlock b={b} />
        </div>
      ))}
    </div>
  )
}

function DocBlock({ b }: { b: Block }) {
  switch (b.kind) {
    case 'p': return <p>{b.text}</p>
    case 'ul': return <ul>{b.items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    case 'quote': return <blockquote>{b.text}</blockquote>
  }
}
