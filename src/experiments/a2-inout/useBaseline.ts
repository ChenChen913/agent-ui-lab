import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, typingFrame, type BeatRunner } from '../../shared/beat'
import { DEFAULT_ASK, SCENARIO, type Beat, type Msg, type Part } from './scenario'

export interface B8State { typed: string; messages: Msg[] }
const fresh = (): B8State => ({ typed: '', messages: [] })
let uid = 0
const nid = (p: string) => p + ++uid
const clone = (ms: Msg[]) => ms.map((m) => ({ ...m, files: m.files ? m.files.map((f) => ({ ...f })) : undefined, parts: m.parts ? m.parts.map((p) => JSON.parse(JSON.stringify(p)) as Part) : undefined }))

const CANNED = [
  '收到。这是演示环境，我的回复是固定的，点右上角的播放键可以看到完整的执行过程。',
  '好。这个界面里 Markdown、搜索结果、代码、图表、文件都会渲染成它们本来的样子。',
]
let ci = 0

export function useBaseline({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<B8State>(fresh)
  const r = useRef<BeatRunner<B8State>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const timers = useRef<number[]>([])
  const commit = useCallback(() => { const D = r.current.disc; setState({ typed: D.typed, messages: clone(D.messages) }) }, [])
  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  useEffect(() => { clearTimers(); r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }; setState(r.current.disc) }, [runId])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, typing: typingFrame, commit })

  const api = {
    send: useCallback((text: string) => {
      const t = text.trim(); if (!t) return
      const D = r.current.disc
      r.current.mode = 'live'
      D.messages = [...D.messages, { id: nid('u'), role: 'user', text: t }]
      D.typed = ''; commit()
      const id = nid('m')
      const reply = CANNED[ci++ % CANNED.length]
      timers.current.push(window.setTimeout(() => {
        const D2 = r.current.disc
        D2.messages = [...D2.messages, { id, role: 'agent', text: '', parts: [
          { id: 'k1', kind: 'thinking', state: 'done', secs: 0.9, text: '先理解一下用户要什么。' },
          { id: 'k2', kind: 'md', state: 'done', text: reply },
        ], done: true }]
        commit()
      }, 1100))
    }, [commit]),
    home: useCallback(() => { clearTimers(); r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }; setState(r.current.disc) }, []),
    pick: useCallback((t: string) => { r.current.disc.typed = t; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }
  return { state, api }
}

function applyBeat(S: BeatRunner<B8State>, b: Beat): boolean {
  const D = S.disc
  const msg = (id: string) => { let m = D.messages.find((x) => x.id === id); if (!m) { m = { id, role: 'agent', text: '', parts: [] }; D.messages = [...D.messages, m] } return m }
  switch (b.op) {
    case 'type': S.typing = { text: b.text, dur: b.dur, t0: S.elapsed }; S.typedLen = 0; D.typed = ''; return false
    case 'send':
      S.typing = null
      D.messages = [...D.messages, { id: nid('u'), role: 'user', text: D.typed || DEFAULT_ASK, files: [{ name: '季度报告.pdf', size: '4.2 MB', kind: 'pdf' }] }]
      D.typed = ''
      return false
    case 'part': { const m = msg(b.msg); m.parts = [...(m.parts ?? []), b.part]; return false }
    case 'fill': { const m = D.messages.find((x) => x.id === b.msg); const p = m?.parts?.find((x) => x.id === b.id); if (p) Object.assign(p, b.patch); return false }
    case 'stream': { const m = D.messages.find((x) => x.id === b.msg); if (m) m.streaming = b.index; return false }
    case 'done': { const m = D.messages.find((x) => x.id === b.msg); if (m) { m.streaming = -1; m.done = true } return false }
    case 'end': return true
  }
}
