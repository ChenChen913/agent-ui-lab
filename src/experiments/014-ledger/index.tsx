import { useEffect, useRef, useState } from 'react'
import { ArrowUp, BadgeCheck, LoaderCircle } from 'lucide-react'
import { QUERY, type LBlock, type Src } from './scenario'
import { useLedger } from './useLedger'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 014 · Ledger —— 引用检索台
 *
 * 衬线正文，等宽角标，单一青绿。
 * 青绿色只给一种东西：被验证过、能查到底的出处。
 * 悬停角标亮来源，悬停来源亮角标；追问从底部的胶囊进去。
 */
export default function Ledger({ playing, speed, runId }: Ctl) {
  const { state, api } = useLedger({ playing, speed, runId })
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.blocks.length, state.asked.length])

  const citeCount = state.srcs.filter((s) => s.state === 'verified' && s.cites > 0).length

  return (
    <div className="lg">
      <header className="lg-top">
        <h1 className="lg-q">{QUERY}</h1>
        <div className="lg-meta">
          检索 {Math.max(state.srcs.length, 0)} 个来源 · <b>{citeCount}</b> 个被正文引用
        </div>
      </header>

      <div className="lg-body" ref={bodyRef}>
        <div className="lg-cols">
          <article className="lg-doc">
            {state.blocks.map((b) => <Block key={b.id} b={b} hl={state.hl} onHl={api.hl} />)}

            {state.asked.map((a, i) => (
              <div key={i} className="lg-fu">
                <div className="lg-fu-q">{a.q}</div>
                <div className="lg-fu-a"><Text text={a.a} hl={state.hl} onHl={api.hl} /></div>
              </div>
            ))}
          </article>

          <aside className="lg-rail">
            <header className="lg-rail-h">Sources</header>
            {state.srcs.map((s) => <SrcRow key={s.n} s={s} hl={state.hl} onHl={api.hl} />)}
          </aside>
        </div>
      </div>

      <footer className="lg-dock">
        <form
          className="lg-composer"
          onSubmit={(e) => { e.preventDefault(); api.ask() }}
        >
          <input
            className="lg-in"
            value={state.typed}
            onChange={(e) => api.setTyped(e.target.value)}
            placeholder="接着问…"
            aria-label="追问"
          />
          <button className="lg-go" disabled={!state.typed.trim()} title="发送"><ArrowUp size={14} strokeWidth={2.2} /></button>
        </form>
        <div className="lg-note">每个数字后面都有编号。点它能查到底。</div>
      </footer>
    </div>
  )
}

/* ── 正文块 ─────────────────────────────────────────────── */
function Block({ b, hl, onHl }: { b: LBlock; hl: number | null; onHl: (n: number | null) => void }) {
  if (b.kind === 'h') return <h2 className={'lg-h' + (b.state === 'writing' ? ' is-writing' : '')}>{b.text}</h2>
  const cls = 'lg-p' + (b.state === 'writing' ? ' is-writing' : '')
  return <p className={cls}><Text text={b.text} hl={hl} onHl={onHl} /></p>
}

/** 把 ‹n› 标记渲染成可交互的角标 */
function Text({ text, hl, onHl }: { text: string; hl: number | null; onHl: (n: number | null) => void }) {
  const parts = text.split(/(‹\d+›)/g)
  return (
    <>
      {parts.map((seg, i) => {
        const m = seg.match(/^‹(\d+)›$/)
        if (!m) return <span key={i}>{seg}</span>
        const n = Number(m[1])
        return (
          <sup
            key={i}
            className="lg-cite"
            data-hl={hl === n ? '1' : '0'}
            onMouseEnter={() => onHl(n)}
            onMouseLeave={() => onHl(null)}
            onClick={() => onHl(n)}
            title={'来源 ' + n}
          >
            {n}
          </sup>
        )
      })}
    </>
  )
}

/* ── 来源行 ─────────────────────────────────────────────── */
function SrcRow({ s, hl, onHl }: { s: Src; hl: number | null; onHl: (n: number | null) => void }) {
  const hot = hl === s.n
  return (
    <button
      className="lg-src"
      data-state={s.state}
      data-hl={hot ? '1' : '0'}
      onMouseEnter={() => onHl(s.n)}
      onMouseLeave={() => onHl(null)}
      onClick={() => onHl(hot ? null : s.n)}
    >
      <span className="lg-src-n">{String(s.n).padStart(2, '0')}</span>
      <span className="lg-src-mid">
        <span className="lg-src-t">{s.title}</span>
        <span className="lg-src-d">{s.domain}</span>
      </span>
      <span className="lg-src-st">
        {s.state === 'verified'
          ? <BadgeCheck size={13} strokeWidth={1.9} />
          : <LoaderCircle size={13} strokeWidth={1.9} className="lg-src-spin" />}
        {s.cites > 0 && <em>{s.cites}</em>}
      </span>
    </button>
  )
}
