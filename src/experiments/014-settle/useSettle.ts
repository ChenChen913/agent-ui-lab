import { useCallback, useEffect, useRef, useState } from 'react'
import { useBeatLoop, type BeatRunner } from '../../shared/beat'
import { SCENARIO, type Beat, type Doc, type Src } from './scenario'

export interface S14State { docs: Doc[]; srcs: Src[]; removed: string[] }
const fresh = (): S14State => ({ docs: [], srcs: [], removed: [] })

export function useSettle({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<S14State>(fresh)
  const r = useRef<BeatRunner<S14State>>({ elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' })
  const commit = useCallback(() => { const D = r.current.disc; setState({ docs: D.docs.map((d) => ({ ...d })), srcs: D.srcs.map((s) => ({ ...s })), removed: [...D.removed] }) }, [])

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useBeatLoop({ playing, speed, runId, S: r, scenario: SCENARIO, applyBeat, commit })

  const api = {
    /** 撤掉一个来源 —— 靠它产出的段落整块划掉 */
    dropSrc: useCallback((id: string) => {
      const D = r.current.disc
      const already = D.removed.includes(id)
      D.removed = already ? D.removed.filter((x) => x !== id) : [...D.removed, id]
      const s = D.srcs.find((x) => x.id === id)
      if (s) s.state = already ? 'done' : 'dropped'
      D.docs = D.docs.map((d) => (d.src === id ? { ...d, state: already ? 'done' : 'dropped' } : d))
      commit()
    }, [commit]),
    reset: useCallback(() => { r.current = { elapsed: 0, idx: 0, typing: null, typedLen: 0, disc: fresh(), mode: 'demo' }; setState(r.current.disc) }, []),
  }
  return { state, api }
}

function applyBeat(S: BeatRunner<S14State>, b: Beat): boolean {
  const D = S.disc
  switch (b.op) {
    case 'srcs': D.srcs = b.list.map(([id, label]) => ({ id, label, state: 'pending' as const })); return false
    case 'src': { const s = D.srcs.find((x) => x.id === b.id); if (s) { s.state = b.state; if (b.count) s.count = b.count } return false }
    case 'doc': D.docs = [...D.docs, { id: b.id, kind: b.kind, text: b.text, items: b.items, rows: b.rows, src: b.src, state: 'writing' }]; return false
    case 'block': { const d = D.docs.find((x) => x.id === b.id); if (d) d.state = b.state; return false }
    case 'end': return true
  }
}
