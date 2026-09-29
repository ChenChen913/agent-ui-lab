import { Link } from 'react-router-dom'
import { ENTRIES, LAB_INTRO, type Entry } from './registry'
import { PREVIEWS } from './previews'
import ThemeToggle from './ThemeToggle'

export default function LabIndex() {
  const live = ENTRIES.filter((e) => e.status === 'live' && PREVIEWS[e.no])
  const planned = ENTRIES.filter((e) => e.status === 'planned')

  return (
    <div className="min-h-full lab-bg">
      <div className="mx-auto max-w-6xl px-8 py-12">
        <header className="mb-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-[12px] tracking-[0.16em] lab-t3">
              AGENT UI LAB · {live.length} 个实验
            </span>
            <ThemeToggle />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-x-14 gap-y-5">
            <h1 className="max-w-xl text-balance text-[31px] font-medium leading-[1.28] tracking-[-0.02em] lab-t1">
              {LAB_INTRO}
            </h1>
            <p className="max-w-lg pb-1 text-[14px] leading-[1.85] lab-t2">
              不做统一的设计系统，也不做组件库。每个实验都是一个独立的小界面，有自己的视觉语言。
              唯一不变的问题是
              <span className="font-medium lab-t1">「Agent 干活的过程，用户看得懂吗？」</span>
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((e) => <Card key={e.no} e={e} />)}
        </div>

        <section className="mt-12 border-t pt-7 lab-line">
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

function Card({ e }: { e: Entry }) {
  const P = PREVIEWS[e.no]
  const vs = e.variants ?? []
  const multi = vs.length > 1
  const main = vs[0]
  const to = (v?: { id: string; href?: string }) => v?.href ?? (v ? e.slug + '/' + v.id : e.slug)
  const mainTo = to(main)

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border lab-line lab-card lab-hover">
      <Link to={mainTo} className="block">
        <div className="h-[150px] overflow-hidden border-b lab-line-soft">
          <P />
        </div>
        <div className="px-4 pt-4">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-[12px] tabular-nums lab-t3">{e.no}</span>
            <h3 className="text-[15px] font-medium tracking-[-0.01em] lab-t1">{e.title}</h3>
          </div>
          <p className="mt-2.5 min-h-[47px] text-[13px] leading-[1.8] lab-t2">{e.question}</p>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 px-4 pb-4 pt-3.5">
        {multi ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {vs.map((v) => (
              <Link
                key={v.id}
                to={to(v)}
                className="rounded-md border px-2.5 py-1 text-[12.5px] lab-line lab-t2 lab-hover"
              >
                {v.name}
              </Link>
            ))}
          </div>
        ) : (
          <span className="truncate font-mono text-[11.5px] tracking-wide lab-t3">{main?.tag}</span>
        )}
        {multi ? null : (
          <Link to={mainTo} className="flex-none text-[12.5px] lab-t2 lab-hover-plain">
            进入 →
          </Link>
        )}
      </div>
    </article>
  )
}
