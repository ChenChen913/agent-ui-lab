import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, type BeatRunner } from '../../shared/beat'
import { fresh, SCENARIO, type Agent, type Beat, type InboxKind, type McState } from './scenario'

export type { McState }

/**
 * 010 · Mission Control —— 引擎
 *
 * 和 008-015 其余实验共用同一套节拍引擎，但多了一层「活体」：
 * 就算剧本一拍都不发，正在运行的 agent 也在跑 —— 进度往前爬、ACU 成本往上涨、
 * 计时器一直在走。这一层在 demo 模式挂在引擎的逐帧钩子上，
 * 在 live 模式（用户插过手）挂在 400ms 的心跳上。
 */
let uid = 0
const nid = (p: string) => p + ++uid

export function useMission({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<McState>(fresh)
  const r = useRef<BeatRunner<McState>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const speedRef = useRef(speed)
  speedRef.current = speed
  const lastFrame = useRef<number>(performance.now())
  const heart = useRef<number | null>(null)

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ agents: D.agents.map((a) => ({ ...a })), inbox: [...D.inbox], live: r.current.mode === 'live' })
  }, [])

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    lastFrame.current = performance.now()
    setState({ agents: r.current.disc.agents.map((a) => ({ ...a })), inbox: [], live: false })
  }, [runId])

  /** 推进所有 running agent。返回 true 表示有显示值变了，需要 commit */
  const advance = (dt: number): boolean => {
    const D = r.current.disc
    let changed = false
    for (const a of D.agents) {
      if (a.state !== 'running') continue
      a.runMs += dt
      a.cost += (a.burn * dt) / 1000
      const np = Math.min(100, a.pct + (a.rate * dt) / 1000)
      if (Math.round(np) !== Math.round(a.pct)) changed = true
      a.pct = np
      if (Math.floor(a.runMs / 1000) !== Math.floor((a.runMs - dt) / 1000)) changed = true
      if (Math.floor(a.cost * 100) !== Math.floor((a.cost - (a.burn * dt) / 1000) * 100)) changed = true
    }
    return changed
  }

  // live 模式心跳：剧本让位之后，集群还活着
  useEffect(() => {
    if (!state.live) return
    heart.current = window.setInterval(() => {
      if (advance(400 * speedRef.current)) commit()
    }, 400)
    return () => { if (heart.current != null) window.clearInterval(heart.current) }
  }, [state.live, commit])

  useBeatLoop({
    playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, commit,
    // 引擎的逐帧钩子在这里被复用为「集群呼吸」：每帧推进，显示值变了才 commit
    typing: () => {
      const now = performance.now()
      const dt = Math.min(100, now - lastFrame.current) * speedRef.current
      lastFrame.current = now
      return advance(dt)
    },
  })

  const api = {
    /** 暂停 / 恢复一个 agent */
    toggle: useCallback((id: string) => {
      const D = r.current.disc
      const a = D.agents.find((x) => x.id === id)
      if (!a || (a.state !== 'running' && a.state !== 'paused')) return
      a.state = a.state === 'running' ? 'paused' : 'running'
      a.ticker = a.state === 'paused' ? 'paused by operator' : 'resumed by operator'
      r.current.mode = 'live'
      commit()
    }, [commit]),

    /** 拍板：琥珀色确认门里选一个 */
    choose: useCallback((id: string, opt: 0 | 1) => {
      const D = r.current.disc
      const a = D.agents.find((x) => x.id === id)
      if (!a || a.state !== 'blocked' || !a.blockQ) return
      a.chosen = opt
      a.state = 'running'
      a.ticker = 'decision: ' + (opt === 0 ? 'A' : 'B') + ' — ' + a.blockQ.opts[opt]
      a.expanded = false
      r.current.mode = 'live'
      commit()
    }, [commit]),

    /** 展开一行看 telemetry / 确认门 */
    expand: useCallback((id: string) => {
      const D = r.current.disc
      const a = D.agents.find((x) => x.id === id)
      if (!a) return
      a.expanded = !a.expanded
      commit()
    }, [commit]),

    /** 点 Inbox 条目：跳到对应 agent 并展开 */
    focusItem: useCallback((itemId: string) => {
      const D = r.current.disc
      const it = D.inbox.find((x) => x.id === itemId)
      if (!it) return
      const a = D.agents.find((x) => x.id === it.agent)
      if (a) a.expanded = true
      commit()
    }, [commit]),

    /** 现场派一个新 agent */
    spawn: useCallback((task: string) => {
      const t = task.trim(); if (!t) return
      const D = r.current.disc
      const id = 'u' + nid('')
      D.agents = [...D.agents, {
        id, name: 'task-' + String(D.agents.length + 1).padStart(2, '0'), task: t,
        state: 'running', runMs: 0, pct: 0, rate: 3.5 + Math.random() * 2.5,
        cost: 0, burn: 0.013, ticker: 'spawning worktree…',
      }]
      r.current.mode = 'live'
      commit()
    }, [commit]),

  }

  return { state, api }
}

function applyBeat(S: BeatRunner<McState>, b: Beat): boolean {
  const D = S.disc
  const ag = (id: string) => D.agents.find((x) => x.id === id)
  switch (b.op) {
    case 'ticker': { const a = ag(b.id); if (a) a.ticker = b.text; return false }
    case 'state': { const a = ag(b.id); if (a) a.state = b.state; return false }
    case 'block': { const a = ag(b.id); if (a) { a.state = 'blocked'; a.blockQ = { q: b.q, opts: b.opts } } return false }
    case 'choose': {
      const a = ag(b.id)
      if (a && a.blockQ) { a.chosen = b.opt; a.state = 'running'; a.expanded = false; a.ticker = 'decision: ' + (b.opt === 0 ? 'A' : 'B') + ' — ' + a.blockQ.opts[b.opt] }
      return false
    }
    case 'expand': { const a = ag(b.id); if (a) a.expanded = !a.expanded; return false }
    case 'done': {
      const a = ag(b.id)
      if (a) { a.state = 'done'; a.pct = 100; a.ticker = 'worktree merged · branch kept for review' }
      return false
    }
    case 'inbox': {
      D.inbox = [...D.inbox, { id: nid('i'), kind: b.kind, agent: b.agent, text: b.text, at: S.elapsed }]
      return false
    }
    case 'end': return true
  }
}

export type { InboxKind }
