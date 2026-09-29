/**
 * B4 · Chronicle —— 剧本
 *
 * 核心命题：
 *   传统聊天记录里，「时间」是丢失的。
 *   每条消息占一样的空间，不管它花了 0.2 秒还是 40 秒。
 *   于是你永远看不出：Agent 把时间花在哪了。
 *
 * 这个实验里：**时间不是序号，是长度。**
 *   X 轴 = 真实毫秒。一根条的长度 = 它真的花了多久。
 *   并行的三路调研 → 三条泳道，上下对齐，一眼看出谁慢。
 *
 * 整张图是当前时刻 t 的纯函数：条从 start 长到 min(t, end)，播放头在 t。
 * 所以「拖动播放头」就等于时间旅行 —— 不需要另一套渲染逻辑。
 */

export type SegKind = 'run' | 'fail' | 'retry'

export interface Segment {
  label: string
  start: number
  end: number
  kind?: SegKind
  detail?: string
}

export interface Lane {
  id: string
  label: string
  /** 归到某个并行组 */
  group?: string
  note?: string
  segments: Segment[]
}

export interface Group { id: string; label: string; lanes: string[] }
export interface Marker { t: number; label: string; text: string }

export const ASK = '帮我调研一下向量数据库，选一个合适的'
export const TOTAL = 23700

export const EVAL_GROUP: Group = { id: 'evaluate', label: '并行调研', lanes: ['milvus', 'qdrant', 'pgvector'] }

export const LANES: Lane[] = [
  {
    id: 'understand',
    label: '理解需求',
    note: '拆成 4 个步骤，识别出「选型」意图',
    segments: [{ label: '拆解', start: 0, end: 1400, detail: '拆成 4 个步骤，识别出「选型」意图' }],
  },
  {
    id: 'search',
    label: '搜索资料',
    note: '12 个来源，去重后 8 个',
    segments: [
      { label: '检索', start: 1400, end: 3200, detail: '找到 12 个来源' },
      { label: '去重', start: 3200, end: 4200, detail: '合并同一篇的多个转载，剩下 8 个' },
    ],
  },
  {
    id: 'filter',
    label: '筛选候选',
    note: '从 8 个收敛到 3 个',
    segments: [{ label: '打分', start: 4200, end: 6000, detail: '按生态 / 性能 / 成本打分，收敛到 3 个候选' }],
  },

  // ── 并行调研：三条泳道，上下对齐 ──────────────────────────
  {
    id: 'milvus',
    label: 'Milvus',
    group: 'evaluate',
    note: '生态最全，但 benchmark 只覆盖到 2.4.x',
    segments: [
      { label: '检索文档', start: 6000, end: 8400, detail: '官方文档 + 12 篇实践文章' },
      { label: '读 benchmark', start: 8400, end: 11500, detail: 'ANN-Benchmarks 只覆盖到 2.4.x' },
      { label: '核对版本', start: 11500, end: 14200, detail: '当前稳定版 2.5.3，结论仍然成立' },
    ],
  },
  {
    id: 'qdrant',
    label: 'Qdrant',
    group: 'evaluate',
    note: '这一步明显比别人慢 —— 它在读一篇 40 页的 benchmark',
    segments: [
      { label: '检索文档', start: 6600, end: 8400, detail: '官方文档 + 9 篇实践文章' },
      { label: '读 benchmark', start: 8400, end: 13000, detail: '40 页的 ANN 对比报告 —— 全片最慢的一步' },
      { label: '核对版本', start: 13000, end: 15800, detail: '1.12 引入的新索引结构，实测有效' },
    ],
  },
  {
    id: 'pgvector',
    label: 'pgvector',
    group: 'evaluate',
    note: '一次失败 + 一次重试',
    segments: [
      { label: '检索文档', start: 6200, end: 7600, detail: '官方 README + 5 篇实践文章' },
      { label: '读 benchmark', start: 7600, end: 9800, detail: 'README 里的基准测试' },
      { label: '核对版本', start: 9800, end: 11000, kind: 'fail', detail: '文档对应 0.7，仓库已经到 0.8 —— 结论作废' },
      { label: '重试', start: 11200, end: 12600, kind: 'retry', detail: '按 0.8 的分支重新核对，通过' },
    ],
  },

  {
    id: 'compare',
    label: '对比分析',
    note: '把三个候选的指标口径拉平',
    segments: [{ label: '横向对比', start: 16500, end: 19500, detail: '统一 QPS / 召回率 / 内存的口径后重新排序' }],
  },
  {
    id: 'write',
    label: '生成报告',
    note: '结论：Qdrant',
    segments: [{
      label: '撰写',
      start: 19500,
      end: 23700,
      detail: '推荐 Qdrant —— 同样召回率下 QPS 高 1.8 倍，内存少 40%。Milvus 生态更全但更重；pgvector 够用，但要自己扛 PG 运维。',
    }],
  },
]

export const MARKERS: Marker[] = [
  { t: 0, label: '提问', text: ASK },
  { t: 15800, label: '汇总', text: '三个候选评估完毕' },
  { t: 23700, label: '完成', text: '报告已生成' },
]

/** 时间轴上明显的空档 —— 聊天记录里看不到的东西 */
export const GAPS = [{ start: 15800, end: 16500, label: '空档 0.7s' }]

export function laneSpan(l: Lane) {
  return { start: l.segments[0].start, end: l.segments[l.segments.length - 1].end }
}

export function laneAt(t: number): { lane: Lane; seg: number } | null {
  for (const l of LANES) {
    for (let i = 0; i < l.segments.length; i++) {
      const s = l.segments[i]
      if (t >= s.start && t < s.end) return { lane: l, seg: i }
    }
  }
  return null
}

export function breadcrumb(lane: Lane): string {
  return lane.group ? EVAL_GROUP.label + ' › ' + lane.label : lane.label
}
