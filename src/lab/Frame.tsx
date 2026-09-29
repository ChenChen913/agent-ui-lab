import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import GithubMark from './GithubMark'
import { GITHUB, NAV, UI, stampedNo } from './registry'
import { useLang } from './lang'
import LangToggle from './LangToggle'
import ThemeToggle from './ThemeToggle'
import type { Ctl } from './ctl'

const SPEEDS = [0.5, 1, 2]

export interface FrameProps {
  no: string
  title: string
  variants?: { id: string; name: string }[]
  current?: string
  /** 默认自动播放；A2 起的「产品态」实验停在用户刚打开的空状态，点播放才演示 */
  autoPlay?: boolean
  render: (ctl: Ctl) => ReactNode
}

export default function Frame({ no, title, variants, current, autoPlay = true, render }: FrameProps) {
  const [playing, setPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)
  const [runId, setRunId] = useState(0)
  const navigate = useNavigate()
  const { lang, setLang, t } = useLang()

  const i = NAV.findIndex((n) => n.no === no)
  const prev = i > 0 ? NAV[i - 1] : null
  const next = i >= 0 && i < NAV.length - 1 ? NAV[i + 1] : null

  const restart = (nextId?: string) => {
    if (nextId !== undefined) navigate('/' + no + '/' + nextId)
    setRunId((n) => n + 1)
    setPlaying(true)
  }

  const iconBtn =
    'flex h-8 w-8 items-center justify-center rounded-md lab-t2 lab-hover-plain'
  const navBtn =
    'flex h-8 w-[58px] items-center justify-center gap-1 rounded-md text-[12.5px] lab-t2 lab-hover-plain'
  const tab = (on: boolean) =>
    'rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors ' +
    (on ? 'font-medium lab-hover-plain' : 'lab-t3 lab-hover-plain')

  const divider = <div className="mx-1 h-4 w-px" style={{ background: 'var(--lab-line)' }} />

  return (
    <div className="flex h-full flex-col lab-bg">
      <header className="flex h-[52px] flex-none items-center gap-2.5 border-b px-4 lab-line">
        <Link to="/" className="flex items-center gap-1.5 text-[12.5px] lab-t2 lab-hover-plain">
          <ArrowLeft size={15} strokeWidth={2} />
          {t(UI.lab)}
        </Link>

        {divider}

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[12px] tabular-nums lab-t3">{stampedNo(no)}</span>
          <span className="text-[14px] font-medium lab-t1">{title}</span>
        </div>

        <nav className={'ml-1 flex items-center gap-1 ' + (variants && variants.length > 1 ? '' : 'hidden')}>
          {(variants ?? []).map((v) => {
            const on = v.id === current
            return (
              <button
                key={v.id}
                onClick={() => restart(v.id)}
                className={tab(on)}
                style={on ? { background: 'var(--lab-accent-soft)', color: 'var(--lab-accent)' } : undefined}
              >
                {v.name}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {prev ? (
            <Link to={prev.route} title={prev.no + ' · ' + prev.title} className={navBtn}>
              <ArrowLeft size={13} strokeWidth={2} />
              {stampedNo(prev.no)}
            </Link>
          ) : (
            <span className="h-8 w-[58px]" />
          )}
          {next ? (
            <Link to={next.route} title={next.no + ' · ' + next.title} className={navBtn}>
              {stampedNo(next.no)}
              <ArrowRight size={13} strokeWidth={2} />
            </Link>
          ) : (
            <span className="h-8 w-[58px]" />
          )}

          {divider}

          <a className="lab-gh" href={GITHUB} target="_blank" rel="noreferrer" title="GitHub 源码">
            <GithubMark size={15} />
          </a>

          <LangToggle lang={lang} setLang={setLang} compact />

          <ThemeToggle compact lang={lang} />

          {divider}

          <button onClick={() => setPlaying((p) => !p)} title={playing ? '暂停' : '播放'} className={iconBtn}>
            {playing ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
          </button>
          <button onClick={() => restart()} title="重播" className={iconBtn}>
            <RotateCcw size={15} strokeWidth={2} />
          </button>

          <div
            className="ml-0.5 flex items-center gap-0.5 rounded-md p-0.5"
            style={{ background: 'var(--lab-panel)', border: '1px solid var(--lab-line)' }}
          >
            {SPEEDS.map((s) => {
              const on = s === speed
              return (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={
                    'rounded px-2 py-1 font-mono text-[11.5px] transition-colors ' +
                    (on ? 'lab-t1' : 'lab-t3 lab-hover-plain')
                  }
                  style={on ? { background: 'var(--lab-accent-soft)' } : undefined}
                >
                  {s}×
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {render({ playing, speed, runId })}
      </div>
    </div>
  )
}
