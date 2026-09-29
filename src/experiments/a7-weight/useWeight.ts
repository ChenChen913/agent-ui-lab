import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, type BeatRunner } from '../../shared/beat'
import { SCENARIO, guessWeight, type Beat, type LogKind, type LogLine, type W7State } from './scenario'

/**
 * A7 · Weight 的引擎
 *
 * 剧本里全是离散拍（刷一行、表跳一格、撑大一次），没有逐帧的东西 ——
 * 表针的平滑交给 CSS transition，所以这里直接用共享节拍引擎就够了。
 *
 * live 模式下用户自己派活，那时没有剧本，日志按 260ms 一行自己刷。
 * 那些定时器统一记着，重开的时候全部清掉。
 */

const fresh = (): W7State => ({ asks: [], cur: -1, lines: [], w: 0, grown: false, done: [] })

export function useWeight({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<W7State>(fresh)
  const r = useRef<BeatRunner<W7State>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
  }

  useEffect(() => {
    clearTimers()
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(fresh())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => clearTimers, [])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ asks: [...D.asks], cur: D.cur, lines: [...D.lines], w: D.w, grown: D.grown, done: [...D.done] })
  }, [])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, commit })

  /** 用户自己派一件事：先估分量，再按分量刷出对应密度的日志 */
  const submit = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text) return
    clearTimers()
    r.current.mode = 'live'

    const D = r.current.disc
    D.lines = []
    D.w = 0
    D.grown = false
    D.cur = D.asks.length
    D.asks = [...D.asks, { text, weight: 0, answer: '' }]
    commit()

    const w = guessWeight(text)
    D.asks[D.cur].weight = w
    const script = makeLines(w, D.cur)

    script.forEach((ln, i) => {
      const id = window.setTimeout(() => {
        D.lines.push(ln)
        // 表针跟着行数一起爬，爬到估算的那个数为止
        D.w = Math.min(w, Math.round(((i + 1) / script.length) * w))
        if (!D.grown && (w > 55 || D.lines.length > 8)) D.grown = true
        if (i === script.length - 1) {
          D.asks[D.cur].answer = D.lines.filter((x) => x.k === 'edit').length + ' 个文件，做完了'
          D.done = [...D.done, D.asks[D.cur].answer]
        }
        commit()
      }, 240 * (i + 1))
      timers.current.push(id)
    })
  }, [commit])

  return { state, api: { submit } }
}

function applyBeat(S: BeatRunner<W7State>, b: Beat) {
  const D = S.disc
  switch (b.op) {
    case 'ask':
      D.cur = D.asks.length
      D.asks = [...D.asks, { text: b.text, weight: 0, answer: '' }]
      D.lines = []
      D.w = 0
      D.grown = false
      return false
    case 'log':
      D.lines = [...D.lines, { at: S.elapsed, k: b.k, text: b.text, task: D.cur }]
      return false
    case 'w':
      D.w = b.v
      return false
    case 'grew':
      D.grown = true
      return false
    case 'answer': {
      D.done = [...D.done, b.text]
      if (D.cur >= 0 && D.asks[D.cur]) D.asks[D.cur].answer = b.text
      return false
    }
  }
  return false
}

/* ── live 模式的日志：分量越大，行数越多，越可能有一行拿不准 ── */

const POOL: Record<LogKind, string[]> = {
  think: ['先看清要动哪些地方', '这件事要分几步', '有个地方得先确认一下'],
  read: ['读 src/pages/', '读 src/lab/registry.ts', '读 tailwind.config.ts', '扫了一遍 styles/'],
  edit: ['改了一处', '补上类型', '拆出一个变量', '动了两个文件'],
  run: ['pnpm build', 'pnpm test', 'tsc --noEmit'],
  ok: ['过了', '做完了'],
  warn: ['有一处我没敢替你定', '这里可能跟你的想法不一样'],
}

function makeLines(w: number, task: number): LogLine[] {
  const n = Math.max(3, Math.round(w / 7))
  const out: Omit<LogLine, 'task'>[] = []
  const pick = (k: LogKind) => POOL[k][out.length % POOL[k].length]

  out.push({ at: 0, k: 'think', text: pick('think') })
  for (let i = 1; i < n - 1; i++) {
    const k: LogKind = i % 4 === 1 ? 'read' : i % 4 === 2 ? 'edit' : i % 4 === 3 ? 'run' : 'read'
    out.push({ at: i * 240, k, text: pick(k) })
    if (w > 55 && i === Math.floor(n / 2)) out.push({ at: i * 240, k: 'warn', text: pick('warn') })
  }
  out.push({ at: n * 240, k: 'ok', text: pick('ok') })
  return out.map((l) => ({ ...l, task }))
}
