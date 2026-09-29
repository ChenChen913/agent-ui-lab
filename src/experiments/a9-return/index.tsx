import { ChevronRight, Clock, HelpCircle, Minus, Sparkles } from 'lucide-react'
import { GONE, type Item } from './scenario'
import { useReturn } from './useReturn'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * A9 · Return —— 你不在的时候
 *
 * 回来的界面不是一条你没读过的长消息，是一份简报。
 * 四层，按你需要介入的程度排。
 *
 * 底部那条细线是你离开的 23 分钟 —— 它是**有长度的**，
 * 上面几个点标着值得看的时刻。
 */
export default function Return({ playing, speed, runId }: Ctl) {
  const { state, api } = useReturn({ playing, speed, runId })

  const need = state.items.filter((i) => i.kind === 'need')
  const took = state.items.filter((i) => i.kind === 'took')

  return (
    <div className="rt">
      <header className="rt-top">
        <Clock size={15} strokeWidth={1.8} />
        <span className="rt-top-t">你离开了 {GONE}</span>
        {state.ignored && <span className="rt-top-r">{state.ignored.count} 步不需要你看</span>}
      </header>

      <div className="rt-body">
        <div className="rt-col">
          {!state.arrived && <div className="rt-ghost" />}

          {need.length > 0 && (
            <section className="rt-sec">
              <h2 className="rt-h"><i className="rt-h-dot" data-k="need" />需要你决定<em>{need.length}</em></h2>
              {need.map((i) => (
                <div key={i.id} className="rt-need" data-done={i.answered ? '1' : '0'}>
                  <p>{i.text}</p>
                  {i.answered
                    ? <div className="rt-chose">你选了：{i.answered}</div>
                    : <div className="rt-opts">{(i.options ?? []).map((o) => <button key={o} onClick={() => api.answer(i.id, o)}>{o}</button>)}</div>}
                </div>
              ))}
            </section>
          )}

          {took.length > 0 && (
            <section className="rt-sec">
              <h2 className="rt-h"><i className="rt-h-dot" data-k="took" />我替你决定了<em>{took.length}</em></h2>
              <div className="rt-list">
                {took.map((i) => <Took key={i.id} i={i} onToggle={() => api.toggle(i.id)} onAsk={() => api.alwaysAsk(i.id)} />)}
              </div>
            </section>
          )}

          {state.ignored && (
            <section className="rt-sec">
              <button className="rt-ign">
                <Minus size={14} strokeWidth={2} />
                可以忽略的
                <em>{state.ignored.count} 步 · {state.ignored.minutes} 分钟</em>
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </section>
          )}
        </div>
      </div>

      {/* 你离开的这段时间 */}
      <footer className="rt-band">
        <div className="rt-col">
          <div className="rt-track">
            <span className="rt-line" />
            <span className="rt-fill" style={{ width: (state.items.length ? Math.max(...state.items.map((i) => i.at)) : 0) * 100 + '%' }} />
            {state.items.map((i) => (
              <button
                key={i.id} className="rt-tick" data-k={i.kind} style={{ left: i.at * 100 + '%' }}
                title={i.time + ' ' + i.text}
                onClick={() => { if (i.kind === 'took') api.toggle(i.id) }}
              />
            ))}
          </div>
          <div className="rt-scale">
            <span>09:38 你走了</span>
            <span>10:01 你回来</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Took({ i, onToggle, onAsk }: { i: Item; onToggle: () => void; onAsk: () => void }) {
  return (
    <div className="rt-row" data-open={i.open ? '1' : '0'}>
      <button className="rt-row-h" onClick={onToggle}>
        <span className="rt-time">{i.time}</span>
        <span className="rt-row-t">{i.text}</span>
        <span className="rt-why">为什么<ChevronRight size={12} strokeWidth={2.2} className="rt-chev" /></span>
      </button>

      <div className="rt-row-b">
        <div className="rt-row-bi">
          <div className="rt-was">
            <div className="rt-was-l">当时摆着两个选项</div>
            <div className="rt-was-o">
              {i.was?.options.map((o) => (
                <span key={o} className="rt-opt" data-chose={o === i.was?.chose ? '1' : '0'}>{o}</span>
              ))}
            </div>
          </div>
          <p className="rt-why-t">{i.was?.why}</p>
          <button className="rt-ask" data-on={i.alwaysAsk ? '1' : '0'} onClick={onAsk}>
            <HelpCircle size={12} strokeWidth={2} />
            {i.alwaysAsk ? '以后这种事会问你' : '下次这种事问我'}
          </button>
        </div>
      </div>
    </div>
  )
}
