import { useCallback, useEffect, useRef, useState } from 'react'
import { CHATS, DEFAULT_ASK, SCENARIO, type Beat, type Card, type Item, type Msg } from './scenario'

export interface B11State {
  typed: string
  items: Item[]
  typing: boolean
}

const fresh = (): B11State => ({ typed: '', items: [], typing: false })

let uid = 0
const nid = (p: string) => p + ++uid
const clock = () => {
  const d = new Date()
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

const CANNED = [
  '收到。演示环境里我的回复是固定的，点右上角的播放键可以看完整的流程。',
  '好。左边是会话列表，中间是气泡，每条消息下面都有时间。',
]
let ci = 0

export function useBubble({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<B11State>(fresh)
  const r = useRef({ elapsed: 0, idx: 0, typing: null as any, typedLen: 0, disc: fresh(), mode: 'demo' as 'demo' | 'live' })
  const timers = useRef<number[]>([])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ ...D, items: D.items.map((i) => ({ ...i })) })
  }, [])

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }

  useEffect(() => {
    clearTimers()
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const S = r.current, D = S.disc
      S.elapsed += (now - last) * speed
      last = now
      let dirty = false
      if (S.mode === 'demo') {
        while (S.idx < SCENARIO.length && SCENARIO[S.idx].t <= S.elapsed) {
          const stop = applyBeat(S, SCENARIO[S.idx]); S.idx++; dirty = true
          if (stop) break
        }
        if (S.typing) {
          const p = Math.min(1, (S.elapsed - S.typing.t0) / S.typing.dur)
          const n = Math.round(p * S.typing.text.length)
          if (n !== S.typedLen) { S.typedLen = n; D.typed = S.typing.text.slice(0, n); dirty = true }
          if (p >= 1) S.typing = null
        }
      }
      if (dirty) commit()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, commit])

  const api = {
    /** 用户真的发了一条：先挂上「发送中」，再转成已发送 */
    send: useCallback((text: string) => {
      const t = text.trim(); if (!t) return
      const D = r.current.disc
      r.current.mode = 'live'
      const id = nid('u')
      D.items = [...D.items, { kind: 'msg', id, from: 'me', text: t, time: clock(), state: 'sending', t: 0 }]
      D.typed = ''
      commit()
      timers.current.push(window.setTimeout(() => {
        const m = r.current.disc.items.find((x) => x.id === id) as Msg | undefined
        if (m) m.state = 'sent'
        r.current.disc.typing = true
        commit()
      }, 500))

      const mid = nid('m')
      const reply = CANNED[ci++ % CANNED.length]
      timers.current.push(window.setTimeout(() => {
        r.current.disc.typing = false
        r.current.disc.items = [...r.current.disc.items, { kind: 'msg', id: mid, from: 'agent', text: reply, time: clock(), state: 'sent', t: 0 }]
        commit()
      }, 2200))
    }, [commit]),

    /** 撤回 */
    recall: useCallback((id: string) => {
      const D = r.current.disc
      const i = D.items.findIndex((x) => x.id === id)
      if (i < 0) return
      const m = D.items[i] as Msg
      D.items = D.items.map((x, j) => (j === i
        ? ({ kind: 'system', id: 'r' + id, text: (m.from === 'me' ? '你' : '对方') + '撤回了一条消息', time: m.time, t: 0 } as Item)
        : x))
      commit()
    }, [commit]),

    /** 重新生成：把最后一条 Agent 消息换掉 */
    regen: useCallback((id: string) => {
      const D = r.current.disc
      const m = D.items.find((x) => x.id === id) as Msg | undefined
      if (!m) return
      m.text = '（重新生成）' + (m.text ?? '')
      commit()
    }, [commit]),

    retry: useCallback((id: string) => {
      const m = r.current.disc.items.find((x) => x.id === id) as Msg | undefined
      if (!m) return
      m.state = 'sending'
      commit()
      timers.current.push(window.setTimeout(() => { m.state = 'sent'; commit() }, 900))
    }, [commit]),

    newChat: useCallback(() => {
      clearTimers()
      r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'live' }
      setState(r.current.disc)
    }, []),

    pick: useCallback((t: string) => { r.current.disc.typed = t; commit() }, [commit]),
    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api, chats: CHATS }
}

function applyBeat(S: { elapsed: number; typing: any; typedLen: number; disc: B11State }, b: Beat): boolean {
  const D = S.disc
  const push = (m: Msg) => { D.items = [...D.items, m] }
  switch (b.op) {
    case 'type': S.typing = { text: b.text, dur: b.dur, t0: S.elapsed }; S.typedLen = 0; D.typed = ''; return false
    case 'send':
      S.typing = null
      push({ kind: 'msg', id: b.id, from: b.from, text: b.text ?? (D.typed || DEFAULT_ASK), card: b.card, time: b.time, state: 'sent', t: S.elapsed })
      D.typed = ''
      return false
    case 'recv':
      push({ kind: 'msg', id: b.id, from: b.from, text: b.text, card: b.card, time: b.time, state: 'sent', t: S.elapsed })
      return false
    case 'sys':
      D.items = [...D.items, { kind: 'system', id: b.id, text: b.text, time: b.time, t: S.elapsed }]
      return false
    case 'typed': {
      const m = D.items.find((x) => x.id === b.id) as Msg | undefined
      if (m) m.state = b.state
      return false
    }
    case 'typing': D.typing = b.on; return false
    case 'end': return true
  }
}
