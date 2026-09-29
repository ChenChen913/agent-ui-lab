import { AnimatePresence, motion } from 'motion/react'
import '@fontsource-variable/fraunces'
import { useBench } from '../useBench'
import { Counter, barStyle } from '../parts'
import type { BenchProps } from '../types'
import './style.css'

/**
 * B · 暖色纸张 —— 「Agent 在为你写一本书」
 *
 * 动效性格：慢、柔、有重量。沉降 = 像纸一样落下并变薄。
 * 布局：双栏书页。左边是目录（按阅读顺序编号），右边是正在写的那一页。
 */

const EASE: [number, number, number, number] = [0.22, 0.61, 0.24, 1]

export default function BenchB({ playing, speed, runId }: BenchProps) {
  const { state: s, api } = useBench({ playing, speed, runId })

  const active = s.activeId ? s.steps[s.activeId] : null
  // 目录按阅读顺序（最早的在最上面）
  const done = s.order.filter((id) => id !== s.activeId).slice().reverse()

  return (
    <div className="bb">
      <div className="bb-grain" />

      <div className="bb-page">
        <aside className="bb-margin">
          <div className="bb-margin-title">目录</div>
          <ol className="bb-index">
            {done.map((id, i) => {
              const st = s.steps[id]
              if (!st) return null
              return (
                <motion.li
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: EASE, layout: { duration: 0.55, ease: EASE } }}
                >
                  <span className="bb-index-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="bb-index-label">{st.label.replace(/^正在/, '')}</span>
                  {st.note && <span className="bb-index-mark" title={st.note}>!</span>}
                </motion.li>
              )
            })}
          </ol>
        </aside>

        <section className="bb-main">
          <AnimatePresence>
            {s.output && (
              <motion.article
                key="out"
                className="bb-output"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: EASE }}
              >
                <div className="bb-output-kicker">报告</div>
                <h2 className="bb-output-title">{s.output.title}</h2>
                <p className="bb-output-meta">{s.output.meta}</p>
              </motion.article>
            )}
          </AnimatePresence>

          <div className="bb-stage">
            <AnimatePresence>
              {active && (
                <motion.div
                  key={active.id}
                  className="bb-hero"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.3, ease: EASE } }}
                  transition={{ duration: 0.55, ease: EASE }}
                >
                  <div className="bb-hero-kicker">正在写</div>
                  <h3 className="bb-hero-label">{active.label.replace(/^正在/, '')}</h3>

                  {active.detail && <p className="bb-hero-detail">{active.detail}</p>}

                  {active.count && (
                    <p className="bb-hero-count">
                      <Counter span={active.count} speed={speed} className="bb-num" />
                      <span>个来源</span>
                    </p>
                  )}

                  {active.subs.length > 0 && (
                    <ul className="bb-subs">
                      {active.subs.map((x) => (
                        <li key={x.id} className={x.done ? 'is-done' : ''}>
                          <span className="bb-sub-mark">{x.done ? '✓' : '·'}</span>
                          {x.text}
                        </li>
                      ))}
                    </ul>
                  )}

                  {active.bar && (
                    <div className="bb-bar">
                      <div className="bb-bar-fill" key={active.bar.seq} style={barStyle(active.bar, speed)} />
                    </div>
                  )}

                  {active.retry && (
                    <motion.p
                      className="bb-retry"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      ↺ {active.retry}
                    </motion.p>
                  )}

                  {active.note && (
                    <motion.p
                      className="bb-note"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {active.note}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <footer className="bb-foot">
        <div className="bb-ask">
          <span className="bb-ask-who">你</span>
          {s.ask}
        </div>
        <form
          className="bb-composer"
          onSubmit={(e) => {
            e.preventDefault()
            api.submit()
          }}
        >
          <input
            className="bb-composer-input"
            value={api.draft}
            onChange={(e) => api.setDraft(e.target.value)}
            placeholder="说点什么…"
            aria-label="给 Agent 一件事"
          />
          <span className="bb-composer-key">{api.busy ? '···' : '↵'}</span>
        </form>
      </footer>
    </div>
  )
}
