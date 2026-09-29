import { motion } from 'motion/react'
import { FileText, PenLine, RotateCcw, Scale, Search, Sparkles, type LucideIcon } from 'lucide-react'
import { useBench, type BenchStep } from '../useBench'
import { SCENARIO, USER_ASK, type StepKind } from '../scenario'
import { Counter, barStyle } from '../parts'
import type { BenchProps } from '../types'
import './style.css'

/**
 * C · 冷调玻璃 —— 「一块会呼吸的仪器面板」
 *
 * 动效性格：流畅、有惯性（spring）。沉降 = 像液体一样流上去。
 * 生死线：禁止任何渐变背景，玻璃只用一层纯色。否则立刻变成「AI 味」。
 */

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 28 }

const KIND_ICON: Record<StepKind, LucideIcon> = {
  think: Sparkles,
  search: Search,
  read: FileText,
  verify: Scale,
  write: PenLine,
}

const TOTAL = SCENARIO.length

export default function BenchC({ playing, speed, runId }: BenchProps) {
  const s = useBench({ playing, speed, runId })

  const active = s.activeId ? s.steps[s.activeId] : null
  const trail = s.order.filter((id) => id !== s.activeId)
  const progress = s.order.length / 5

  return (
    <div className="bc">
      <div className="bc-aura bc-aura-1" />
      <div className="bc-aura bc-aura-2" />

      <div className="bc-stage">
        <div className="bc-col">
          {s.output && (
            <motion.article
              className="bc-output bc-glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
            >
              <div className="bc-output-kicker">OUTPUT</div>
              <h2 className="bc-output-title">{s.output.title}</h2>
              <p className="bc-output-meta">{s.output.meta}</p>
            </motion.article>
          )}

          <div className="bc-hero-slot">
            {active && (
              <motion.section
                key={active.id}
                className="bc-hero bc-glass"
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={SPRING}
              >
                <div className="bc-hero-glow" />
                <header className="bc-hero-head">
                  <span className="bc-kind">
                    {(() => {
                      const I = KIND_ICON[active.kind]
                      return <I size={15} strokeWidth={1.75} />
                    })()}
                  </span>
                  <h3 className="bc-hero-label">{active.label}</h3>
                  <span className="bc-live">
                    <span className="bc-live-dot" />
                    LIVE
                  </span>
                </header>

                {active.detail && <p className="bc-hero-detail">{active.detail}</p>}

                {active.count && (
                  <p className="bc-hero-count">
                    <Counter span={active.count} speed={speed} className="bc-num" />
                    <span className="bc-hero-count-unit">sources</span>
                  </p>
                )}

                {active.subs.length > 0 && (
                  <ul className="bc-subs">
                    {active.subs.map((x) => (
                      <li key={x.id} className={x.done ? 'is-done' : ''}>
                        <span className="bc-sub-dot" />
                        <span className="bc-sub-text">{x.text}</span>
                        <span className="bc-sub-state">{x.done ? 'ok' : '…'}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {active.bar && (
                  <div className="bc-bar">
                    <div className="bc-bar-fill" key={active.bar.seq} style={barStyle(active.bar, speed)} />
                  </div>
                )}

                {active.retry && (
                  <motion.div
                    className="bc-retry"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={SPRING}
                  >
                    <RotateCcw size={13} strokeWidth={1.75} />
                    {active.retry}
                  </motion.div>
                )}

                {active.note && <div className="bc-note">{active.note}</div>}
              </motion.section>
            )}
          </div>

          <ol className="bc-trail">
            {trail.map((id) => {
              const st = s.steps[id]
              if (!st) return null
              return (
                <motion.li
                  key={id}
                  layout
                  className={st.note ? 'is-warn' : ''}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING, layout: SPRING }}
                >
                  <span className="bc-tick" />
                  <span className="bc-trail-dot" />
                  <span className="bc-trail-label">{st.label}</span>
                  <span className="bc-trail-lead" />
                  <span className="bc-trail-dur">{st.duration?.toFixed(1)}s</span>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </div>

      <footer className="bc-foot">
        <div className="bc-foot-inner">
          <div className="bc-ask">
            <span className="bc-ask-who">USER</span>
            {USER_ASK}
          </div>
          <div className="bc-composer bc-glass">
            <span className="bc-composer-ph">说点什么…</span>
            <span className="bc-composer-key">↵</span>
          </div>
          <div className="bc-meter">
            <div className="bc-meter-bar">
              <div className="bc-meter-fill" style={{ transform: `scaleX(${progress})` }} />
            </div>
            <span className="bc-meter-text">
              {String(s.order.length).padStart(2, '0')} / 05 · {TOTAL} beats
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
