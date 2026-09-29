import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import { NAV } from './registry'
import type { Ctl } from './ctl'

const SPEEDS = [0.5, 1, 2]

export interface FrameProps {
  no: string
  title: string
  variants?: { id: string; name: string }[]
  current?: string
  render: (ctl: Ctl) => ReactNode
}

export default function Frame({ no, title, variants, current, render }: FrameProps) {
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [runId, setRunId] = useState(0)
  const navigate = useNavigate()

  const i = NAV.findIndex((n) => n.no === no)
  const prev = i > 0 ? NAV[i - 1] : null
  const next = i >= 0 && i < NAV.length - 1 ? NAV[i + 1] : null

  const restart = (next?: string) => {
    if (next !== undefined) {
      navigate(`/${no}/${next}`)
    }
    setRunId((n) => n + 1)
    setPlaying(true)
  }

  return (
    <div className="flex h-full flex-col bg-[#0b0c0f]">
      <header className="flex h-12 flex-none items-center gap-4 border-b border-[#1a1e25] px-4">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-[12px] text-[#7b8494] transition-colors hover:text-[#c9cfda]"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          实验室
        </Link>

        <div className="h-4 w-px bg-[#22262e]" />

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tabular-nums text-[#5f6675]">{no}</span>
          <span className="text-[12.5px] font-medium text-[#dfe3ea]">{title}</span>
        </div>

        <nav className={'ml-2 flex items-center gap-1 ' + (variants && variants.length > 1 ? '' : 'hidden')}>
          {(variants ?? []).map((v) => {
            const on = v.id === current
            return (
              <button
                key={v.id}
                onClick={() => restart(v.id)}
                className={
                  'rounded-md px-2.5 py-1 text-[12px] transition-colors ' +
                  (on
                    ? 'bg-[#1c2029] text-[#e7e9ee]'
                    : 'text-[#6d7583] hover:bg-[#15181f] hover:text-[#aeb5c1]')
                }
              >
                {v.name}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {prev ? (
            <Link
              to={prev.route}
              title={prev.no + ' · ' + prev.title}
              className="flex h-7 w-[54px] items-center justify-center gap-1 rounded-md text-[11.5px] text-[#6d7583] transition-colors hover:bg-[#15181f] hover:text-[#e7e9ee]"
            >
              <ArrowLeft size={12} strokeWidth={1.75} />
              {prev.no}
            </Link>
          ) : (
            <span className="h-7 w-[54px]" />
          )}
          {next ? (
            <Link
              to={next.route}
              title={next.no + ' · ' + next.title}
              className="flex h-7 w-[54px] items-center justify-center gap-1 rounded-md text-[11.5px] text-[#6d7583] transition-colors hover:bg-[#15181f] hover:text-[#e7e9ee]"
            >
              {next.no}
              <ArrowRight size={12} strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="h-7 w-[54px]" />
          )}

          <div className="mx-1 h-4 w-px bg-[#22262e]" />

          <button
            onClick={() => setPlaying((p) => !p)}
            title={playing ? '暂停' : '播放'}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8b93a3] transition-colors hover:bg-[#15181f] hover:text-[#e7e9ee]"
          >
            {playing ? <Pause size={14} strokeWidth={1.75} /> : <Play size={14} strokeWidth={1.75} />}
          </button>

          <button
            onClick={() => restart()}
            title="重播"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8b93a3] transition-colors hover:bg-[#15181f] hover:text-[#e7e9ee]"
          >
            <RotateCcw size={14} strokeWidth={1.75} />
          </button>

          <div className="flex items-center gap-0.5 rounded-md bg-[#12151b] p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={
                  'rounded px-1.5 py-0.5 font-mono text-[10.5px] transition-colors ' +
                  (s === speed ? 'bg-[#232833] text-[#e7e9ee]' : 'text-[#6d7583] hover:text-[#aeb5c1]')
                }
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {render({ playing, speed, runId })}
      </div>
    </div>
  )
}
