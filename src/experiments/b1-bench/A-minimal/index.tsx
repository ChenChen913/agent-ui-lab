import { motion } from 'motion/react'
import { useBench, type BenchStep } from '../useBench'
import { Counter, barStyle } from '../parts'
import type { BenchProps } from '../types'
import './style.css'

/**
 * A · 极简黑白 —— 「一份正在被写出来的文件」
 *
 * 动效性格：快、硬、干脆。只用位移 + 透明度，不用缩放。
 * 约束：全片只允许出现两次红色（矛盾标记 / 它的残留记号）。
 */

// 硬朗，不弹
const EASE: [number, number, number, number] = [0.2, 0, 0, 1]

export default function BenchA({ playing, speed, runId }: BenchProps) {
  const { state: s, api } = useBench({ playing, speed, runId })

  return (
    <div className="ba">
      <div className="ba-page">
        <div className="ba-rail" />

        <div className="ba-body">
          {s.output && (
            <motion.div
              className="ba-output"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="ba-kicker">REPORT</div>
              <h2 className="ba-output-title">{s.output.title}</h2>
              <div className="ba-output-meta">{s.output.meta}</div>
            </motion.div>
          )}

          <ul className="ba-list">
            {s.order.map((id) => {
              const st = s.steps[id]
              if (!st) return null
              const active = id === s.activeId
              return (
                <motion.li
                  key={id}
                  layout
                  className={active ? 'ba-row is-active' : 'ba-row'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: EASE, layout: { duration: 0.42, ease: EASE } }}
                >
                  {active ? <Hero st={st} speed={speed} /> : <Trail st={st} />}
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="ba-foot">
        <div className="ba-ask">
          <span>你</span>
          {s.ask}
        </div>
        <form
          className="ba-composer"
          onSubmit={(e) => {
            e.preventDefault()
            api.submit()
          }}
        >
          <input
            className="ba-composer-input"
            value={api.draft}
            onChange={(e) => api.setDraft(e.target.value)}
            placeholder="说点什么…"
            aria-label="给 Agent 一件事"
          />
          <kbd>{api.busy ? '···' : '↵'}</kbd>
        </form>
      </div>
    </div>
  )
}

function Hero({ st, speed }: { st: BenchStep; speed: number }) {
  return (
    <div className="ba-hero">
      <div className="ba-hero-head">
        <span className="ba-caret" />
        <h3 className="ba-hero-label">{st.label}</h3>
      </div>

      {st.detail && <div className="ba-hero-detail">{st.detail}</div>}

      {st.count && (
        <div className="ba-hero-count">
          <Counter span={st.count} speed={speed} className="ba-num" />
          <span className="ba-hero-count-unit">个来源</span>
        </div>
      )}

      {st.subs.length > 0 && (
        <ul className="ba-subs">
          {st.subs.map((x) => (
            <li key={x.id} className={x.done ? 'is-done' : ''}>
              <span className="ba-sub-mark">{x.done ? '✓' : '·'}</span>
              {x.text}
            </li>
          ))}
        </ul>
      )}

      {st.bar && (
        <div className="ba-bar">
          <div className="ba-bar-fill" key={st.bar.seq} style={barStyle(st.bar, speed)} />
        </div>
      )}

      {st.retry && (
        <motion.div
          className="ba-retry"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.24, ease: EASE }}
        >
          <span className="ba-retry-arrow">↺</span>
          {st.retry}
        </motion.div>
      )}

      {st.note && (
        <div className="ba-note">
          <span className="ba-note-mark" />
          {st.note}
        </div>
      )}
    </div>
  )
}

function Trail({ st }: { st: BenchStep }) {
  return (
    <div className="ba-trail">
      <span className={st.note ? 'ba-trail-mark is-warn' : 'ba-trail-mark'}>
        {st.note ? '!' : '✓'}
      </span>
      <span className="ba-trail-label">{st.label}</span>
      {st.duration != null && <span className="ba-trail-dur">{st.duration.toFixed(1)}s</span>}
    </div>
  )
}
