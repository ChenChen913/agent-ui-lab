import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO, type Beat, type Doc, type Src } from './scenario'

export interface S14State { docs: Doc[]; srcs: Src[]; removed: string[] }
const fresh = (): S14State => ({ docs: [], srcs: [], removed: [] })

export function useSettle({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<S14State>(fresh)
  const r = useRef({ elapsed: 0, idx: 0, disc: fresh() })
  const commit = useCallback(() => { const D = r.current.disc; setState({ docs: D.docs.map((d) => ({ ...d })), srcs: D.srcs.map((s) => ({ ...s })), removed: [...D.removed] }) }, [])

  useEffect(() => {
    r.current = { elapsed: 0, idx: 0, disc: fresh() }
    setState(r.current.disc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    if (!playing) return
    let raf = 0, last = performance.now()
    const tick = (now: number) => {
      const S = r.current; S.elapsed += (now - last) * speed; last = now
      let dirty = false
      while (S.idx < SCENARIO.length && SCENARIO[S.idx].t <= S.elapsed) { if (applyBeat(S, SCENARIO[S.idx])) { S.idx++; return } ; S.idx++; dirty = true }
      if (dirty) commit()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, commit])

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
    reset: useCallback(() => { r.current = { elapsed: 0, idx: 0, disc: fresh() }; setState(r.current.disc) }, []),
  }
  return { state, api }
}

function applyBeat(S: { elapsed: number; idx: number; disc: S14State }, b: Beat): boolean {
  const D = S.disc
  switch (b.op) {
    case 'srcs': D.srcs = b.list.map(([id, label]) => ({ id, label, state: 'pending' as const })); return false
    case 'src': { const s = D.srcs.find((x) => x.id === b.id); if (s) { s.state = b.state; if (b.count) s.count = b.count } return false }
    case 'doc': D.docs = [...D.docs, { id: b.id, kind: b.kind, text: b.text, items: b.items, rows: b.rows, src: b.src, state: 'writing' }]; return false
    case 'block': { const d = D.docs.find((x) => x.id === b.id); if (d) d.state = b.state; return false }
    case 'end': return true
  }
}
