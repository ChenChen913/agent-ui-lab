import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, FileText, User } from 'lucide-react'
import { AGENT, ME, type Act, type Block, type Msg } from './scenario'
import { useBubble } from './useBubble'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * A5 · Bubble —— 头像一个昵称一条气泡
 *
 * 交互方式学聊天软件：双方都有头像、昵称、气泡，每条消息下面带时间。
 * 视觉不学微信的壳（没有三栏、没有会话列表），只有会话本身。
 *
 * 关键的不对称：
 *   用户  → 窄气泡，深绿底白字，贴着右边的头像
 *   Agent → 几乎占满宽度的白色面板，因为它装的不止一句话，
 *           还有执行过程、列表、以及最后产出的文件
 */
export default function Bubble({ playing, speed, runId }: Ctl) {
  const { state, api } = useBubble({ playing, speed, runId })
  const [focus, setFocus] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = taRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }
  }, [state.typed])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.messages, state.typing])

  const send = () => { if (state.typed.trim()) api.send(state.typed) }

  return (
    <div className="cb">
      <header className="cb-top">
        <span className="cb-top-av">{AGENT.initial}</span>
        <span className="cb-top-t">{AGENT.name}</span>
        <span className="cb-top-s" data-on={state.typing ? '1' : '0'}>
          {state.typing ? '正在输入…' : '在线'}
        </span>
      </header>

      <div className="cb-body" ref={bodyRef}>
        <div className="cb-col">
          {state.messages.map((m) => <Row key={m.id} m={m} />)}

          {state.typing && (
            <div className="cb-row">
              <span className="cb-av is-agent">{AGENT.initial}</span>
              <div className="cb-mid">
                <div className="cb-name">{AGENT.name}</div>
                <div className="cb-panel is-typing"><i /><i /><i /></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="cb-dock">
        <div className="cb-col">
          <div className="cb-composer" data-focus={focus ? '1' : '0'}>
            <textarea
              ref={taRef} className="cb-ta" rows={1} value={state.typed}
              placeholder="请描述您的问题，例如：这份报告的三个关键点是什么？"
              onChange={(e) => api.setTyped(e.target.value)}
              onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            <button
              className="cb-send" data-on={state.typed.trim() ? '1' : '0'}
              onClick={send} title="发送"
            >
              <ArrowUp size={17} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ m }: { m: Msg }) {
  const me = m.from === 'me'
  return (
    <div className="cb-row" data-me={me ? '1' : '0'}>
      {me
        ? <span className="cb-av is-me"><User size={20} strokeWidth={1.8} /></span>
        : <span className="cb-av is-agent">{AGENT.initial}</span>}

      <div className="cb-mid">
        <div className="cb-name">{me ? ME.name : AGENT.name}</div>

        {me ? (
          <div className="cb-bub">{(m.blocks[0] as { kind: 'p'; text: string }).text}</div>
        ) : (
          <div className="cb-panel">
            {m.blocks.map((b, i) => (
              <div key={i} className={'cb-blk' + (i === m.streaming ? ' is-stream' : '')}>
                <RenderBlock b={b} />
              </div>
            ))}
            {m.blocks.length === 0 && <div className="cb-blk"><p className="cb-p cb-muted">…</p></div>}
          </div>
        )}

        <div className="cb-time">{m.time}</div>
      </div>
    </div>
  )
}

/** 支持 **加粗** 的行内语法，够这个演示用了 */
function Rich({ text }: { text: string }) {
  const parts = text.split('**')
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>))}</>
}

function RenderBlock({ b }: { b: Block }) {
  switch (b.kind) {
    case 'p': return <p className="cb-p"><Rich text={b.text} /></p>
    case 'ul': return <ul className="cb-ul">{b.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ul>
    case 'ol': return <ol className="cb-ol">{b.items.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ol>
    case 'quote': return <div className="cb-quote"><Rich text={b.text} /></div>
    case 'acts': return <Acts acts={b.acts} />
    case 'card': return (
      <div className="cb-card">
        <span className="cb-card-ic"><FileText size={20} strokeWidth={1.7} /></span>
        <span className="cb-card-mid">
          <span className="cb-card-t">{b.title}</span>
          <span className="cb-card-d">{b.desc}</span>
        </span>
        <span className="cb-card-m">{b.meta}</span>
      </div>
    )
  }
}

function Acts({ acts }: { acts: Act[] }) {
  const live = acts.some((a) => a.state === 'running')
  const done = acts.filter((a) => a.state === 'done').length
  return (
    <div className="cb-acts" data-live={live ? '1' : '0'}>
      <div className="cb-acts-h">
        {live ? <span className="cb-acts-ring" /> : <span className="cb-acts-ok"><Check size={11} strokeWidth={2.8} /></span>}
        {live ? '正在执行 ' + acts.length + ' 个步骤' : '已完成 ' + done + ' 个步骤'}
      </div>
      <div className="cb-acts-l">
        {acts.map((a, i) => (
          <div key={i} className="cb-act" data-s={a.state}>
            <span className="cb-act-d" />
            <span className="cb-act-t">{a.label}</span>
            {a.note && <em className="cb-act-n">{a.note}</em>}
          </div>
        ))}
      </div>
    </div>
  )
}
