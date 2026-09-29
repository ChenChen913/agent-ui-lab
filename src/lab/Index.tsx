import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ENTRIES, GITHUB, HERO, LAB_SUB, LINES, UI, lineIndex, type Entry } from './registry'
import { PREVIEWS, type PreviewProps } from './previews'
import { useLang } from './lang'
import LangToggle from './LangToggle'
import ThemeToggle from './ThemeToggle'
import GithubMark from './GithubMark'

/**
 * 总页面。中英文两版，右上角切换。
 *
 * 项目有两条主线，主页就分两栏，一栏一条，绝不混着排：
 *   A · Agent 主界面         —— 用户应该如何使用 Agent
 *   B · Agent 工作过程可视化 —— Agent 干活的时候，怎么让用户看懂
 *
 * 每个模板只属于一条线，卡片网格在每栏里重新开始。
 */
export default function LabIndex() {
  const { lang, setLang, t } = useLang()
  const live = ENTRIES.filter((e) => e.status === 'live' && PREVIEWS[e.no])

  return (
    <div className="min-h-full lab-bg">
      <div className="mx-auto max-w-6xl px-8 pb-14 pt-8">
        <div className="mb-3 flex items-center justify-end gap-2">
          <a
            className="lab-ib"
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            title={'GitHub · ' + t(UI.source)}
            aria-label="GitHub"
          >
            <GithubMark size={15} />
          </a>
          <LangToggle lang={lang} setLang={setLang} />
          <ThemeToggle lang={lang} />
        </div>

        <header className="relative pb-12 pt-6 text-center">
          <div className="lab-hero-glow" />
          <div className="relative">
            <h1 className="lab-hero lab-rise mx-auto text-balance text-[38px] font-medium leading-[1.16] tracking-[-0.035em] sm:text-[52px] lg:text-[64px]">
              {t(HERO.line1)}
              <br />
              {t(HERO.line2)}
            </h1>
            <p className="lab-rise mx-auto mt-8 max-w-2xl text-[14.5px] leading-[1.95] lab-t2" style={{ animationDelay: '90ms' }}>
              {t(LAB_SUB)}
            </p>
          </div>
        </header>

        {LINES.map((line) => {
          const items = live.filter((e) => e.line === line.id)
          return (
            <section key={line.id} className="mb-16">
              <div className="lab-lh">
                <span className="lab-lh-badge">{line.id.toUpperCase()}</span>
                <h2 className="lab-lh-t">{t(line.name)}</h2>
                <span className="lab-lh-n">{items.length} {t(UI.count)}</span>
              </div>
              <p className="lab-lh-q">{t(line.question)}</p>
              <p className="lab-lh-d">{t(line.desc)}</p>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {items.map((e) => <Card key={e.no} e={e} t={t} />)}
              </div>
            </section>
          )
        })}

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t pt-6 lab-line">
          <span className="text-[13px] lab-t3">MIT License · © 2026 ChenChen913</span>
          <a
            className="font-mono text-[13px] lab-t3 lab-hover-plain"
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
          >
            github.com/ChenChen913/agent-ui-lab
          </a>
        </footer>
      </div>
    </div>
  )
}

/**
 * 每个模板一张卡，结构完全一致：
 *   预览图（带变体切换器） / 编号 + 名称 / 一句话问题 / 分隔线 / 标签 + 进入
 */
function Card({ e, t }: { e: Entry; t: (v: { zh: string; en: string }) => string }) {
  const P = PREVIEWS[e.no]
  const vs = e.variants ?? []
  const [sel, setSel] = useState(0)
  const v = vs[Math.min(sel, Math.max(0, vs.length - 1))]
  const multi = vs.length > 1

  const to = v?.href ?? (v ? e.slug + '/' + v.id : e.slug)
  const previewProps: PreviewProps = v ? { bg: v.bg, fg: v.fg, accent: v.accent, bg2: v.bg2, vn: v.id } : {}
  const label = v ? (multi ? t(v.name ? { zh: v.name, en: v.name } : v.tag) : t(v.tag)) : ''

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border lab-line lab-card lab-hover">
      <Link to={to} className="absolute inset-0 z-10" aria-label={t(e.title)} />

      <div className="relative h-[240px] overflow-hidden border-b lab-line-soft">
        <P {...previewProps} />
        {multi ? (
          <div
            className="absolute right-2.5 top-2.5 z-20 flex items-center gap-0.5 rounded-lg border p-0.5 lab-line"
            style={{ background: 'color-mix(in srgb, var(--lab-card) 84%, transparent)', backdropFilter: 'blur(8px)' }}
          >
            {vs.map((x, i) => {
              const on = i === sel
              return (
                <button
                  key={x.id} onClick={() => setSel(i)} title={t(x.tag)} aria-label={t(x.tag)} aria-pressed={on}
                  className={'h-6 w-6 rounded-md font-mono text-[11px] transition-colors ' + (on ? 'lab-t1' : 'lab-t3 lab-hover-plain')}
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
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[17px] font-semibold tabular-nums lab-t3">{lineIndex(e)}</span>
          <h3 className="text-[21px] font-semibold tracking-[-0.024em] lab-t1">{t(e.title)}</h3>
        </div>
        <p className="mt-2.5 min-h-[48px] text-[13.5px] leading-[1.8] lab-t2">{t(e.question)}</p>
      </div>

      <div className="mt-auto border-t px-4 pb-4 pt-3.5 lab-line-soft">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate font-mono text-[11.5px] tracking-wide lab-t3">{label}</span>
          <span className="flex-none text-[12.5px] text-[color:var(--lab-t2)] transition-colors group-hover:text-[color:var(--lab-accent)]">
            {t(UI.enter)} →
          </span>
        </div>
      </div>
    </article>
  )
}
