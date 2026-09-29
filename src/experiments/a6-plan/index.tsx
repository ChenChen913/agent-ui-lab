import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Ctl } from '../../lab/ctl'
import { usePlan } from './usePlan'
import { fmtS, type Step } from './scenario'
import './style.css'

/**
 * A6 · The Plan —— 一条横向的时间轴
 *
 * 计划不是一列待办，是一排摆在时间上的横条：哪一步什么时候开始、
 * 干多久、跟谁连着，一眼能看出来。所以「改一步」的代价也是看得见的 ——
 * 后面挂在它后面的整排往右挪，挪多少就是改一步真正的成本。
 *
 * 竖着的那条琥珀线是「现在」。它一直在走，条子在它左边是已经做完的，
 * 右边是还没轮到的。
 */
export default function Plan({ playing, speed, runId }: Ctl) {
  const { state, api } = usePlan({ playing, speed, runId })
  const [sel, setSel] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const steps = state.steps
  const total = state.total || 1
  const cur = steps.find((s) => s.id === sel)

  const pct = (ms: number) => ((ms / total) * 100).toFixed(3) + '%'

  return (
    <div className="pl6">
      <header className="pl6-top">
        <div className="pl6-title">
          <h1>给这个项目换一套登录样式</h1>
          <p>
            点右上角播放看它开干；跑起来之后点任意一步，可以把它拉长或改掉 ——
            后面挂在它后面的整排会跟着挪。
          </p>
        </div>
        <div className="pl6-meta">
          <span className="pl6-now" ref={api.bindNow}>0.0s</span>
          <span className="pl6-tot">/ {fmtS(total)}</span>
        </div>
      </header>

      <div className="pl6-axis">
        {ticks(total).map((t) => (
          <span key={t} className="pl6-tick" style={{ left: ((t / total) * 100).toFixed(3) + '%' }}>
            {fmtS(t)}
          </span>
        ))}
      </div>

      {steps.length === 0 ? (
        <div className="pl6-empty">
          <p>还没有计划。点右上角播放，它会先把要做的事排出来。</p>
        </div>
      ) : (
        <div className="pl6-body">
          <div className="pl6-names">
            {steps.map((s) => (
              <button
                key={s.id}
                className="pl6-name"
                data-s={s.state}
                data-sel={s.id === sel ? '1' : '0'}
                data-edited={s.id === state.edited ? '1' : '0'}
                onClick={() => setSel(s.id === sel ? null : s.id)}
                aria-pressed={s.id === sel}
              >
                <span className="pl6-n-i">{s.id.replace('s', '')}</span>
                <span className="pl6-n-l">{s.label}</span>
                {s.id === state.edited && <span className="pl6-n-e">改过</span>}
              </button>
            ))}
          </div>

          <div className="pl6-track">
            <div className="pl6-vgrid">
              {ticks(total).map((t) => (
                <i key={t} style={{ left: ((t / total) * 100).toFixed(3) + '%' }} />
              ))}
            </div>

            {steps.map((s) => (
              <div className="pl6-row" key={s.id}>
                <div
                  className="pl6-bar"
                  data-s={s.state}
                  data-sel={s.id === sel ? '1' : '0'}
                  style={{ left: pct(s.start), width: pct(s.dur) }}
                  onClick={() => setSel(s.id === sel ? null : s.id)}
                  title={s.label}
                >
                  <span className="pl6-fill" ref={(el) => api.bindFill(s.id, el)} />
                  <span className="pl6-bar-l">{s.label}</span>
                </div>
              </div>
            ))}

            <svg className="pl6-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {steps.map((s, i) => {
                const nxt = steps.find((x) => x.after === s.id)
                if (!nxt) return null
                const j = steps.indexOf(nxt)
                const x1 = ((s.start + s.dur) / total) * 100
                const y1 = ((i + 0.5) / steps.length) * 100
                const x2 = (nxt.start / total) * 100
                const y2 = ((j + 0.5) / steps.length) * 100
                return (
                  <path
                    key={s.id}
                    d={`M${x1} ${y1} L${x1 + 0.6} ${y1} L${x1 + 0.6} ${y2} L${x2} ${y2}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                )
              })}
            </svg>

            <div className="pl6-head" ref={api.bindHead} />
          </div>
        </div>
      )}

      {cur && (
        <footer className="pl6-foot">
          <div className="pl6-f-what">
            <span className="pl6-f-n">第 {cur.id.replace('s', '')} 步</span>
            <form
              className="pl6-f-form"
              onSubmit={(e) => { e.preventDefault(); api.relabel(cur.id, draft); setDraft('') }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={cur.label}
                aria-label="把这一步改成什么"
              />
              <button type="submit" disabled={!draft.trim()}>改</button>
            </form>
          </div>
          <div className="pl6-f-ops">
            <button onClick={() => api.stretch(cur.id, -1500)} title="缩短 1.5 秒">
              <Minus size={13} strokeWidth={2.2} /> 1.5s
            </button>
            <button onClick={() => api.stretch(cur.id, 1500)} title="拉长 1.5 秒">
              <Plus size={13} strokeWidth={2.2} /> 1.5s
            </button>
          </div>
          <span className="pl6-f-hint">改完看后面几条挪了多少 —— 那就是这一改的代价</span>
        </footer>
      )}
    </div>
  )
}

/** 轴上每隔几秒一根刻度；计划被改长之后刻度会跟着重算 */
function ticks(total: number): number[] {
  const stepMs = total > 30000 ? 8000 : total > 16000 ? 5000 : 3000
  const out: number[] = []
  for (let t = 0; t <= total; t += stepMs) out.push(t)
  return out
}

export type { Step }
