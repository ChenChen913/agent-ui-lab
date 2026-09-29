import { Fragment, useState } from 'react'
import { ArrowUp, LoaderCircle } from 'lucide-react'
import type { Ctl } from '../../lab/ctl'
import { useLedger } from './useLedger'
import { PARAS, QUERY, sliceCites, type Source } from './scenario'
import './style.css'

/**
 * A8 · Ledger —— 中央阅读运河 + 页边注
 *
 * 可信这件事，靠的是「每一句都能顺着编号查到底」。
 * 所以正文占中间一列，编号是上标，出处卡片浮在正文右侧的页边空白处，
 * 跟引用它的那一段齐平 —— 眼睛不用在两栏之间来回跳。
 *
 * 衬线正文、1.9 倍行高、正文字号 17px，是照着「读一篇东西」做的，
 * 不是照着「看一个界面」做的。全站只有一个颜色（青绿），
 * 而且它只属于一件事：被验证过、能查到底的出处。
 */
export default function Ledger({ playing, speed, runId }: Ctl) {
  const { state, api } = useLedger({ playing, speed, runId })
  const [draft, setDraft] = useState('')
  const ok = state.sources.filter((s) => s.state === 'ok').length

  return (
    <div className="lg8">
      <header className="lg8-top">
        <div className="lg8-q">{QUERY}</div>
        <div className="lg8-meta">
          <span className="lg8-m-n">{state.sources.length} 个来源</span>
          <span className="lg8-m-dot">·</span>
          <span className="lg8-m-ok">{ok} 个已验证</span>
        </div>
      </header>

      <div className="lg8-body">
        <div className="lg8-doc">
          {PARAS.slice(0, state.shown).map((p, i) => (
            <Fragment key={i}>
              <p className="lg8-p" data-warn={p.warn ? '1' : '0'}>
                <Body text={p.text} hl={state.hl} onHl={api.hl} />
              </p>
              <div className="lg8-side">
                {p.cites.map((n) => {
                  const s = state.sources.find((x) => x.n === n)
                  if (!s) return null
                  return (
                    <Note
                      key={n}
                      s={s}
                      on={state.hl === n}
                      onEnter={() => api.hl(n)}
                      onLeave={() => api.hl(null)}
                    />
                  )
                })}
              </div>
            </Fragment>
          ))}

          {state.follow.map((f, i) => (
            <Fragment key={'f' + i}>
              <div className="lg8-fu">
                <div className="lg8-fu-q">{f.q}</div>
                <div className="lg8-fu-a">{f.a}</div>
              </div>
              <div className="lg8-side" />
            </Fragment>
          ))}
        </div>
      </div>

      <footer className="lg8-dock">
        <form
          className="lg8-composer"
          onSubmit={(e) => { e.preventDefault(); api.ask(draft); setDraft('') }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="顺着上面追问一句…"
            aria-label="追问"
          />
          <button type="submit" disabled={!draft.trim()} title="发送" aria-label="发送">
            <ArrowUp size={14} strokeWidth={2.2} />
          </button>
        </form>
        <p className="lg8-note">每个数字后面都有出处。悬停编号，页边那张卡会亮。</p>
      </footer>
    </div>
  )
}

/** 正文：把 [n] 渲染成上标编号 */
function Body({ text, hl, onHl }: { text: string; hl: number | null; onHl: (n: number | null) => void }) {
  return (
    <>
      {sliceCites(text).map((seg, i) =>
        seg.t === 's' ? (
          <Fragment key={i}>{seg.v}</Fragment>
        ) : (
          <button
            key={i}
            className="lg8-cite"
            data-on={hl === seg.v ? '1' : '0'}
            onMouseEnter={() => onHl(seg.v)}
            onMouseLeave={() => onHl(null)}
            onFocus={() => onHl(seg.v)}
            onBlur={() => onHl(null)}
            title={'出处 ' + seg.v}
          >
            {seg.v}
          </button>
        ),
      )}
    </>
  )
}

function Note({ s, on, onEnter, onLeave }: {
  s: Source; on: boolean; onEnter: () => void; onLeave: () => void
}) {
  return (
    <div
      className="lg8-note-c"
      data-on={on ? '1' : '0'}
      data-s={s.state}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span className="lg8-nc-n">{String(s.n).padStart(2, '0')}</span>
      <span className="lg8-nc-b">
        <span className="lg8-nc-t">{s.title}</span>
        <span className="lg8-nc-d">{s.domain} · 引 {s.hits} 次</span>
      </span>
      <span className="lg8-nc-s">
        {s.state === 'ok' ? '已验证' : <LoaderCircle size={12} strokeWidth={2} className="lg8-spin" />}
      </span>
    </div>
  )
}
