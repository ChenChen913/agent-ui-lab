import { useCallback, useEffect, useRef, useState } from 'react'
import {
  SCENARIO, TOTAL, SEG_ENDS, FRAY_AT, DEFAULT_ASK,
  type Beat, type Phase,
} from './scenario'

export interface Mark { at: number; tag: string }

export interface StrokeState {
  phase: Phase
  tag: string
  step: number
  ask: string
  typed: string
  revealed: boolean
  marks: Mark[]
}

interface Anim { from: number; to: number; dur: number; t0: number }

interface Live {
  elapsed: number
  idx: number
  drawn: number
  inkw: number
  open: number
  knot: number
  fray: number
  strands: number[]
  snap: number[]
  freeze: boolean
  slack: number
  holdUntil: number
  typedLen: number
  typing: { text: string; dur: number; t0: number } | null
  pluckAt: number
  drawnAnim: Anim | null
  inkwAnim: Anim | null
  openAnim: Anim | null
  strandAnims: (Anim | null)[]
  slackAnim: Anim | null
}

function freshLive(): Live {
  return {
    elapsed: 0, idx: 0, drawn: 0, inkw: 1.5, open: 0, knot: 0, fray: 0,
    strands: [FRAY_AT, FRAY_AT, FRAY_AT], snap: [0, 0, 0], freeze: false,
    slack: 0, holdUntil: -1, typedLen: 0, typing: null, pluckAt: -1e9,
    drawnAnim: null, inkwAnim: null, openAnim: null,
    strandAnims: [null, null, null], slackAnim: null,
  }
}

function freshDisc(ask: string): StrokeState {
  return { phase: 'idle', tag: '', step: 0, ask, typed: '', revealed: false, marks: [] }
}

const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2

function stepAnim(a: Anim | null, now: number): number | null {
  if (!a) return null
  const p = a.dur <= 0 ? 1 : Math.min(1, Math.max(0, (now - a.t0) / a.dur))
  return a.from + (a.to - a.from) * easeInOutSine(p)
}

/** 一个中文字按 1em 算，其他按 0.56em —— 用来量「你打的字有多宽」 */
export function measureEm(s: string): number {
  let n = 0
  for (const ch of s) n += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : 0.56
  return n
}

