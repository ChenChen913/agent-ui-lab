import { useState } from 'react'
import { Pause, Play, Plus, X } from 'lucide-react'
import type { Ctl } from '../../lab/ctl'
import { useMission } from './useMission'
import { fmtMs, tally, type Agent, type AgentState, type Gate } from './scenario'
import './style.css'

/**
 * A4 · Mission Control —— 多 Agent 并行控制塔
 *
 * 主角不是对话，是状态。屏幕是一块卡片网格，一张卡一个 agent：
 * 它在干什么、干到哪了、花了多久、烧了多少钱，四件事全在卡上。
 *
 * 撞墙的那张卡整张泛琥珀，并且把自己挪到底下那条「待你拍板」里 ——
 * 那一块是这一页唯一的交互高潮，不该埋在网格里跟别的卡抢视线。
 *
 * 视觉参考 Linear：深蓝黑底、一层发丝线、只有一个彩色（indigo），
 * 状态色是例外，且只出现在「需要你看一眼」的那一刻。
 */
export default function Mission({ playing, speed, runId }: Ctl) {
  const { state, api } = useMission({ playing, speed, runId })
  const [draft, setDraft] = useState('')
  const t = tally(state)
  const pending = state.gates.filter((g) => g.picked == null)

  return (
    <div className="mc4">
      <header className="mc4-top">
        <div className="mc4-brand">
          <span className="mc4-live" />
          Mission Control
        </div>
        <div className="mc4-stats">
          <Stat n={t.running} label="在跑" tone="run" />
          <Stat n={t.waiting} label="等你" tone="wait" />
          <Stat n={t.done} label="已落地" tone="done" />
        </div>
        <div className="mc4-spend">
          <b>{state.spend.toFixed(2)}</b> ACU
        </div>
      </header>

      <div className="mc4-body">
        {state.agents.length === 0 ? (
          <div className="mc4-empty">
            <p className="mc4-e-h">还没有派出任何一个 agent</p>
            <p className="mc4-e-p">
              点右上角播放看一次五路并行的演示；也可以直接在下面这张卡里派一个 ——
              派出去之后它会自己长成左边那样的卡。
            </p>
            <form
              className="mc4-new is-empty"
              onSubmit={(e) => { e.preventDefault(); api.spawn(draft); setDraft('') }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="给它一件事，比如 修一下登录页的样式"
                aria-label="派一个新的 agent"
              />
              <button type="submit" disabled={!draft.trim()} title="派出去">
                <Plus size={13} strokeWidth={2.2} />
              </button>
            </form>
          </div>
        ) : (
          <div className="mc4-grid">
            {state.agents.map((a) => <Card key={a.id} a={a} api={api} />)}
            <form
              className="mc4-new"
              onSubmit={(e) => { e.preventDefault(); api.spawn(draft); setDraft('') }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="再派一个…"
                aria-label="再派一个新的 agent"
              />
              <button type="submit" disabled={!draft.trim()} title="派出去">
                <Plus size={13} strokeWidth={2.2} />
              </button>
            </form>
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <section className="mc4-gate">
          <header className="mc4-gate-h">
            待你拍板
            <span className="mc4-gate-n">{pending.length}</span>
          </header>
          {pending.map((g) => (
            <GateRow
              key={g.id}
              g={g}
              who={state.agents.find((a) => a.id === g.agent)?.name ?? g.agent}
              onPick={(i) => api.pick(g.id, i)}
              onKill={() => api.kill(g.agent)}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <span className="mc4-stat" data-tone={tone}>
      <b>{n}</b>
      {label}
    </span>
  )
}

const LABEL: Record<AgentState, string> = {
  running: '在跑',
  waiting: '等你',
  paused: '已停',
  queued: '排队',
  done: '已落地',
}

function Card({ a, api }: { a: Agent; api: ReturnType<typeof useMission>['api'] }) {
  return (
    <article className="mc4-card" data-s={a.state}>
      <span className="mc4-band" />
      <div className="mc4-h">
        <span className="mc4-name">{a.name}</span>
        <span className="mc4-badge">{LABEL[a.state]}</span>
      </div>
      <div className="mc4-branch">{a.branch}</div>
      <p className="mc4-note">{a.note}</p>

      <div className="mc4-bar"><i style={{ width: (a.p * 100).toFixed(1) + '%' }} /></div>

      <div className="mc4-f">
        <span className="mc4-m">{fmtMs(a.ms)}</span>
        <span className="mc4-m">{a.acu.toFixed(2)} ACU</span>
        {a.artifact ? <span className="mc4-art">{a.artifact}</span> : <span className="mc4-art is-dim">—</span>}
        <span className="mc4-ops">
          {a.state === 'running' && (
            <button onClick={() => api.pause(a.id)} title="暂停" aria-label="暂停这个 agent">
              <Pause size={12} strokeWidth={2.2} />
            </button>
          )}
          {a.state === 'paused' && (
            <button onClick={() => api.resume(a.id)} title="继续" aria-label="继续这个 agent">
              <Play size={12} strokeWidth={2.2} />
            </button>
          )}
          {a.state !== 'done' && (
            <button onClick={() => api.kill(a.id)} title="掐掉" aria-label="掐掉这个 agent">
              <X size={12} strokeWidth={2.2} />
            </button>
          )}
        </span>
      </div>
    </article>
  )
}

function GateRow({ g, who, onPick, onKill }: {
  g: Gate; who: string; onPick: (i: number) => void; onKill: () => void
}) {
  return (
    <div className="mc4-g">
      <div className="mc4-g-top">
        <span className="mc4-g-who">{who}</span>
        <p className="mc4-g-q">{g.q}</p>
      </div>
      <div className="mc4-g-opts">
        {g.opts.map((o, i) => (
          <button key={i} className="mc4-g-opt" onClick={() => onPick(i)}>
            {o}
          </button>
        ))}
        <button className="mc4-g-kill" onClick={onKill}>掐掉它</button>
      </div>
    </div>
  )
}
