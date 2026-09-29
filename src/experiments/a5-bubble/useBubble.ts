import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, typingFrame, type BeatRunner } from '../../shared/beat'
import { DEFAULT_ASK, SCENARIO, WELCOME_MSG, type Beat, type Block, type Msg } from './scenario'

export interface B11State {
  typed: string
  messages: Msg[]
  typing: boolean
}

/** 打开就有 Agent 的自我介绍 —— 这是初始状态，不是演示的第一拍 */
const fresh = (): B11State => ({ typed: '', messages: [{ ...WELCOME_MSG }], typing: false })

let uid = 0
const nid = (p: string) => p + ++uid
const clock = () => {
  const d = new Date()
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

const CANNED: { blocks: Block[] }[] = [
  { blocks: [
    { kind: 'p', text: '收到。这是演示环境，我的回复是固定的，点右上角的播放键可以看完整的流程。' },
    { kind: 'p', text: '这个界面里你可以随时打字，过程会出现在我的面板里。' },
  ] },
  { blocks: [
    { kind: 'p', text: '好。每条消息下面都有时间，左边是我的头像和昵称，右边是你的。' },
  ] },
]
let ci = 0

export function useBubble({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<B11State>(fresh)
  const r = useRef<BeatRunner<B11State>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const timers = useRef<number[]>([])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({
      ...D,
      messages: D.messages.map((m) => ({
        ...m,
        blocks: m.blocks.map((b) => (b.kind === 'acts' ? { ...b, acts: b.acts.map((a) => ({ ...a })) } : b)),
      })),
    })
  }, [])

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  useEffect(() => {
    clearTimers()
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, typing: typingFrame, commit })

  const api = {
    send: useCallback((text: string) => {
      const t = text.trim(); if (!t) return
      const D = r.current.disc
      r.current.mode = 'live'
      D.messages = [...D.messages, { id: nid('u'), from: 'me', blocks: [{ kind: 'p', text: t }], time: clock(), streaming: -1, done: true }]
      D.typed = ''
      D.typing = true
      commit()

      const id = nid('m')
      const c = CANNED[ci++ % CANNED.length]
      timers.current.push(window.setTimeout(() => {
        const D2 = r.current.disc
        D2.typing = false
        D2.messages = [...D2.messages, { id, from: 'agent', blocks: [], time: clock(), streaming: -1, done: false }]
        commit()
      }, 1100))
      c.blocks.forEach((b, i) => {
        timers.current.push(window.setTimeout(() => {
          const m = r.current.disc.messages.find((x) => x.id === id)
          if (!m) return
          m.blocks = [...m.blocks, b]
          m.streaming = i
          commit()
        }, 1500 + i * 700))
      })
      timers.current.push(window.setTimeout(() => {
        const m = r.current.disc.messages.find((x) => x.id === id)
        if (m) { m.streaming = -1; m.done = true }
        commit()
      }, 1500 + c.blocks.length * 700 + 300))
    }, [commit]),

    /** 点一下过程，把某条 Agent 消息里的步骤条收起来 */
    foldActs: useCallback((id: string, bi: number) => {
      const m = r.current.disc.messages.find((x) => x.id === id)
      const b = m?.blocks[bi]
      if (b && b.kind === 'acts') { b.acts = b.acts.map((a) => ({ ...a })) }
      commit()
    }, [commit]),

    reset: useCallback(() => {
      clearTimers()
      r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }
      setState(r.current.disc)
    }, []),

    pick: useCallback((t: string) => { r.current.disc.typed = t; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api }
}

function applyBeat(S: BeatRunner<B11State>, b: Beat): boolean {
  const D = S.disc
  const msg = (id: string) => D.messages.find((x) => x.id === id)

  switch (b.op) {
    case 'type': S.typing = { text: b.text, dur: b.dur, t0: S.elapsed }; S.typedLen = 0; D.typed = ''; return false
    case 'send':
      S.typing = null
      D.messages = [...D.messages, { id: b.id, from: 'me', blocks: [{ kind: 'p', text: b.text }], time: b.time, streaming: -1, done: true }]
      D.typed = ''
      return false
    case 'recv':
      D.messages = [...D.messages, { id: b.id, from: 'agent', blocks: b.blocks, time: b.time, streaming: -1, done: true }]
      return false
    case 'push': { const m = msg(b.id); if (m) m.blocks = [...m.blocks, b.block]; return false }
    case 'stream': { const m = msg(b.id); if (m) m.streaming = b.index; return false }
    case 'act': {
      const m = msg(b.id)
      const blk = m?.blocks[b.bi]
      if (blk && blk.kind === 'acts' && blk.acts[b.ai]) {
        blk.acts[b.ai].state = b.state
        if (b.note) blk.acts[b.ai].note = b.note
      }
      return false
    }
    case 'done': { const m = msg(b.id); if (m) { m.streaming = -1; m.done = true } return false }
    case 'typing': D.typing = b.on; return false
    case 'end': return true
  }
}
