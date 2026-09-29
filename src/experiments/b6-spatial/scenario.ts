/**
 * B6 · Spatial —— 剧本
 *
 * 问题：如果 Agent 的状态不是用列表表达，而是用空间关系表达，会怎么样？
 *
 * 核心概念：**一片场（The Field）**
 *   Agent 处理过的每一样东西，在这片场里有一个位置。
 *   相关的东西靠得近，重要的大，久远的暗。
 *   Agent 的注意力 = 一个会移动、会聚焦的镜头。
 *   离焦点越远的东西越模糊、越小、越暗 —— 模糊度就是注意力。
 *
 * 整部片子的形状：**展开 → 连接 → 收敛**。
 *   一个问题在场里炸开成一片星座，然后所有东西向中心塌缩成一个答案。
 *
 * 坐标是极坐标算出来的：分支按角度铺开，证据挂在自己的分支上。
 */

export type NodeKind = 'root' | 'branch' | 'source' | 'finding'
export type NodeState = 'idle' | 'live' | 'conflict' | 'ok'

export interface FNode {
  id: string
  label: string
  kind: NodeKind
  x: number
  y: number
  depth: number
  size: number
}

export interface FEdge { id: string; a: string; b: string; kind: 'link' | 'conflict' | 'cross' }

export type Beat =
  | { t: number; op: 'show'; id: string }
  | { t: number; op: 'edge'; id: string }
  | { t: number; op: 'focus'; id: string; zoom?: number }
  | { t: number; op: 'state'; id: string; state: NodeState }
  | { t: number; op: 'converge'; to: number; dur: number }
  | { t: number; op: 'answer'; title: string; lines: string[] }
  | { t: number; op: 'end' }

export const QUESTION = '要不要把现在的搜索换成向量检索？'
export const TOTAL = 27000

const rad = (d: number) => (d * Math.PI) / 180
const at = (r: number, deg: number) => ({ x: Math.cos(rad(deg)) * r, y: Math.sin(rad(deg)) * r })

export const BRANCHES = [
  { id: 'b-cost', label: '成本', deg: -90 },
  { id: 'b-quality', label: '召回效果', deg: 30 },
  { id: 'b-risk', label: '迁移风险', deg: 150 },
]

const SOURCES: { id: string; parent: string; label: string; r: number; da: number; depth: number; size: number }[] = [
  { id: 's1', parent: 'b-cost', label: 'pgvector 的 TCO 分析', r: 430, da: -26, depth: 90, size: 7 },
  { id: 's2', parent: 'b-cost', label: '托管向量库定价对比', r: 476, da: 2, depth: -60, size: 8 },
  { id: 's3', parent: 'b-cost', label: '自建 vs 托管的人力成本', r: 446, da: 28, depth: 140, size: 6 },
  { id: 's4', parent: 'b-quality', label: 'ANN-Benchmarks 2025', r: 452, da: -24, depth: -120, size: 9 },
  { id: 's5', parent: 'b-quality', label: '中文语料召回实测', r: 496, da: 2, depth: 80, size: 7 },
  { id: 's6', parent: 'b-quality', label: '混合检索的增益', r: 442, da: 26, depth: -40, size: 7 },
  { id: 's7', parent: 'b-quality', label: 'HNSW vs IVFFlat 复现', r: 528, da: -46, depth: 160, size: 8 },
  { id: 's8', parent: 'b-risk', label: '双写迁移方案', r: 444, da: -22, depth: -90, size: 7 },
  { id: 's9', parent: 'b-risk', label: '回滚成本评估', r: 478, da: 6, depth: 110, size: 8 },
  { id: 's10', parent: 'b-risk', label: '线上流量回放', r: 434, da: 30, depth: -140, size: 6 },
]

export const NODES: FNode[] = [
  { id: 'root', label: QUESTION, kind: 'root', x: 0, y: 0, depth: 0, size: 17 },
  ...BRANCHES.map((b) => {
    const p = at(252, b.deg)
    return { id: b.id, label: b.label, kind: 'branch' as NodeKind, x: p.x, y: p.y, depth: 40, size: 11 }
  }),
  ...SOURCES.map((s) => {
    const b = BRANCHES.find((x) => x.id === s.parent)!
    const p = at(s.r, b.deg + s.da)
    return { id: s.id, label: s.label, kind: 'source' as NodeKind, x: p.x, y: p.y, depth: s.depth, size: s.size }
  }),
  ...['f1', 'f2', 'f3'].map((id, i) => {
    const b = BRANCHES[i]
    const p = at(186, b.deg + (i === 0 ? 30 : i === 1 ? -34 : 36))
    const label = ['预算增加 18%', '召回率 +12pt', '需要 3 周迁移窗口'][i]
    return { id, label, kind: 'finding' as NodeKind, x: p.x, y: p.y, depth: 200, size: 7 }
  }),
]

