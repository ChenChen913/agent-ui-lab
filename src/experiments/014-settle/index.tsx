import { useEffect, useRef, useState } from 'react'
import { CornerDownRight, Undo2 } from 'lucide-react'
import { TITLE, type Doc } from './scenario'
import { useSettle } from './useSettle'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 014 · Settle —— 过程沉淀成产物
 *
 * 这个界面里没有过程面板。只有一份正在长出来的文档，
 * 每一段左边的页边标记，就是产出它的那一步。
 *
 * 最要紧的交互是反向的：撤掉一个来源，看文档少掉什么。
 */
export default function Settle({ playing, speed, runId }: Ctl) {
  const { state, api } = useSettle({ playing, speed, runId })
  const [focus, setFocus] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight }, [state.docs])

  const active = hover ?? focus
  const writing = state.docs.some((d) => d.state === 'writing')

  return (
    <div className="st">
      <header className="st-top">
        <div className="st-top-l">
          <span className="st-dot" data-live={writing ? '1' : '0'} />
          {TITLE}
        </div>
        <div className="st-top-r">{state.docs.filter((d) => d.state === 'done').length} 段</div>
      </header>

      <div className="st-body" ref={bodyRef}>
        <div className="st-paper">
          <div className="st-margin">
            {state.srcs.map((s) => (
              <button
                key={s.id} className="st-mark" data-s={s.state} data-on={active === s.id ? '1' : '0'}
                onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
                onClick={() => api.dropSrc(s.id)}
                title={s.state === 'dropped' ? '恢复这一步' : '撤掉这一步，看文档少掉什么'}
              >
                <span className="st-mark-d" />
                <span className="st-mark-t">{s.label}</span>
                {s.count && <span className="st-mark-c">{s.count}</span>}
              </button>
            ))}
          </div>

          <article className="st-doc">
            {state.docs.length === 0 && (
              <div className="st-wait">
                <h1>它一开始写，这里就会出现东西</h1>
                <p>左边那一条是它做过的事。每一段右边都连着一个来源。</p>
              </div>
            )}

            {state.docs.map((d) => (
              <div
                key={d.id} className="st-blk" data-state={d.state} data-lit={active === d.src ? '1' : '0'}
                onMouseEnter={() => setHover(d.src)} onMouseLeave={() => setHover(null)}
              >
                <span className="st-link" data-src={d.src} />
                <Render d={d} />
                {d.state === 'dropped' && (
                  <button className="st-undo" onClick={() => api.dropSrc(d.src)}><Undo2 size={12} strokeWidth={2} />恢复</button>
                )}
              </div>
            ))}

            {writing && <span className="st-cursor" />}
          </article>
        </div>
      </div>

      <footer className="st-foot">
        <CornerDownRight size={13} strokeWidth={1.9} />
        <span>每一段左边的标记，就是产出它的那一步。点它可以撤掉。</span>
      </footer>
    </div>
  )
}

function Render({ d }: { d: Doc }) {
  switch (d.kind) {
    case 'h': return <h2>{d.text}</h2>
    case 'p': return <p>{d.text}</p>
    case 'quote': return <blockquote>{d.text}</blockquote>
    case 'ul': return <ul>{d.items?.map((t, i) => <li key={i}>{t}</li>)}</ul>
    case 'table': return (
      <div className="st-tw"><table>
        <tbody>{d.rows?.map((r, i) => (
          <tr key={i}>{r.map((c, j) => (i === 0 ? <th key={j}>{c}</th> : <td key={j}>{c}</td>))}</tr>
        ))}</tbody>
      </table></div>
    )
  }
}
