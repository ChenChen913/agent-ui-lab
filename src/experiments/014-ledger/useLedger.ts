import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, type BeatRunner } from '../../shared/beat'
import { FOLLOWUP, fresh, SCENARIO, type Beat, type LgState } from './scenario'

/**
 * 014 · Ledger —— 引擎
 *
 * 没有打字机，没有逐帧推进：答案以段落为单位长出来，来源逐个点亮。
 * 引擎在这里只负责一件事 —— 按剧本的时间把段子和「已验证」的戳盖上去。
 */
export function useLedger({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<LgState>(fresh)
  const r = useRef<BeatRunner<LgState>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })

  const commit = useCallback(() => {
    const D = r.current.disc
    setState({
      srcs: D.srcs.map((x) => ({ ...x })),
      blocks: D.blocks.map((x) => ({ ...x })),
      hl: D.hl,
      typed: D.typed,
      asked: D.asked.map((x) => ({ ...x })),
    })
  }, [])

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(fresh())
  }, [runId])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, commit })

  const api = {
    /** 悬停 / 点击来源或角标 */
    hl: useCallback((n: number | null) => { r.current.disc.hl = n; commit() }, [commit]),

    /** 追问。演示环境回复固定 */
    ask: useCallback(() => {
      const D = r.current.disc
      const q = D.typed.trim()
      if (!q) return
      D.typed = ''
      r.current.mode = 'live'
      D.asked = [...D.asked, { q, a: FOLLOWUP.a, cites: FOLLOWUP.cites }]
      commit()
    }, [commit]),

    setTyped: useCallback((v: string) => { r.current.disc.typed = v; commit() }, [commit]),
  }

  return { state, api }
}

function applyBeat(S: BeatRunner<LgState>, b: Beat): boolean {
  const D = S.disc
  switch (b.op) {
    case 'src': D.srcs = [...D.srcs, { n: b.n, domain: b.domain, title: b.title, state: 'reading', cites: 0 }]; return false
    case 'ok': {
      const s = D.srcs.find((x) => x.n === b.n)
      if (s) s.state = 'verified'
      // 统计这段正文里已经出现的引用次数
      for (const blk of D.blocks) s && (s.cites += countCites(blk.text, b.n))
      return false
    }
    case 'block': D.blocks = [...D.blocks, { id: b.id, kind: b.kind, text: b.text, state: 'writing' }]; return false
    case 'doneBlock': {
      const blk = D.blocks.find((x) => x.id === b.id)
      if (blk) {
        blk.state = 'done'
        // 段落写完，把它身上的引用记账到来源
        for (const s of D.srcs) s.cites += countCites(blk.text, s.n)
      }
      return false
    }
    case 'end': return true
  }
}

function countCites(text: string, n: number): number {
  const m = text.match(new RegExp('‹' + n + '›', 'g'))
  return m ? m.length : 0
}
