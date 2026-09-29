import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ENTRIES, HERO, LAB_SUB, type Entry } from './registry'
import { PREVIEWS, type PreviewProps } from './previews'
import ThemeToggle from './ThemeToggle'

export default function LabIndex() {
  const live = ENTRIES.filter((e) => e.status === 'live' && PREVIEWS[e.no])
  const planned = ENTRIES.filter((e) => e.status === 'planned')

  return (
    <div className="min-h-full lab-bg">
      <div className="mx-auto max-w-6xl px-8 pb-14 pt-8">
        <div className="mb-3 flex justify-end">
          <ThemeToggle />
        </div>

        {/* ── 首屏：居中的大标题 ───────────────────────────── */}
        <header className="relative pb-14 pt-6 text-center">
          <div className="lab-hero-glow" />
          <div className="relative">
            <div className="mb-7 font-mono text-[12px] tracking-[0.18em] lab-t3">
              AGENT UI LAB · {live.length} 个实验
            </div>

            <h1 className="lab-hero lab-rise mx-auto text-[38px] font-medium leading-[1.16] tracking-[-0.035em] sm:text-[52px] lg:text-[64px]">
              {HERO.line1}
              <br />
              {HERO.line2}
            </h1>

            <p
              className="lab-rise mx-auto mt-8 max-w-2xl text-[14.5px] leading-[1.95] lab-t2"
              style={{ animationDelay: '90ms' }}
            >
              {LAB_SUB}
            </p>
          </div>
        </header>

        {/* ── 六个实验 ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((e) => <Card key={e.no} e={e} />)}
        </div>

        <section className="mt-14 border-t pt-7 lab-line">
          <div className="mb-4 font-mono text-[12px] tracking-[0.16em] lab-t3">待做</div>
          <ul className="flex flex-col gap-2.5">
            {planned.map((e, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="w-9 font-mono text-[12.5px] tabular-nums lab-t3">{e.no}</span>
                <span className="text-[14px] font-medium lab-t2">{e.title}</span>
                <span className="text-[14px] lab-t3">{e.question}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t pt-6 text-[12.5px] lab-t3 lab-line-soft">
          <span>Agent UI Lab · 个人实验场 · 不做 SDK，不做 Runtime</span>
          <span>点卡片进入 · 进去之后左上角返回，或者用右上角直接翻页</span>
        </footer>
      </div>
    </div>
  )
}

/**
 * 六张卡片结构完全一致：
 *   预览图（带变体切换器） / 编号 + 标题 / 一句话问题 / 分隔线 / 标签 + 进入
 * 不论有几个变体，底部永远是「左边一个标签，右边一个进入」。
 */
function Card({ e }: { e: Entry }) {
  const P = PREVIEWS[e.no]
  const vs = e.variants ?? []
  const [sel, setSel] = useState(0)
  const v = vs[Math.min(sel, Math.max(0, vs.length - 1))]
  const multi = vs.length > 1

  const to = v?.href ?? (v ? e.slug + '/' + v.id : e.slug)
  const previewProps: PreviewProps = v
    ? { bg: v.bg, fg: v.fg, accent: v.accent, bg2: v.bg2 }
    : {}
  const label = v ? (multi ? v.name + ' · ' + v.tag : v.tag) : ''

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border lab-line lab-card lab-hover">
      {/* 整张卡就是一个入口；变体切换器浮在它上面 */}
      <Link to={to} className="absolute inset-0 z-10" aria-label={'进入 ' + e.title} />

      <div className="relative h-[150px] overflow-hidden border-b lab-line-soft">
        <P {...previewProps} />
        {multi ? (
          <div
            className="absolute right-2.5 top-2.5 z-20 flex items-center gap-0.5 rounded-lg border p-0.5 lab-line"
            style={{
              background: 'color-mix(in srgb, var(--lab-card) 84%, transparent)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {vs.map((x, i) => {
              const on = i === sel
              return (
                <button
                  key={x.id}
                  onClick={() => setSel(i)}
                  title={x.name}
                  aria-label={x.name}
                  aria-pressed={on}
                  className={
                    'h-6 w-6 rounded-md font-mono text-[11px] transition-colors ' +
                    (on ? 'lab-t1' : 'lab-t3 lab-hover-plain')
                  }
                  style={on ? { background: 'var(--lab-accent-soft)', color: 'var(--lab-accent)' } : undefined}
                >
                  {x.id.toUpperCase()}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[12px] tabular-nums lab-t3">{e.no}</span>
          <h3 className="text-[15px] font-medium tracking-[-0.01em] lab-t1">{e.title}</h3>
        </div>
        <p className="mt-2.5 min-h-[47px] text-[13px] leading-[1.8] lab-t2">{e.question}</p>
      </div>

      <div className="mt-auto border-t px-4 pb-4 pt-3.5 lab-line-soft">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate font-mono text-[11.5px] tracking-wide lab-t3">{label}</span>
          <span className="flex-none text-[12.5px] text-[color:var(--lab-t2)] transition-colors group-hover:text-[color:var(--lab-accent)]">
            进入 →
          </span>
        </div>
      </div>
    </article>
  )
}
