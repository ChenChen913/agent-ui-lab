import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO, TOTAL, type Beat, type Presence, type WinState, type WinKind } from './scenario'

export interface Win {
  id: string
  title: string
  kind: WinKind
  x: number
  y: number
  items: number
  progress: number
  state: WinState
  minimized: boolean
  z: number
}

export interface Notify { id: string; title: string; body: string; tone: 'ok' | 'warn' }

export interface DesktopState {
  presence: Presence
  palette: boolean
  typed: string
  ask: string
  wins: Win[]
  notify: Notify | null
}

interface Fill { from: number; to: number; t0: number; dur: number }

const freshState = (): DesktopState => ({
  presence: 'idle', palette: false, typed: '', ask: '', wins: [], notify: null,
})

export function useDesktop({ playing, speed, runId, askOverride }: {
  playing: boolean; speed: number; runId: number; askOverride?: string
}) {
  const [state, setState] = useState<DesktopState>(freshState)
  const clockRef = useRef<HTMLSpanElement>(null)
  const r = useRef({
    elapsed: 0, idx: 0, z: 10,
    typing: null as { text: string; dur: number; t0: number } | null,
    typedLen: 0,
    fills: new Map<string, Fill>(),
    disc: freshState(),
  })

  /** 把 disc 的变化提交给 React（wins 逐项克隆，保证引用变化） */
  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ ...D, wins: D.wins.map((x) => ({ ...x })) })
  }, [])

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, z: 10, typing: null, typedLen: 0, fills: new Map(), disc: freshState() }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  // 桌面上的时间是真的时间
  useEffect(() => {
    const tick = () => {
      if (!clockRef.current) return
      const d = new Date()
      clockRef.current.textContent =
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
    }
    tick()
    const id = window.setInterval(tick, 10000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const S = r.current
      const D = S.disc
      const dt = (now - last) * speed
      last = now
      S.elapsed += dt
      let dirty = false

      while (S.idx < SCENARIO.length && SCENARIO[S.idx].t <= S.elapsed) {
        dirty = applyBeat(S, SCENARIO[S.idx], askOverride ?? '') || dirty
        S.idx++
      }

      // 窗口进度：只有「整项」变化才重渲染 —— 表格逐行、清单逐条
      for (const [id, f] of Array.from(S.fills.entries())) {
        const p = Math.min(1, Math.max(0, (S.elapsed - f.t0) / f.dur))
        const val = f.from + (f.to - f.from) * p
        const win = D.wins.find((x) => x.id === id)
        if (win) {
          const before = Math.round(win.progress * win.items)
          const after = Math.round(val * win.items)
          win.progress = val
          if (before !== after) dirty = true
        }
        if (p >= 1) S.fills.delete(id)
      }

      // 打字机
      if (S.typing) {
        const p = Math.min(1, (S.elapsed - S.typing.t0) / S.typing.dur)
        const n = Math.round(p * S.typing.text.length)
        if (n !== S.typedLen) { S.typedLen = n; D.typed = S.typing.text.slice(0, n); dirty = true }
        if (p >= 1) S.typing = null
      }

      if (dirty) setState({ ...D, wins: D.wins.map((x) => ({ ...x })) })
      if (S.idx < SCENARIO.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, askOverride])

  // ── 用户能做的事 ─────────────────────────────────────────
  const api = {
    front: useCallback((id: string) => {
      const D = r.current.disc
      const win = D.wins.find((x) => x.id === id)
      if (!win) return
      win.z = ++r.current.z
      commit()
    }, [commit]),

    move: useCallback((id: string, x: number, y: number) => {
      const win = r.current.disc.wins.find((x2) => x2.id === id)
      if (!win) return
      win.x = x; win.y = y
      commit()
    }, [commit]),

    minimize: useCallback((id: string) => {
      const win = r.current.disc.wins.find((x) => x.id === id)
      if (!win) return
      win.minimized = true
      commit()
    }, [commit]),

    toggleMin: useCallback((id: string) => {
      const D = r.current.disc
      const win = D.wins.find((x) => x.id === id)
      if (!win) return
      win.minimized = !win.minimized
      if (!win.minimized) win.z = ++r.current.z
      commit()
    }, [commit]),

    close: useCallback((id: string) => {
      const D = r.current.disc
      D.wins = D.wins.filter((x) => x.id !== id)
      commit()
    }, [commit]),

    center: useCallback((id: string) => {
      const D = r.current.disc
      const win = D.wins.find((x) => x.id === id)
      if (!win) return
      win.x = 50 - 17; win.y = 38
      win.minimized = false
      win.z = ++r.current.z
      commit()
    }, [commit]),

    summon: useCallback(() => {
      const D = r.current.disc
      D.palette = true
      D.typed = ''
      commit()
    }, [commit]),

    closePalette: useCallback(() => {
      r.current.disc.palette = false
      r.current.typing = null
      commit()
    }, [commit]),

    setTyped: useCallback((v: string) => {
      r.current.disc.typed = v
      commit()
    }, [commit]),

    submit: useCallback((text: string) => {
      const D = r.current.disc
      D.palette = false
      D.ask = text
      D.typed = ''
      D.wins = []
      r.current.typing = null
      r.current.fills.clear()
      r.current.elapsed = 0
      r.current.idx = 0
      r.current.z = 10
      commit()
    }, [commit]),

    dismissNotify: useCallback(() => {
      r.current.disc.notify = null
      commit()
    }, [commit]),
  }

  return { state, clockRef, api, total: TOTAL }
}

function applyBeat(
  S: { elapsed: number; z: number; typing: any; typedLen: number; fills: Map<string, Fill>; disc: DesktopState },
  b: Beat,
  askOverride: string,
): boolean {
  const D = S.disc
  const E = S.elapsed

  switch (b.op) {
    case 'presence':
      D.presence = b.state
      return true

    case 'summon':
      D.palette = true
      D.typed = ''
      D.ask = ''
      return true

    case 'type':
      S.typing = { text: askOverride || b.text, dur: b.dur, t0: E }
      S.typedLen = 0
      D.typed = ''
      return true

    case 'submit':
      S.typing = null
      D.palette = false
      D.ask = askOverride || D.typed || D.ask
      D.typed = ''
      return true

    case 'open': {
      const win: Win = {
        id: b.id, title: b.title, kind: b.kind, x: b.x, y: b.y, items: b.items,
        progress: 0, state: 'running', minimized: false, z: ++S.z,
      }
      D.wins = [...D.wins, win]
      return true
    }

    case 'fill':
      S.fills.set(b.id, { from: b.from ?? 0, to: b.to, t0: E, dur: b.dur })
      return false

    case 'win': {
      const win = D.wins.find((x) => x.id === b.id)
      if (win) {
        win.state = b.state
        win.z = ++S.z
        if (b.state === 'running') win.minimized = false
      }
      return true
    }

    case 'minimize': {
      const win = D.wins.find((x) => x.id === b.id)
      if (win) win.minimized = true
      return true
    }

    case 'close':
      D.wins = D.wins.filter((x) => x.id !== b.id)
      return true

    case 'notify':
      D.notify = { id: b.id, title: b.title, body: b.body, tone: b.tone }
      return true

    case 'dismiss':
      D.notify = null
      return true

    case 'end':
      return false
  }
}
