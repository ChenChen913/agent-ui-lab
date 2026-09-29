import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react'
import type { BenchProps } from '../experiments/001-bench/types'

const SPEEDS = [0.5, 1, 2]

export interface FrameProps {
  no: string
  title: string
  variants: { id: string; name: string }[]
  current: string
  render: (ctl: BenchProps) => ReactNode
}

export default function Frame({ no, title, variants, current, render }: FrameProps) {
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [runId, setRunId] = useState(0)
  const navigate = useNavigate()

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

        <nav className="ml-2 flex items-center gap-1">
          {variants.map((v) => {
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
