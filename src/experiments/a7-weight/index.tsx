import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import type { Ctl } from '../../lab/ctl'
import { useWeight } from './useWeight'
import { stamp, type LogKind } from './scenario'
import './style.css'

/**
 * A7 · Weight —— 一块分量表 + 一条等宽日志流
 *
 * 上半区是表，指针指到哪就是这件事值多少过程；
 * 下半区是过程本身，一行一行刷出来。两件事是连着的：
 * 表越大，下面刷得越密，而且第三个任务跑到一半，日志区会自己撑开。
 *
 * 字体几乎只有一种：等宽。圆角只有 2–4px，没有阴影，
 * 层级全靠那几条发丝线和三种灰。整站唯一的颜色是琥珀，
 * 而且它只出现在「分量」和「它自己拿不准的地方」上。
 */
export default function Weight({ playing, speed, runId }: Ctl) {
  const { state, api } = useWeight({ playing, speed, runId })
  const [draft, setDraft] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const ask = state.cur >= 0 ? state.asks[state.cur] : undefined

  useEffect(() => {
    const e = bodyRef.current
    if (e) e.scrollTop = e.scrollHeight
  }, [state.lines.length])

  return (
    <div className="wt7" data-grown={state.grown ? '1' : '0'}>
      <header className="wt7-top">
        <span className="wt7-brand">Weight</span>
        <span className="wt7-ask">{ask ? ask.text : '还没派活'}</span>
        {state.grown && <span className="wt7-flag">过程区已撑开</span>}
      </header>

      <section className="wt7-gauge">
        <Gauge v={state.w} />
        <div className="wt7-g-side">
          <div className="wt7-g-num">
            <b>{state.w}</b>
            <span>/ 100</span>
          </div>
          <p className="wt7-g-lab">这件事需要多少过程</p>
          {state.grown && (
            <p className="wt7-g-grew">比预想的复杂，过程区自己撑开了 —— 不是它想说，是你得看。</p>
          )}
        </div>
        <div className="wt7-g-scale">
          <span>一句话</span>
          <span>中等</span>
          <span>整个项目</span>
        </div>
      </section>

      <section className="wt7-log">
        <header className="wt7-log-h">
          <span className="wt7-log-t">过程</span>
          <span className="wt7-log-n">{state.lines.length} 行</span>
        </header>
        <div className="wt7-log-b" ref={bodyRef}>
          {state.lines.length === 0 ? (
            <p className="wt7-log-e">等它开口。</p>
          ) : (
            state.lines.map((l, i) => (
              <div className="wt7-l" data-k={l.k} key={i}>
                <span className="wt7-l-t">{stamp(l.at)}</span>
                <span className="wt7-l-k">{KIND[l.k]}</span>
                <span className="wt7-l-x">{l.text}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="wt7-dock">
        <form
          className="wt7-form"
          onSubmit={(e) => { e.preventDefault(); api.submit(draft); setDraft('') }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="派一件事，比如：把首页标题改成红色"
            aria-label="派一件事给 Agent"
          />
          <button type="submit" disabled={!draft.trim()} title="派出去" aria-label="派出去">
            <ArrowUp size={14} strokeWidth={2.2} />
          </button>
        </form>
        <p className="wt7-note">
          一句话只有三行过程；说「整个项目」，它会自己把下面这块撑开。
        </p>
      </footer>
    </div>
  )
}

const KIND: Record<LogKind, string> = {
  think: '想',
  read: '读',
  edit: '改',
  run: '跑',
  ok: '成',
  warn: '疑',
}

/** 半环表。弧长用 dasharray 做，指针按角度算，都跟着 v 走 */
function Gauge({ v }: { v: number }) {
  const R = 78
  const LEN = Math.PI * R
  const off = LEN * (1 - Math.max(0, Math.min(100, v)) / 100)
  const rad = ((180 - v * 1.8) * Math.PI) / 180
  const px = 100 + Math.cos(rad) * (R - 16)
  const py = 100 - Math.sin(rad) * (R - 16)

  return (
    <svg className="wt7-g" viewBox="0 0 200 112" aria-hidden>
      <path
        d={`M${100 - R} 100 A ${R} ${R} 0 0 1 ${100 + R} 100`}
        fill="none" stroke="#2a2b2c" strokeWidth="9" strokeLinecap="round"
      />
      <path
        className="wt7-g-arc"
        d={`M${100 - R} 100 A ${R} ${R} 0 0 1 ${100 + R} 100`}
        fill="none" stroke="#e0a33e" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={LEN} strokeDashoffset={off}
      />
      <line className="wt7-g-needle" x1="100" y1="100" x2={px} y2={py} stroke="#e0a33e" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="100" r="4.5" fill="#111213" stroke="#e0a33e" strokeWidth="1.5" />
    </svg>
  )
}
