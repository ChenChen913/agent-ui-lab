import { useCallback, useEffect, useRef, useState } from 'react'
import { FLEET, SCENARIO, fmtMs, type Agent, type Beat, type Mc4State } from './scenario'

/**
 * A4 · Mission Control 的引擎
 *
 * 和别的实验不一样的地方：这里的进度不是「一拍跳一格」，
 * 而是逐帧爬 —— 进度条、耗时、ACU 成本都在动，所以集群看着是活的。
 *
 * 循环什么时候停，是这一版特意写清楚的：
 *   · 剧本走完、且没有 agent 还在跑 → 停
 *   · 用户插手之后（live）→ 剧本那条循环停，改由 400ms 心跳接着跑
 * 少了任何一条，页面就会在没人看的时候一直空转。
 */

const fresh = (): Mc4State => ({ agents: [], gates: [], spend: 0, live: false, epoch: 0 })

export function useMission({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<Mc4State>(fresh)
  const r = useRef({ elapsed: 0, idx: 0, disc: fresh(), mode: 'demo' as 'demo' | 'live' })
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, disc: fresh(), mode: 'demo' }
    setState(fresh())
  }, [runId])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({
      agents: D.agents.map((a) => ({ ...a })),
      gates: D.gates.map((g) => ({ ...g })),
      spend: D.spend,
      live: r.current.mode === 'live',
      epoch: D.epoch,
    })
  }, [])

  /** 逐帧推进所有正在跑的 agent：进度、耗时、成本 */
  const advance = (dt: number) => {
    const D = r.current.disc
    let changed = false
    for (const a of D.agents) {
      if (a.state !== 'running') continue
      a.ms += dt
      a.p = Math.min(1, a.ms / a.dur)
      const c = (dt / 1000) * a.burn
      a.acu += c
      D.spend += c
      changed = true
      // live 模式下没人来收尾，跑满就自己落地
      if (a.p >= 1 && r.current.mode === 'live') {
        a.state = 'done'
        a.note = '做完了'
        a.artifact = a.artifact ?? a.name.split('/')[1] + ' 已改'
      }
    }
    return changed
  }

  // 剧本循环
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const R = r.current
      const dt = (now - last) * speed
      last = now

      let dirty = false
      if (R.mode === 'demo') {
        R.elapsed += dt
        if (advance(dt)) dirty = true
        while (R.idx < SCENARIO.length && SCENARIO[R.idx].t <= R.elapsed) {
          const b = SCENARIO[R.idx]
          R.idx++
          if (b.op === 'end') { R.idx = SCENARIO.length; dirty = true; break }
          applyBeat(R.disc, b)
          dirty = true
        }
      }
      if (dirty) commit()

      const busy = R.disc.agents.some((a) => a.state === 'running')
      if (R.mode === 'demo' && (R.idx < SCENARIO.length || busy)) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, commit])

  // 用户插手之后，集群还活着 —— 心跳接着跑
  useEffect(() => {
    if (!state.live) return
    const id = window.setInterval(() => {
      if (advance(400 * speedRef.current)) commit()
    }, 400)
    return () => window.clearInterval(id)
  }, [state.live, state.epoch, commit])

  const goLive = () => { r.current.mode = 'live' }

  const api = {
    pause: useCallback((id: string) => {
      const D = r.current.disc
      const a = D.agents.find((x) => x.id === id)
      if (a && a.state === 'running') { a.state = 'paused'; a.note = '你按了暂停' }
      goLive(); commit()
    }, [commit]),

    resume: useCallback((id: string) => {
      const D = r.current.disc
      const a = D.agents.find((x) => x.id === id)
      if (a && (a.state === 'paused' || a.state === 'queued')) { a.state = 'running'; a.note = '接着干' }
      goLive(); commit()
    }, [commit]),

    kill: useCallback((id: string) => {
      const D = r.current.disc
      const a = D.agents.find((x) => x.id === id)
      if (a) { a.state = 'paused'; a.note = '被你掐掉了' }
      D.gates = D.gates.filter((g) => g.agent !== id)
      goLive(); commit()
    }, [commit]),

    /** 拍板：选了哪个，卡就活过来 */
    pick: useCallback((gid: string, i: number) => {
      const D = r.current.disc
      const g = D.gates.find((x) => x.id === gid)
      if (!g || g.picked != null) return
      g.picked = i
      const a = D.agents.find((x) => x.id === g.agent)
      if (a) {
        a.state = 'running'
        a.gate = undefined
        a.note = i === 0 ? '按你选的：等 refactor 落地' : '按你选的：我先落地'
      }
      goLive(); commit()
    }, [commit]),

    /** 现场派一个：从底下那张虚线卡里 */
    spawn: useCallback((raw: string) => {
      const name = raw.trim()
      if (!name) return
      const D = r.current.disc
      const id = 'u' + D.epoch
      const seed = FLEET[D.agents.length % FLEET.length]
      D.agents = [...D.agents, {
        ...seed,
        id,
        name: name.includes('/') ? name : 'custom/' + name,
        branch: 'a4/' + name.replace(/[^\w-]+/g, '-'),
        state: 'running',
        note: '刚派出去',
        p: 0, ms: 0, acu: 0,
        artifact: undefined,
        gate: undefined,
      }]
      D.epoch++
      goLive(); commit()
    }, [commit]),

    /** 一键把整个集群重新派一遍 */
    reset: useCallback(() => {
      r.current = { elapsed: 0, idx: 0, disc: fresh(), mode: 'live' }
      for (const a of FLEET) {
        r.current.disc.agents.push({ ...a, state: 'running', note: '重新派活', p: 0, ms: 0, acu: 0 })
      }
      commit()
    }, [commit]),
  }

  return { state, api, fmtMs }
}

function applyBeat(D: Mc4State, b: Beat) {
  switch (b.op) {
    case 'spawn':
      D.agents = [...D.agents, { ...b.a }]
      return
    case 'note': {
      const a = D.agents.find((x) => x.id === b.id)
      if (a) a.note = b.text
      return
    }
    case 'start': {
      const a = D.agents.find((x) => x.id === b.id)
      if (a) a.state = 'running'
      return
    }
    case 'gate': {
      const a = D.agents.find((x) => x.id === b.id)
      if (a) { a.state = 'waiting'; a.gate = b.id }
      D.gates = [...D.gates, { id: b.id, agent: b.id, q: b.q, opts: b.opts }]
      return
    }
    case 'pick': {
      const g = D.gates.find((x) => x.id === b.id)
      if (g && g.picked == null) {
        g.picked = b.i
        const a = D.agents.find((x) => x.id === g.agent)
        if (a) { a.state = 'running'; a.gate = undefined }
      }
      return
    }
    case 'done': {
      const a = D.agents.find((x) => x.id === b.id)
      if (a) { a.state = 'done'; a.p = 1; a.artifact = b.artifact; a.note = '已落地' }
      D.gates = D.gates.filter((g) => g.agent !== b.id)
      return
    }
  }
}

export type { Agent }
