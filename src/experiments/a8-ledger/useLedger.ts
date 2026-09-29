import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, type BeatRunner } from '../../shared/beat'
import { PARAS, SCENARIO, SOURCES, type Beat, type L8State } from './scenario'

/**
 * A8 · Ledger 的引擎
 *
 * 段落一段一段浮上来，出处一个一个验完 —— 全是离散拍，
 * 所以用共享节拍引擎就够，没有逐帧的东西。
 */

const fresh = (): L8State => ({ shown: 0, sources: SOURCES.map((s) => ({ ...s })), follow: [], hl: null })

export function useLedger({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<L8State>(fresh)
  const r = useRef<BeatRunner<L8State>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(fresh())
  }, [runId])

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({ shown: D.shown, sources: D.sources.map((s) => ({ ...s })), follow: [...D.follow], hl: D.hl })
  }, [])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, commit })

  const api = {
    hl: useCallback((n: number | null) => {
      r.current.disc.hl = n
      r.current.mode = 'live'
      commit()
    }, [commit]),

    /** 追问：答案续在正文下面，不是另开一轮 */
    ask: useCallback((raw: string) => {
      const q = raw.trim()
      if (!q) return
      const D = r.current.disc
      const n = D.follow.length + 1
      D.follow = [...D.follow, {
        q,
        a: '顺着上面的编号查，能查到就写在这里；查不到的，我会明说查不到 —— 这是第 ' + n + ' 次追问。',
      }]
      r.current.mode = 'live'
      commit()
    }, [commit]),
  }

  return { state, api }
}

function applyBeat(S: BeatRunner<L8State>, b: Beat): boolean {
  const D = S.disc
  switch (b.op) {
    case 'para':
      D.shown = Math.min(PARAS.length, D.shown + 1)
      return false
    case 'src': {
      const s = D.sources.find((x) => x.n === b.n)
      if (s) s.state = 'ok'
      return false
    }
    case 'follow':
      D.follow = [...D.follow, { q: b.q, a: b.a }]
      return false
    case 'end':
      return true
  }
}
