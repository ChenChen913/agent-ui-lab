import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { NODES, EDGES, SCENARIO, TOTAL, type Beat, type NodeState } from './scenario'

export interface FieldState {
  visible: string[]
  edges: string[]
  states: Record<string, NodeState>
  answer: { title: string; lines: string[] } | null
  focusId: string | null
  free: boolean
  hoverId: string | null
}

interface NodeEl { el: HTMLElement; dot: HTMLElement | null; label: HTMLElement | null; id: string; depth: number }
interface EdgeEl { el: SVGLineElement; a: string; b: string; da: number; db: number; kind: string }

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const FR = 300          // 聚焦半径（世界坐标）：这个半径以内是清楚的
const DEFAULT_Z = 0.9

const emptyDisc = () => ({
  visible: [] as string[], edges: [] as string[], states: {} as Record<string, NodeState>,
  answer: null as null | { title: string; lines: string[] },
  focusId: null as string | null, free: false, hoverId: null as string | null,
})

export function useField(opts: {
  playing: boolean
  speed: number
  runId: number
  rootRef: RefObject<HTMLDivElement | null>
  gridRef: RefObject<HTMLDivElement | null>
  ringRef: RefObject<HTMLDivElement | null>
  zoomRef: RefObject<HTMLSpanElement | null>
}) {
  const { playing, speed, runId, rootRef, gridRef, ringRef, zoomRef } = opts
  const [state, setState] = useState<FieldState>(emptyDisc)

  const base = useRef<Record<string, { x: number; y: number }>>({})
  const S = useRef({
    elapsed: 0, idx: 0, zTarget: DEFAULT_Z, conv: null as null | { to: number; t0: number; dur: number },
    cam: { x: 0, y: 0, z: 1.7, tx: 0, ty: 0, tz: 1.7 },
    pos: {} as Record<string, { x: number; y: number }>,
    disc: emptyDisc(),
  })
  const nodes = useRef<NodeEl[]>([])
  const lines = useRef<EdgeEl[]>([])
  const paintRef = useRef<() => void>(() => {})
  const keyRef = useRef('')

  useEffect(() => {
    const b: Record<string, { x: number; y: number }> = {}
    for (const n of NODES) b[n.id] = { x: n.x, y: n.y }
    base.current = b
    S.current.pos = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, { ...v }]))
  }, [])

  // 元素缓存：每次渲染后重建（不是每帧）
  useEffect(() => {
    const r = rootRef.current
    if (!r) return
    nodes.current = Array.from(r.querySelectorAll<HTMLElement>('[data-node]')).map((el) => {
      const n = NODES.find((x) => x.id === el.dataset.node)!
      return { el, dot: el.querySelector('.sp-dot'), label: el.querySelector('.sp-label'), id: n.id, depth: n.depth }
    })
    lines.current = Array.from(r.querySelectorAll<SVGLineElement>('[data-edge]')).map((el) => {
      const e = EDGES.find((x) => x.id === el.dataset.edge)!
      const da = NODES.find((x) => x.id === e.a)?.depth ?? 0
      const db = NODES.find((x) => x.id === e.b)?.depth ?? 0
      return { el, a: e.a, b: e.b, da, db, kind: e.kind }
    })
  })

  useEffect(() => {
    const fresh = emptyDisc()
    S.current = {
      elapsed: 0, idx: 0, zTarget: DEFAULT_Z, conv: null,
      cam: { x: 0, y: 0, z: 1.7, tx: 0, ty: 0, tz: 1.7 },
      pos: Object.fromEntries(Object.entries(base.current).map(([k, v]) => [k, { ...v }])),
      disc: fresh,
    }
    setState(fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    const paint = () => {
      const st = S.current
      const root = rootRef.current
      if (!root) return
      const W = root.clientWidth
      const H = root.clientHeight
      const cam = st.cam

      // ① 相机：不自由时跟着 Agent 的注意力走
      if (!st.disc.free) {
        const f = st.pos[st.disc.focusId ?? 'root'] ?? { x: 0, y: 0 }
        cam.tx = f.x; cam.ty = f.y; cam.tz = st.zTarget
      }
      cam.x += (cam.tx - cam.x) * 0.075
      cam.y += (cam.ty - cam.y) * 0.075
      cam.z += (cam.tz - cam.z) * 0.075

      // ② 视差网格 —— 三个变量，一次写完
      const g = gridRef.current
      if (g) {
        const gs = 64 * cam.z
        g.style.setProperty('--gs', gs.toFixed(2) + 'px')
        g.style.setProperty('--gx', ((((W / 2 - cam.x * cam.z) % gs) + gs) % gs).toFixed(2) + 'px')
        g.style.setProperty('--gy', ((((H / 2 - cam.y * cam.z) % gs) + gs) % gs).toFixed(2) + 'px')
      }

      // ③ 焦点：自由探索时，屏幕中心就是焦点
      const fp = st.disc.free ? { x: cam.x, y: cam.y } : (st.pos[st.disc.focusId ?? 'root'] ?? { x: 0, y: 0 })
      if (ringRef.current) {
        const sx = W / 2 + (fp.x - cam.x) * cam.z
        const sy = H / 2 + (fp.y - cam.y) * cam.z
        ringRef.current.style.transform =
          'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) scale(' + ((FR * cam.z) / 100).toFixed(3) + ')'
      }

      // ④ 节点：视差 + 景深 + 注意力模糊
      for (const ne of nodes.current) {
        const p = st.pos[ne.id]
        if (!p) continue
        const persp = 1 + ne.depth * 0.0011
        const sx = W / 2 + (p.x - cam.x) * cam.z * persp
        const sy = H / 2 + (p.y - cam.y) * cam.z * persp
        const dist = Math.hypot(p.x - fp.x, p.y - fp.y)
        const near = clamp(1 - dist / FR, 0, 1)
        const blur = (1 - near) * 5.4 + Math.abs(ne.depth) * 0.009
        const k = cam.z * persp * (0.7 + near * 0.5)
        ne.el.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0)'
        ne.el.style.filter = blur > 0.4 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none'
        ne.el.style.opacity = (0.16 + near * 0.84).toFixed(3)
        if (ne.dot) ne.dot.style.transform = 'translate(-50%,-50%) scale(' + k.toFixed(3) + ')'
        if (ne.label) ne.label.style.opacity = clamp((near - 0.44) * 2.7, 0, 1).toFixed(3)
      }

      // ⑤ 连线
      for (const le of lines.current) {
        const pa = st.pos[le.a], pb = st.pos[le.b]
        if (!pa || !pb) continue
        const ka = 1 + le.da * 0.0011
        const kb = 1 + le.db * 0.0011
        const ax = W / 2 + (pa.x - cam.x) * cam.z * ka
        const ay = H / 2 + (pa.y - cam.y) * cam.z * ka
        const bx = W / 2 + (pb.x - cam.x) * cam.z * kb
        const by = H / 2 + (pb.y - cam.y) * cam.z * kb
        le.el.setAttribute('x1', ax.toFixed(1)); le.el.setAttribute('y1', ay.toFixed(1))
        le.el.setAttribute('x2', bx.toFixed(1)); le.el.setAttribute('y2', by.toFixed(1))
        const mid = Math.hypot((pa.x + pb.x) / 2 - fp.x, (pa.y + pb.y) / 2 - fp.y)
        le.el.style.opacity = (0.08 + clamp(1 - mid / (FR * 1.6), 0, 1) * 0.6).toFixed(3)
      }

      if (zoomRef.current) zoomRef.current.textContent = cam.z.toFixed(2) + '×'
    }
    paintRef.current = paint

    if (!playing) { paint(); return }
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const st = S.current
      const D = st.disc
      st.elapsed += (now - last) * speed
      last = now
      let dirty = false

      while (st.idx < SCENARIO.length && SCENARIO[st.idx].t <= st.elapsed) {
        dirty = applyBeat(st, SCENARIO[st.idx]) || dirty
        st.idx++
      }

      // 收敛：所有坐标按比例向中心塌缩
      if (st.conv) {
        const p = clamp((st.elapsed - st.conv.t0) / st.conv.dur, 0, 1)
        const e = 1 - Math.pow(1 - p, 3)
        const k = 1 + (st.conv.to - 1) * e
        for (const id in base.current) {
          st.pos[id].x = base.current[id].x * k
          st.pos[id].y = base.current[id].y * k
        }
      }

      paint()

      const key = D.focusId + '|' + D.free + '|' + D.visible.length + '|' + D.edges.length +
        '|' + (D.answer ? 1 : 0) + '|' + D.hoverId + '|' + Object.keys(D.states).length
      if (key !== keyRef.current) {
        keyRef.current = key
        setState({ ...D, visible: [...D.visible], edges: [...D.edges], states: { ...D.states } })
      }
      if (st.idx < SCENARIO.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, runId, rootRef, gridRef, ringRef, zoomRef])

  const commit = useCallback(() => {
    const D = S.current.disc
    setState({ ...D, visible: [...D.visible], edges: [...D.edges], states: { ...D.states } })
  }, [])

  const api = {
    panBy: useCallback((dx: number, dy: number) => {
      const st = S.current
      st.cam.tx -= dx / st.cam.z
      st.cam.ty -= dy / st.cam.z
      st.cam.x = st.cam.tx
      st.cam.y = st.cam.ty
      st.zTarget = st.cam.tz
      if (!st.disc.free) { st.disc.free = true; commit() }
      paintRef.current()
    }, [commit]),

    zoomAt: useCallback((factor: number, mx: number, my: number) => {
      const st = S.current
      const root = rootRef.current
      if (!root) return
      const W = root.clientWidth, H = root.clientHeight
      const wx = st.cam.x + (mx - W / 2) / st.cam.z
      const wy = st.cam.y + (my - H / 2) / st.cam.z
      st.cam.z = clamp(st.cam.z * factor, 0.28, 3.2)
      st.cam.tz = st.cam.z
      st.cam.tx = wx - (mx - W / 2) / st.cam.z
      st.cam.ty = wy - (my - H / 2) / st.cam.z
      st.zTarget = st.cam.tz
      if (!st.disc.free) { st.disc.free = true; commit() }
      paintRef.current()
    }, [rootRef, commit]),

    pick: useCallback((id: string | null) => {
      const st = S.current
      if (id) {
        st.disc.focusId = id
        st.disc.free = false
        st.zTarget = Math.max(st.cam.z, 1.15)
      } else {
        st.disc.free = true
      }
      commit()
      paintRef.current()
    }, [commit]),

    follow: useCallback(() => {
      const st = S.current
      st.disc.free = false
      st.zTarget = DEFAULT_Z
      commit()
      paintRef.current()
    }, [commit]),

    setHover: useCallback((id: string | null) => {
      const st = S.current
      if (st.disc.hoverId === id) return
      st.disc.hoverId = id
      commit()
    }, [commit]),
  }

  return { state, api, total: TOTAL }
}

function applyBeat(
  st: { elapsed: number; zTarget: number; conv: any; disc: any },
  b: Beat,
): boolean {
  const D = st.disc
  switch (b.op) {
    case 'show':
      D.visible = [...D.visible, b.id]
      return true
    case 'edge':
      D.edges = [...D.edges, b.id]
      return true
    case 'focus':
      D.focusId = b.id
      D.free = false
      if (b.zoom != null) st.zTarget = b.zoom
      return true
    case 'state':
      D.states = { ...D.states, [b.id]: b.state }
      return true
    case 'converge':
      st.conv = { to: b.to, t0: st.elapsed, dur: b.dur }
      return false
    case 'answer':
      D.answer = { title: b.title, lines: b.lines }
      return true
    case 'end':
      return false
  }
}
