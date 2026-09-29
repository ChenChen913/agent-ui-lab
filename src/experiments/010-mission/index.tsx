import { useEffect, useRef, useState } from 'react'
import { ChevronDown, GitMerge, GitPullRequest, Pause, Play, Radio, TriangleAlert } from 'lucide-react'
import { TITLE, type Agent, type InboxItem } from './scenario'
import { useMission } from './useMission'
import type { Ctl } from '../../lab/ctl'
import './style.css'

/**
 * 010 · Mission Control —— 多 Agent 控制塔
 *
 * 五个 agent 并行干活。界面主角不是对话流，是状态本身：
 * 每行一个 agent，telemetry 一直滚，成本一直跳；
 * 被卡住的亮琥珀色确认门，干完的自己落进 Inbox。
 * 深色 + 等宽小字 + 发丝分割线 —— 控制塔的美学，不是聊天软件的。
 */
export default function Mission({ playing, speed, runId }: Ctl) {
  const { state, api } = useMission({ playing, speed, runId })
  const [now, setNow] = useState(() => new Date())
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const running = state.agents.filter((a) => a.state === 'running').length
  const blocked = state.agents.filter((a) => a.state === 'blocked').length
  const done = state.agents.filter((a) => a.state === 'done').length
  const inboxRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const e = inboxRef.current; if (e) e.scrollTop = 0 }, [state.inbox.length])

  return (
    <div className="mc">
      {/* ── 顶栏：集群概况 ─────────────────────────────── */}
      <header className="mc-top">
        <div className="mc-top-l">
          <span className="mc-live"><Radio size={12} strokeWidth={2} /></span>
          <b>Mission Control</b>
          <span className="mc-top-sub">{TITLE}</span>
        </div>
        <div className="mc-top-r">
          <span className="mc-stat"><i data-c="run" />{running} running</span>
          {blocked > 0 && <span className="mc-stat"><i data-c="blk" />{blocked} blocked</span>}
          <span className="mc-stat"><i data-c="done" />{done} done</span>
          <span className="mc-clock">
            {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}:{String(now.getSeconds()).padStart(2, '0')}
          </span>
        </div>
      </header>

      <div className="mc-body">
        {/* ── 主列：agent 状态矩阵 ──────────────────────── */}
        <main className="mc-rows">
          <div className="mc-head">
            <span>agent</span><span>activity</span><span>progress</span><span>pct</span><span>elapsed</span><span>cost</span><span />
          </div>
          {state.agents.map((a) => <AgentRow key={a.id} a={a} api={api} />)}

          <form
            className="mc-spawn"
            onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { api.spawn(draft); setDraft('') } }}
          >
            <span className="mc-spawn-plus">+</span>
            <input
              className="mc-spawn-in"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="再派一个 agent 去干活…"
              aria-label="新 agent 的任务"
            />
            <button className="mc-spawn-go" disabled={!draft.trim()}>派出</button>
          </form>
        </main>

        {/* ── 右列：Inbox ──────────────────────────────── */}
        <aside className="mc-inbox">
          <header className="mc-inbox-h">
            Inbox
            {state.inbox.length > 0 && <em>{state.inbox.length}</em>}
          </header>
          <div className="mc-inbox-b" ref={inboxRef}>
            {state.inbox.length === 0 && <div className="mc-inbox-empty">回执会落在这里。<br />agent 干完一件事，你不用盯着看。</div>}
            {[...state.inbox].reverse().map((it) => <InboxRow key={it.id} it={it} onOpen={() => api.focusItem(it.id)} />)}
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ── 单行 agent ─────────────────────────────────────────── */
function AgentRow({ a, api }: { a: Agent; api: ReturnType<typeof useMission>['api'] }) {
  const mm = Math.floor(a.runMs / 60000)
  const ss = Math.floor((a.runMs % 60000) / 1000)
  const elapsed = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0')

  return (
    <div className={'mc-row' + (a.expanded ? ' is-open' : '')} data-s={a.state}>
      <button className="mc-row-main" onClick={() => api.expand(a.id)} aria-expanded={a.expanded ? 'true' : 'false'}>
        <span className="mc-dot" title={a.state} />
        <span className="mc-name">
          <b>{a.task}</b>
          <code>{a.name}</code>
        </span>
        <span className="mc-ticker">{a.ticker}</span>
        <span className="mc-prog">
          <i style={{ width: a.pct.toFixed(1) + '%' }} />
        </span>
        <span className="mc-pct">{Math.round(a.pct)}%</span>
        <span className="mc-num">{elapsed}</span>
        <span className="mc-num mc-cost">{a.cost.toFixed(2)} <em>ACU</em></span>
        <span className="mc-chev"><ChevronDown size={14} strokeWidth={2} /></span>
      </button>

      <div className="mc-detail">
        <div className="mc-detail-in">
          {a.state === 'blocked' && a.blockQ && (
            <div className="mc-gate">
              <div className="mc-gate-q">
                <TriangleAlert size={14} strokeWidth={2} />
                {a.blockQ.q}
              </div>
              <div className="mc-gate-opts">
                {a.blockQ.opts.map((o, i) => (
                  <button key={i} className="mc-gate-opt" onClick={() => api.choose(a.id, i === 0 ? 0 : 1)}>
                    <b>{'AB'[i]}</b>{o}
                  </button>
                ))}
              </div>
            </div>
          )}
          {a.state === 'done' && (
            <div className="mc-donebar">
              <GitMerge size={13} strokeWidth={1.8} />
              worktree 已合并，分支保留待审。总耗时 {elapsed} · 成本 {a.cost.toFixed(2)} ACU。
            </div>
          )}
          {a.state !== 'blocked' && a.state !== 'done' && (
            <div className="mc-tele">
              <span><em>worktree</em>../wt/{a.name}</span>
              <span><em>model</em>atlas-2-coder</span>
              <span><em>rate</em>{a.rate.toFixed(1)}%/s · {a.burn.toFixed(3)} ACU/s</span>
              <span><em>last</em>{a.ticker}</span>
            </div>
          )}
        </div>
      </div>

      {a.state !== 'blocked' && a.state !== 'done' && (
        <button className="mc-act" onClick={(e) => { e.stopPropagation(); api.toggle(a.id) }} title={a.state === 'paused' ? '继续' : '暂停'}>
          {a.state === 'paused' ? <Play size={12} strokeWidth={2} /> : <Pause size={12} strokeWidth={2} />}
        </button>
      )}
    </div>
  )
}

/* ── Inbox 条目 ─────────────────────────────────────────── */
function InboxRow({ it, onOpen }: { it: InboxItem; onOpen: () => void }) {
  const mm = Math.floor(it.at / 60000)
  const ss = Math.floor((it.at % 60000) / 1000)
  return (
    <button className="mc-inb" data-k={it.kind} onClick={onOpen}>
      <span className="mc-inb-ic">
        {it.kind === 'pr' && <GitPullRequest size={13} strokeWidth={1.9} />}
        {it.kind === 'warn' && <TriangleAlert size={13} strokeWidth={1.9} />}
        {it.kind === 'ok' && <b>✓</b>}
        {it.kind === 'note' && <b>·</b>}
      </span>
      <span className="mc-inb-tx">{it.text}</span>
      <span className="mc-inb-at">
        {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </span>
    </button>
  )
}
