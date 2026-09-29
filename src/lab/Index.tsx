import { Link } from 'react-router-dom'
import { ENTRIES, LAB_INTRO } from './registry'

export default function LabIndex() {
  const live = ENTRIES.filter((e) => e.status === 'live')
  const planned = ENTRIES.filter((e) => e.status === 'planned')

  return (
    <div className="min-h-full bg-[#0b0c0f] text-[#e7e9ee]">
      <div className="mx-auto max-w-5xl px-8 py-20">
        <header className="mb-16">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#5f6675]">
            Agent UI Lab
          </div>
          <h1 className="max-w-2xl text-[34px] font-medium leading-[1.2] tracking-[-0.02em] text-[#f2f4f8]">
            {LAB_INTRO}
          </h1>
          <p className="mt-5 max-w-xl text-[14px] leading-[1.75] text-[#8b93a3]">
            这里不做统一的设计系统，也不做组件库。每个实验都是一个独立的小界面，
            有自己的视觉语言。唯一不变的问题是：
            <span className="text-[#c3c9d4]"> Agent 干活的过程，用户看得懂吗？</span>
          </p>
        </header>

        {live.map((e) => (
          <section key={e.no} className="mb-16">
            <div className="mb-5 flex items-baseline gap-4">
              <span className="font-mono text-[13px] tabular-nums text-[#5f6675]">{e.no}</span>
              <h2 className="text-[17px] font-medium tracking-[-0.01em]">{e.title}</h2>
              <span className="text-[13px] text-[#767e8d]">{e.question}</span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {e.variants?.map((v) => (
                <Link
                  key={v.id}
                  to={v.href ?? `${e.slug}/${v.id}`}
                  className="group block overflow-hidden rounded-xl border border-[#1d2129] bg-[#101218] transition-colors hover:border-[#333a47]"
                >
                  <div
                    className="relative h-40 overflow-hidden px-5 py-5 transition-transform duration-500 group-hover:scale-[1.02]"
                    style={{ background: v.bg, color: v.fg }}
                  >
                    {v.bg2 ? (
                      <div className="absolute inset-y-0 right-0 w-[42%]" style={{ background: v.bg2 }} />
                    ) : null}
                    <div className="relative w-[54%]">
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-45">
                        {v.id.toUpperCase()}
                      </div>
                      <div className="mt-9 h-[2px] w-2/3 opacity-25" style={{ background: v.fg }} />
                      <div className="mt-2.5 h-[9px] w-full rounded-full opacity-80" style={{ background: v.fg }} />
                    </div>
                    <div
                      className="absolute bottom-5 left-5 h-[3px] w-14"
                      style={{ background: v.accent }}
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-[13px] font-medium text-[#dfe3ea]">{v.name}</span>
                    <span className="font-mono text-[10px] tracking-wide text-[#666e7c]">{v.tag}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section>
          <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#5f6675]">
            待做
          </div>
          <ul className="divide-y divide-[#171a21] border-y border-[#171a21]">
            {planned.map((e, i) => (
              <li key={i} className="flex items-baseline gap-5 py-3.5">
                <span className="w-8 font-mono text-[12px] tabular-nums text-[#3f4551]">{e.no}</span>
                <span className="w-24 text-[13px] text-[#4d5462]">{e.title}</span>
                <span className="text-[13px] text-[#454b58]">{e.question}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-20 font-mono text-[10px] tracking-wide text-[#3a4049]">
          agent-ui-lab · 个人实验场 · 不做 SDK，不做 Runtime
        </footer>
      </div>
    </div>
  )
}
