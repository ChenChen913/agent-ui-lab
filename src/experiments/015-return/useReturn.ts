import { useCallback, useEffect, useRef, useState } from 'react'
import { SCENARIO, type Beat, type Item } from './scenario'

export interface R15State { arrived: boolean; items: Item[]; ignored: { count: number; minutes: number } | null }
const fresh = (): R15State => ({ arrived: false, items: [], ignored: null })

export function useReturn({ playing, speed, runId }: { playing: boolean; speed: number; runId: number }) {
  const [state, setState] = useState<R15State>(fresh)
  const r = useRef({ elapsed: 0, idx: 0, disc: fresh() })
  const commit = useCallback(() => { const D = r.current.disc; setState({ arrived: D.arrived, items: D.items.map((i) => ({ ...i })), ignored: D.ignored ? { ...D.ignored } : null }) }, [])

  useEffect(() => { r.current = { elapsed: 0, idx: 0, disc: fresh() }; setState(r.current.disc) }, [runId])

  useEffect(() => {
    if (!playing) return
    let raf = 0, last = performance.now()
    const tick = (now: number) => {
      const S = r.current; S.elapsed += (now - last) * speed; last = now
      let dirty = false
      while (S.idx < SCENARIO.length && SCENARIO[S.idx].t <= S.elapsed) { const stop = applyBeat(S, SCENARIO[S.idx]); S.idx++; dirty = true; if (stop) break }
      if (dirty) commit()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, commit])

  const api = {
    toggle: useCallback((id: string) => { const it = r.current.disc.items.find((x) => x.id === id); if (it) it.open = !it.open; commit() }, [commit]),
    alwaysAsk: useCallback((id: string) => { const it = r.current.disc.items.find((x) => x.id === id); if (it) it.alwaysAsk = !it.alwaysAsk; commit() }, [commit]),
    answer: useCallback((id: string, text: string) => { const it = r.current.disc.items.find((x) => x.id === id); if (it) it.answered = text; commit() }, [commit]),
  }
  return { state, api }
}

function applyBeat(S: { disc: R15State }, b: Beat): boolean {
  const D = S.disc
  switch (b.op) {
    case 'arrive': D.arrived = true; return false
    case 'item': D.items = [...D.items, { id: b.id, kind: b.kind, at: b.at, time: b.time, text: b.text, options: b.options, was: b.was }]; return false
    case 'ignored': D.ignored = { count: b.count, minutes: b.minutes }; return false
    case 'open': { const it = D.items.find((x) => x.id === b.id); if (it) it.open = true; return false }
    case 'end': return true
  }
}
