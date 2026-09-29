import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO, TOTAL, CELLS, DEFAULT_CMD, type Beat, type Tone } from './scenario'

export const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export type Entry =
  | { key: number; kind: 'blank' }
  | { key: number; kind: 'cmd'; text: string }
  | { key: number; kind: 'task'; text: string; ms: number | null }
  | { key: number; kind: 'note'; text: string; tone: Tone; indent: number }
  | { key: number; kind: 'bar'; label: string; filled: number; cells: number; pct: number; done: boolean }
  | { key: number; kind: 'result'; title: string; head: string; lines: string[] }

export interface Status {
  text: string
  tone: Tone
  spin: boolean
  pct: number | null
  step: number
}

export interface TermState {
  entries: Entry[]
  status: Status
  typing: string
  running: boolean
  revealed: boolean
}

interface BarAnim { key: number; t0: number; dur: number; cells: number; filled: number }

interface Live {
  elapsed: number
  idx: number
  key: number
  entries: Entry[]
  bars: Map<string, BarAnim>
  activeBar: string | null
  taskKey: number | null
  taskStart: number
  typing: { text: string; dur: number; t0: number } | null
  typedLen: number
  pendingCmd: string
  spinAt: number
  spinIdx: number
}

function freshLive(): Live {
  return {
    elapsed: 0, idx: 0, key: 0, entries: [], bars: new Map(),
    activeBar: null, taskKey: null, taskStart: 0, typing: null,
    typedLen: 0, pendingCmd: DEFAULT_CMD, spinAt: -1e9, spinIdx: 0,
  }
}

function freshDisc(): TermState {
  return {
    entries: [],
    status: { text: '就绪', tone: 'dim', spin: false, pct: null, step: 0 },
    typing: '', running: false, revealed: false,
  }
}