export function useStroke(opts: {
  playing: boolean
  speed: number
  runId: number
  askOverride?: string
}) {
  const { playing, speed, runId, askOverride } = opts
  const [state, setState] = useState<StrokeState>(() => freshDisc(askOverride ?? ''))
  const rootRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const r = useRef({ live: freshLive(), disc: freshDisc(askOverride ?? '') })

  // ── 重开 ──────────────────────────────────────────────────
  useEffect(() => {
    r.current = { live: freshLive(), disc: freshDisc(askOverride ?? '') }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  // ── 中断：线松掉，900ms 后重新绷紧 ────────────────────────
  const interrupt = useCallback(() => {
    const L = r.current.live
    if (L.slack > 0.5) return
    L.slackAnim = { from: 0, to: 1, dur: 220, t0: L.elapsed }
    L.holdUntil = L.elapsed + 900
    window.setTimeout(() => {
      const L2 = r.current.live
      L2.slackAnim = { from: L2.slack, to: 0, dur: 420, t0: L2.elapsed }
    }, 900)
  }, [])

  // ── 主循环 ────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const { live: L, disc: D } = r.current
      const dt = (now - last) * speed
      last = now
      L.elapsed += dt

      let dirty = false

      // 1. 应用节拍
      while (L.idx < SCENARIO.length && SCENARIO[L.idx].t <= L.elapsed) {
        dirty = applyBeat(r.current, SCENARIO[L.idx], askOverride ?? '') || dirty
        L.idx++
      }

      // 2. 打字机
      if (L.typing) {
        const p = Math.min(1, (L.elapsed - L.typing.t0) / L.typing.dur)
        const n = Math.round(p * L.typing.text.length)
        if (n !== L.typedLen) { L.typedLen = n; D.typed = L.typing.text.slice(0, n); dirty = true }
        if (p >= 1) L.typing = null
      }

      // 3. 中断期间：把所有动画的时间基准一起往前推 = 冻结
      const holding = L.elapsed < L.holdUntil
      if (holding) {
        for (const a of [L.drawnAnim, L.inkwAnim, L.openAnim, L.slackAnim, ...L.strandAnims]) {
          if (a) a.t0 += dt
        }
        if (L.typing) L.typing.t0 += dt
      } else {
        L.drawn = stepAnim(L.drawnAnim, L.elapsed) ?? L.drawn
        L.inkw = stepAnim(L.inkwAnim, L.elapsed) ?? L.inkw
        L.open = stepAnim(L.openAnim, L.elapsed) ?? L.open
        L.slack = stepAnim(L.slackAnim, L.elapsed) ?? L.slack
        for (let i = 0; i < 3; i++) L.strands[i] = stepAnim(L.strandAnims[i], L.elapsed) ?? L.strands[i]
      }

      // 4. 被拨动之后的衰减震荡
      const pdt = L.elapsed - L.pluckAt
      const shake = pdt >= 0 && pdt < 700
        ? Math.sin((pdt / 1000) * Math.PI * 2 * 6.5) * 4.2 * Math.exp(-pdt / 150)
        : 0

      // 5. 写 CSS 变量 —— 不经过 React
      const el = rootRef.current
      if (el) {
        const s = el.style
        s.setProperty('--drawn', L.drawn.toFixed(4))
        s.setProperty('--inkw', L.inkw.toFixed(2))
        s.setProperty('--open', L.open.toFixed(4))
        s.setProperty('--knot', L.knot.toFixed(3))
        s.setProperty('--fray', L.fray.toFixed(3))
        s.setProperty('--shake', shake.toFixed(2) + 'px')
        s.setProperty('--slack', L.slack.toFixed(3))
        s.setProperty('--s0', L.strands[0].toFixed(4))
        s.setProperty('--s1', L.strands[1].toFixed(4))
        s.setProperty('--s2', L.strands[2].toFixed(4))
        s.setProperty('--snap1', L.snap[1].toFixed(3))
        for (let i = 0; i < SEG_ENDS.length; i++) {
          s.setProperty('--g' + i, L.drawn > SEG_ENDS[i] + 0.004 ? '1' : '0')
        }
        const side = L.drawn > 0.68 ? 'left' : 'right'
        if (!el.dataset.hover) el.dataset.side = side
        el.dataset.freeze = L.freeze ? '1' : '0'
      }
      if (clockRef.current) clockRef.current.textContent = (L.elapsed / 1000).toFixed(1) + 's'

      if (dirty) setState({ ...D, marks: [...D.marks] })

      if (L.idx < SCENARIO.length) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, askOverride])

  return { state, rootRef, clockRef, interrupt, total: TOTAL }
}

function applyBeat(rt: { live: Live; disc: StrokeState }, b: Beat, askText: string): boolean {
  const L = rt.live
  const D = rt.disc
  const E = L.elapsed

  switch (b.op) {
    case 'ask':
      // 用户自己输入过，就打他自己的问题
      L.typing = { text: askText || b.text, dur: b.dur, t0: E }
      L.typedLen = 0
      D.phase = 'typing'
      D.typed = ''
      D.ask = ''
      return true

    case 'send':
      L.pluckAt = E
      L.typing = null
      D.ask = (askText || D.typed || DEFAULT_ASK).trim()
      D.typed = ''
      D.phase = 'sent'
      return true

    case 'phase':
      D.phase = b.phase
      return true

    case 'tag':
      D.tag = b.text
      if (b.step != null) {
        D.step = b.step
        D.marks = [...D.marks, { at: L.drawn, tag: b.text }]
      }
      return true

    case 'draw':
      L.drawnAnim = { from: L.drawn, to: b.to, dur: b.dur, t0: E }
      return false

    case 'inkw':
      L.inkwAnim = { from: L.inkw, to: b.to, dur: b.dur, t0: E }
      return false

    case 'fray':
      L.fray = b.show ? 1 : 0
      return false

    case 'strand':
      L.strandAnims[b.i] = { from: L.strands[b.i], to: b.to, dur: b.dur, t0: E }
      return false

    case 'snap':
      L.snap[b.i] = b.on ? 1 : 0
      return false

    case 'knot':
      L.knot = b.on ? 1 : 0
      return false

    case 'freeze':
      L.freeze = b.on
      return false

    case 'open':
      L.openAnim = { from: L.open, to: b.to, dur: b.dur, t0: E }
      return false

    case 'reveal':
      D.revealed = true
      return true

    case 'end':
      return false
  }
}
