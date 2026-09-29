import { useEffect, useRef, useState } from 'react'
import {
  FileText, Folder, Menu, MessageSquare, MoreHorizontal, Scissors,
  Search, Smartphone, Smile, Star, Users,
} from 'lucide-react'
import { AGENT, ME, type Card, type Item, type Msg } from './scenario'
import { useBubble } from './useBubble'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 011 · Bubble —— 仿微信聊天
 *
 * 问题：如果 Agent 就长成你最熟悉的那个聊天软件的样子呢？
 *
 * 观点：微信早就有一套完整的词汇描述「异步、会失败、需要等待」的通信。
 *       正在输入 / 系统消息 / 文件卡片 / 红色感叹号，一条新的界面语言都不用发明。
 *
 * 样式按微信电脑版来：三栏（导航 / 会话列表 / 会话），
 * 收到是白气泡、发出是绿气泡，4px 圆角方形头像（不是圆的），气泡 5px 圆角。
 */
export default function Bubble({ playing, speed, runId }: Ctl) {
  const { state, api, chats } = useBubble({ playing, speed, runId })
  const [focus, setFocus] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 110) + 'px' }
  }, [state.typed])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.items, state.typing])

  const send = () => { if (state.typed.trim()) api.send(state.typed) }

  return (
    <div className="wc">
      {/* ── 最左导航条 ───────────────────────────────── */}
      <nav className="wc-nav">
        <div className="wc-nav-me" style={{ background: ME.color }}>{ME.initial}</div>
        <button className="wc-nav-i" data-on="1" title="聊天"><MessageSquare size={20} strokeWidth={1.7} /></button>
        <button className="wc-nav-i" title="通讯录"><Users size={20} strokeWidth={1.7} /></button>
        <button className="wc-nav-i" title="收藏"><Star size={20} strokeWidth={1.7} /></button>
        <button className="wc-nav-i" title="文件"><Folder size={20} strokeWidth={1.7} /></button>
        <div className="wc-sp" />
        <button className="wc-nav-i" title="手机"><Smartphone size={19} strokeWidth={1.7} /></button>
        <button className="wc-nav-i" title="更多"><Menu size={19} strokeWidth={1.7} /></button>
      </nav>

      {/* ── 会话列表 ─────────────────────────────────── */}
      <aside className="wc-list">
        <div className="wc-search">
          <Search size={13} strokeWidth={2} />
          <span>搜索</span>
        </div>
        <div className="wc-chats">
          {chats.map((c) => (
            <button key={c.id} className="wc-chat" data-active={c.active ? '1' : '0'}>
              <span className="wc-chat-av" style={{ background: c.color }}>{c.initial}</span>
              <span className="wc-chat-mid">
                <span className="wc-chat-n">{c.name}</span>
                <span className="wc-chat-l">{c.last}</span>
              </span>
              <span className="wc-chat-r">
                <span className="wc-chat-t">{c.time}</span>
                {c.unread ? <span className="wc-chat-b">{c.unread}</span> : null}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── 会话 ─────────────────────────────────────── */}
      <main className="wc-conv">
        <header className="wc-top">
          <div className="wc-top-t">
            {AGENT.name}
            {state.typing && <em className="wc-typing">对方正在输入…</em>}
          </div>
          <button className="wc-top-i" title="查找"><Search size={17} strokeWidth={1.8} /></button>
          <button className="wc-top-i" title="更多"><MoreHorizontal size={17} strokeWidth={1.8} /></button>
        </header>

        <div className="wc-body" ref={bodyRef}>
          <div className="wc-body-in">
            {state.items.map((it) => (
              it.kind === 'system'
                ? <div key={it.id} className="wc-sys"><span>{it.text}</span></div>
                : <Row key={it.id} m={it} hover={hover === it.id} api={api}
                    onHover={(v) => setHover(v ? it.id : null)} />
            ))}
          </div>
        </div>

        <footer className="wc-input" data-focus={focus ? '1' : '0'}>
          <div className="wc-tools">
            <button title="表情"><Smile size={19} strokeWidth={1.6} /></button>
            <button title="文件"><Folder size={19} strokeWidth={1.6} /></button>
            <button title="截图"><Scissors size={19} strokeWidth={1.6} /></button>
            <button title="聊天记录"><MessageSquare size={19} strokeWidth={1.6} /></button>
          </div>
          <textarea
            ref={taRef} className="wc-ta" rows={1} value={state.typed}
            onChange={(e) => api.setTyped(e.target.value)}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <div className="wc-send-row">
            <button className="wc-send" data-on={state.typed.trim() ? '1' : '0'} onClick={send}>发送(S)</button>
          </div>
        </footer>
      </main>
    </div>
  )
}

function Row({ m, hover, api, onHover }: { m: Msg; hover: boolean; api: any; onHover: (v: boolean) => void }) {
  const me = m.from === 'me'
  const who = me ? ME : AGENT

  return (
    <div className={'wc-row' + (me ? ' is-me' : '')} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <span className="wc-av" style={{ background: who.color }}>{who.initial}</span>

      <div className="wc-col">
        <div className="wc-nick">{who.name}</div>

        <div className="wc-bw">
          {m.state === 'sending' && <span className="wc-spin" title="发送中" />}
          {m.state === 'failed' && (
            <button className="wc-fail" title="发送失败，点击重发" onClick={() => api.retry(m.id)}>!</button>
          )}

          <div className="wc-bub" data-card={m.card ? '1' : '0'}>
            {m.text && <p className="wc-txt">{m.text}</p>}
            {m.card && <CardView card={m.card} />}
          </div>

          {hover && (
            <span className="wc-acts">
              <button onClick={() => navigator.clipboard?.writeText(m.text ?? m.card?.title ?? '')}>复制</button>
              {m.from === 'agent' && <button onClick={() => api.regen(m.id)}>重新生成</button>}
              <button onClick={() => api.recall(m.id)}>撤回</button>
            </span>
          )}
        </div>

        <div className="wc-time">{m.time}</div>
      </div>
    </div>
  )
}

function CardView({ card }: { card: Card }) {
  return (
    <div className="wc-card">
      <div className="wc-card-top">
        <span className="wc-card-ic" data-k={card.icon}><FileText size={21} strokeWidth={1.6} /></span>
        <span className="wc-card-mid">
          <span className="wc-card-t">{card.title}</span>
          <span className="wc-card-d">{card.desc}</span>
        </span>
      </div>
      <div className="wc-card-foot">
        <span>{card.meta}</span>
        <span>微信文件</span>
      </div>
    </div>
  )
}