export function useTerminal(opts: { playing: boolean; speed: number; runId: number; cmdOverride?: string }) {
  const { playing, speed, runId, cmdOverride } = opts
  const [state, setState] = useState<TermState>(freshDisc)
  const scrollRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const spinRef = useRef<HTMLSpanElement>(null)
  const stick = useRef(true)
  const r = useRef({ live: freshLive(), disc: freshDisc() })

  useEffect(() => {
    r.current = { live: freshLive(), disc: freshDisc() }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  // ── 中断：像真终端一样打印 ^C ────────────────────────────
  const interrupt = useCallback(() => {
    const { live: L, disc: D } = r.current
    if (!D.running) return
    closeTask(L, D)
    L.entries.push({ key: ++L.key, kind: 'note', text: '^C', tone: 'err', indent: 0 })
    L.entries.push({ key: ++L.key, kind: 'blank' })
    D.running = false
    D.status = { ...D.status, text: '已中断', tone: 'err', spin: false, pct: null }
    setState({ ...D, entries: [...D.entries] })
  }, [])

  const clearLog = useCallback(() => {
    const { live: L, disc: D } = r.current
    L.entries = []
    setState({ ...D, entries: [] })
  }, [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const { live: L, disc: D } = r.current
      const dt = (now - last) * speed
      last = now
      L.elapsed += dt
      let changed = false

      // 1. 节拍
      while (L.idx < SCENARIO.length && SCENARIO[L.idx].t <= L.elapsed) {
        changed = applyBeat(L, D, SCENARIO[L.idx], cmdOverride) || changed
        L.idx++
      }

      // 2. 进度条：只在「整格」变化时才更新 —— 这就是终端进度条的跳动感
      for (const [id, b] of L.bars) {
        const p = Math.min(1, (L.elapsed - b.t0) / b.dur)
        const filled = Math.round(p * b.cells)
        if (filled !== b.filled) {
          b.filled = filled
          const e = L.entries.find((x) => x.key === b.key)
          if (e && e.kind === 'bar') {
            e.filled = filled
            e.pct = Math.round(p * 100)
            e.done = p >= 1
          }
          if (L.activeBar === id) D.status = { ...D.status, pct: Math.round(p * 100) }
          changed = true
        }
      }

      // 3. 打字机
      if (L.typing) {
        const p = Math.min(1, (L.elapsed - L.typing.t0) / L.typing.dur)
        const n = Math.round(p * L.typing.text.length)
        if (n !== L.typedLen) { L.typedLen = n; D.typing = L.typing.text.slice(0, n); changed = true }
        if (p >= 1) L.typing = null
      }

      // 4. 转圈：直接写 DOM，不进 React
      if (D.status.spin && L.elapsed - L.spinAt > 80) {
        L.spinAt = L.elapsed
        L.spinIdx = (L.spinIdx + 1) % SPIN.length
        if (spinRef.current) spinRef.current.textContent = SPIN[L.spinIdx]
      }
      if (spinRef.current && !D.status.spin) spinRef.current.textContent = '·'
      if (clockRef.current) clockRef.current.textContent = (L.elapsed / 1000).toFixed(2) + 's'

      if (changed) setState({ ...D, entries: [...D.entries] })
      if (L.idx < SCENARIO.length) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, cmdOverride])

  return { state, scrollRef, clockRef, spinRef, stick, interrupt, clearLog, total: TOTAL }
}

function closeTask(L: Live, D: TermState) {
  if (L.taskKey == null) return
  const e = L.entries.find((x) => x.key === L.taskKey)
  if (e && e.kind === 'task') e.ms = L.elapsed - L.taskStart
  L.taskKey = null
}

function applyBeat(L: Live, D: TermState, b: Beat, cmdOverride?: string): boolean {
  switch (b.op) {
    case 'cmd':
      L.typing = { text: cmdOverride || b.text, dur: b.dur, t0: L.elapsed }
      L.typedLen = 0
      L.entries = []
      L.bars.clear()
      L.activeBar = null
      L.taskKey = null
      L.key = 0
      D.entries = []
      D.typing = ''
      D.running = false
      D.revealed = false
      D.status = { text: '就绪', tone: 'dim', spin: false, pct: null, step: 0 }
      L.pendingCmd = cmdOverride || b.text
      return true

    case 'send':
      L.typing = null
      D.typing = ''
      L.entries.push({ key: ++L.key, kind: 'cmd', text: L.pendingCmd })
      L.entries.push({ key: ++L.key, kind: 'blank' })
      D.running = true
      D.status = { ...D.status, spin: true, tone: 'accent' }
      return true

    case 'task':
      closeTask(L, D)
      L.taskStart = L.elapsed
      L.taskKey = ++L.key
      L.entries.push({ key: L.taskKey, kind: 'task', text: b.text, ms: null })
      D.status = { ...D.status, step: D.status.step + 1, pct: null }
      return true

    case 'note':
      L.entries.push({ key: ++L.key, kind: 'note', text: b.text, tone: b.tone ?? 'fg', indent: b.indent ?? 1 })
      return true

    case 'blank':
      L.entries.push({ key: ++L.key, kind: 'blank' })
      return true

    case 'bar': {
      const cells = b.cells ?? CELLS
      const key = ++L.key
      L.entries.push({ key, kind: 'bar', label: b.label, filled: 0, cells, pct: 0, done: false })
      L.bars.set(b.id, { key, t0: L.elapsed, dur: b.dur, cells, filled: 0 })
      L.activeBar = b.id
      D.status = { ...D.status, pct: 0 }
      return true
    }

    case 'status':
      D.status = { ...D.status, text: b.text, tone: b.tone ?? 'accent', spin: b.spin ?? true }
      return true

    case 'result':
      closeTask(L, D)
      L.entries.push({ key: ++L.key, kind: 'blank' })
      L.entries.push({ key: ++L.key, kind: 'result', title: b.title, head: b.head, lines: b.lines })
      D.running = false
      D.revealed = true
      D.status = { text: '就绪', tone: 'dim', spin: false, pct: null, step: D.status.step }
      return true

    case 'end':
      return false
  }
}