export const EDGES: FEdge[] = [
  ...BRANCHES.map((b, i) => ({ id: 'e-b' + i, a: 'root', b: b.id, kind: 'link' as const })),
  ...SOURCES.map((s, i) => ({ id: 'e-s' + i, a: s.parent, b: s.id, kind: 'link' as const })),
  { id: 'e-f0', a: 'b-cost', b: 'f1', kind: 'link' },
  { id: 'e-f1', a: 'b-quality', b: 'f2', kind: 'link' },
  { id: 'e-f2', a: 'b-risk', b: 'f3', kind: 'link' },
  { id: 'e-x0', a: 's4', b: 's7', kind: 'conflict' },
  { id: 'e-x1', a: 's4', b: 's9', kind: 'cross' },
  { id: 'e-x2', a: 's2', b: 's10', kind: 'cross' },
]

export const ANSWER = {
  title: '先做混合检索，不整体替换',
  lines: ['召回率 +12pt，成本只增加 18%', '迁移窗口压到 1 周，可随时回滚'],
}

export const SCENARIO: Beat[] = [
  { t: 700, op: 'show', id: 'root' },
  { t: 1000, op: 'focus', id: 'root', zoom: 0.9 },

  // ── 展开：一个问题裂成三个方向 ──────────────────────────
  { t: 2600, op: 'show', id: 'b-cost' }, { t: 2750, op: 'edge', id: 'e-b0' },
  { t: 2950, op: 'show', id: 'b-quality' }, { t: 3100, op: 'edge', id: 'e-b1' },
  { t: 3300, op: 'show', id: 'b-risk' }, { t: 3450, op: 'edge', id: 'e-b2' },
  { t: 4000, op: 'focus', id: 'b-cost', zoom: 1 },

  // ── 成本这一支 ──────────────────────────────────────────
  { t: 4700, op: 'show', id: 's1' }, { t: 4800, op: 'edge', id: 'e-s0' },
  { t: 5100, op: 'show', id: 's2' }, { t: 5200, op: 'edge', id: 'e-s1' },
  { t: 5500, op: 'show', id: 's3' }, { t: 5600, op: 'edge', id: 'e-s2' },
  { t: 6100, op: 'focus', id: 's2', zoom: 1.25 },
  { t: 6700, op: 'focus', id: 's3', zoom: 1.25 },

  // ── 效果这一支 ──────────────────────────────────────────
  { t: 7300, op: 'focus', id: 'b-quality', zoom: 1 },
  { t: 7900, op: 'show', id: 's4' }, { t: 8000, op: 'edge', id: 'e-s3' },
  { t: 8300, op: 'show', id: 's5' }, { t: 8400, op: 'edge', id: 'e-s4' },
  { t: 8700, op: 'show', id: 's6' }, { t: 8800, op: 'edge', id: 'e-s5' },
  { t: 9300, op: 'focus', id: 's5', zoom: 1.25 },

  // ── 风险这一支 ──────────────────────────────────────────
  { t: 9900, op: 'focus', id: 'b-risk', zoom: 1 },
  { t: 10500, op: 'show', id: 's8' }, { t: 10600, op: 'edge', id: 'e-s7' },
  { t: 10900, op: 'show', id: 's9' }, { t: 11000, op: 'edge', id: 'e-s8' },
  { t: 11300, op: 'show', id: 's10' }, { t: 11400, op: 'edge', id: 'e-s9' },
  { t: 11900, op: 'focus', id: 's9', zoom: 1.25 },

  // ── 矛盾：两份复现结论对不上 ────────────────────────────
  { t: 12500, op: 'focus', id: 'b-quality', zoom: 1 },
  { t: 12900, op: 'show', id: 's7' }, { t: 13000, op: 'edge', id: 'e-s6' },
  { t: 13500, op: 'focus', id: 's4', zoom: 1.4 },
  { t: 13900, op: 'state', id: 's4', state: 'conflict' },
  { t: 14200, op: 'focus', id: 's7', zoom: 1.4 },
  { t: 14600, op: 'state', id: 's7', state: 'conflict' },
  { t: 14900, op: 'edge', id: 'e-x0' },

  // ── 拉远看一眼全貌：一片星座已经长出来了 ────────────────
  { t: 15400, op: 'focus', id: 'root', zoom: 0.62 },
  { t: 16100, op: 'show', id: 'f1' }, { t: 16200, op: 'edge', id: 'e-f0' },
  { t: 16500, op: 'show', id: 'f2' }, { t: 16600, op: 'edge', id: 'e-f1' },
  { t: 16900, op: 'show', id: 'f3' }, { t: 17000, op: 'edge', id: 'e-f2' },

  // ── 查证：连上一条之前没注意的关系，矛盾解开 ────────────
  { t: 17600, op: 'focus', id: 's4', zoom: 1.3 },
  { t: 18300, op: 'edge', id: 'e-x1' },
  { t: 18900, op: 'focus', id: 's9', zoom: 1.3 },
  { t: 19500, op: 'state', id: 's4', state: 'ok' },
  { t: 19800, op: 'state', id: 's7', state: 'ok' },

  // ── 收敛：所有东西向中心塌缩成一个答案 ──────────────────
  { t: 20400, op: 'focus', id: 'root', zoom: 0.55 },
  { t: 21000, op: 'converge', to: 0.42, dur: 2800 },
  { t: 24000, op: 'answer', title: ANSWER.title, lines: ANSWER.lines },
  { t: 24600, op: 'focus', id: 'root', zoom: 1.15 },
  { t: 27000, op: 'end' },
]
