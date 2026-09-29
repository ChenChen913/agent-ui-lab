import { Link } from 'react-router-dom'
import { ENTRIES, LAB_INTRO, type Entry } from './registry'
import { PREVIEWS } from './previews'

export default function LabIndex() {
  const live = ENTRIES.filter((e) => e.status === 'live' && PREVIEWS[e.no])
  const planned = ENTRIES.filter((e) => e.status === 'planned')

  return (
    <div className="min-h-full bg-[#0b0c0f] text-[#e7e9ee]">
      <div className="mx-auto max-w-6xl px-8 py-14">
        <header className="mb-11 flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f6675]">
              Agent UI Lab · 001 – {live[live.length - 1]?.no}
            </div>
            <h1 className="max-w-xl text-[29px] font-medium leading-[1.25] tracking-[-0.02em] text-[#f2f4f8]">
              {LAB_INTRO}
            </h1>
          </div>
          <p className="max-w-md pb-1 text-[12.5px] leading-[1.8] text-[#8b93a3]">
            不做统一的设计系统，也不做组件库。每个实验都是一个独立的小界面，有自己的视觉语言。
            唯一不变的问题是
            <span className="text-[#c3c9d4]">「Agent 干活的过程，用户看得懂吗？」</span>
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((e) => <Card key={e.no} e={e} />)}
        </div>

        <section className="mt-14 border-t border-[#171a21] pt-7">
          <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#4d5462]">
            待做
          </div>
          <ul className="flex flex-wrap gap-x-10 gap-y-2">
            {planned.map((e, i) => (
              <li key={i} className="flex items-baseline gap-4 text-[12.5px] text-[#4d5462]">
                <span className="w-8 font-mono text-[11px] tabular-nums text-[#3a4049]">{e.no}</span>
                <span className="text-[#5b6370]">{e.title}</span>
                <span>{e.question}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] tracking-wide text-[#3a4049]">
          <span>agent-ui-lab · 个人实验场 · 不做 SDK，不做 Runtime</span>
          <span>点卡片进入 · 进去后左上角返回，或用 {String.fromCharCode(8249)} {String.fromCharCode(8250)} 直接翻页</span>
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
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#1d2129] bg-[#101218] transition-colors duration-200 hover:border-[#3a4252]">
      <Link to={mainTo} className="block">
        <div className="h-[166px] overflow-hidden border-b border-[#171a21]">
          <P />
        </div>
        <div className="px-4 pt-4">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-[11px] tabular-nums text-[#5f6675]">{e.no}</span>
            <h3 className="text-[14px] font-medium tracking-[-0.01em] text-[#eef1f6]">{e.title}</h3>
          </div>
          <p className="mt-2.5 min-h-[42px] text-[11.5px] leading-[1.7] text-[#78818f]">{e.question}</p>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 px-4 pb-4 pt-3">
        {multi ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {vs.map((v) => (
              <Link
                key={v.id}
                to={to(v)}
                className="rounded-md border border-[#242a35] px-2 py-[3px] text-[11px] text-[#8b93a3] transition-colors hover:border-[#3a4252] hover:bg-[#161a22] hover:text-[#e7e9ee]"
              >
                {v.name}
              </Link>
            ))}
          </div>
        ) : (
          <span className="truncate font-mono text-[10px] tracking-wide text-[#525a67]">{main?.tag}</span>
        )}
        {multi ? null : (
          <Link
            to={mainTo}
            className="flex-none text-[11.5px] text-[#6f7887] transition-colors group-hover:text-[#c9cfda]"
          >
            进入 →
          </Link>
        )}
      </div>
    </article>
  )
}
