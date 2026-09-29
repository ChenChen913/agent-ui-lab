/**
 * 002 · One Line —— 剧本
 *
 * 这个实验的核心隐喻：
 *   整个界面 = 一支笔在纸上画一条线。
 *   Agent 干活的过程 = 这条线被画出来的过程。
 *
 * 所以剧本里的每一拍，本质都是在描述「笔现在怎么动」。
 * 所有的 Agent 状态，都是从「线是一根有张力的弦」这一条物理规律推导出来的。
 *
 * t 是毫秒，t=0 是页面出现的瞬间。总长 23.5 秒。
 * 播放速度由外层控制（0.5x / 1x / 2x）。
 *
 * 三个重音：
 *   ① 1.65s  Pluck —— 线被拨了一下，教会观众「这条线是活的」
 *   ② 14.0s  Freeze —— 全屏彻底静止 600ms，比 001 的静场更狠
 *   ③ 20.3s  Split —— 线从中间裂开，约束在这里兑现
 */

export type Phase =
  | 'idle' | 'typing' | 'sent' | 'think' | 'search' | 'read'
  | 'parallel' | 'knot' | 'recoil' | 'write' | 'still' | 'done'

export type Beat =
  | { t: number; op: 'ask'; text: string; dur: number }
  | { t: number; op: 'send' }
  | { t: number; op: 'phase'; phase: Phase }
  | { t: number; op: 'tag'; text: string; step?: number }
  | { t: number; op: 'draw'; to: number; dur: number }
  | { t: number; op: 'inkw'; to: number; dur: number }
  | { t: number; op: 'fray'; show: boolean }
  | { t: number; op: 'strand'; i: number; to: number; dur: number }
  | { t: number; op: 'snap'; i: number; on: boolean }
  | { t: number; op: 'knot'; on: boolean }
  | { t: number; op: 'freeze'; on: boolean }
  | { t: number; op: 'open'; to: number; dur: number }
  | { t: number; op: 'reveal' }
  | { t: number; op: 'end' }

export const DEFAULT_ASK = '帮我搞清楚这个项目为什么启动这么慢'
export const TOTAL = 23500

/** 阅读阶段的段边界（占整条轨道的比例）—— 线在这里断开成 4 段 */
export const SEG_ENDS = [0.3475, 0.415, 0.4825]
/** 飞白从这一点开始（笔尖走到这里，绳子开始分叉） */
export const FRAY_AT = 0.55
/** 结打在这里 */
export const KNOT_AT = 0.72

export const RESULT = {
  title: '启动慢的主因是依赖预构建',
  items: [
    '87% 的耗时发生在首屏依赖预构建阶段',
    '冷启动与热启动差了 4.2 倍',
    '关掉 optimizeDeps.force 之后回到 1.1s',
  ],
  foot: '3 个结论 · 14 个来源 · 23.5s',
}

export const SCENARIO: Beat[] = [
  // ── 输入阶段：线就是输入框 ────────────────────────────────
  { t: 400, op: 'ask', text: DEFAULT_ASK, dur: 1150 },
  { t: 1650, op: 'send' },                                  // ⭐ 重音① Pluck
  { t: 2300, op: 'phase', phase: 'think' },
  { t: 2320, op: 'tag', text: '拆解问题', step: 1 },
  { t: 2350, op: 'draw', to: 0.10, dur: 1700 },

  // ── 搜索：两个亮点反向扫描 ────────────────────────────────
  { t: 4200, op: 'phase', phase: 'search' },
  { t: 4230, op: 'tag', text: '搜索资料', step: 2 },
  { t: 4250, op: 'draw', to: 0.28, dur: 2250 },

  // ── 阅读：线断成 4 段，每段点亮的速度都不一样 ──────────────
  { t: 6650, op: 'phase', phase: 'read' },
  { t: 6680, op: 'tag', text: '阅读 4 篇', step: 3 },
  { t: 6700, op: 'draw', to: 0.3475, dur: 700 },   // 第 1 篇
  { t: 7450, op: 'draw', to: 0.4150, dur: 1200 },  // 第 2 篇（这篇很长）
  { t: 8700, op: 'draw', to: 0.4825, dur: 600 },   // 第 3 篇
  { t: 9350, op: 'draw', to: 0.5500, dur: 900 },   // 第 4 篇

  // ── 飞白：线分成 3 根细丝，各自推进 ───────────────────────
  { t: 10600, op: 'phase', phase: 'parallel' },
  { t: 10630, op: 'tag', text: '并行核对 · 3 个方向', step: 4 },
  { t: 10650, op: 'fray', show: true },
  { t: 10700, op: 'strand', i: 0, to: 0.72, dur: 2500 },
  { t: 10700, op: 'strand', i: 1, to: 0.72, dur: 3400 },
  { t: 10700, op: 'strand', i: 2, to: 0.72, dur: 2000 },
  // 其中一根断了，又接上
  { t: 11900, op: 'tag', text: '一个方向断了' },
  { t: 11920, op: 'snap', i: 1, on: true },
  { t: 12600, op: 'tag', text: '重连中' },
  { t: 12620, op: 'snap', i: 1, on: false },

  // ── 绞合 → 打结 → 静止 ────────────────────────────────────
  { t: 13300, op: 'fray', show: false },
  { t: 13300, op: 'draw', to: 0.72, dur: 260 },
  { t: 13400, op: 'phase', phase: 'knot' },
  { t: 13430, op: 'tag', text: '两份资料冲突', step: 5 },
  { t: 13450, op: 'knot', on: true },
  { t: 14000, op: 'freeze', on: true },                     // ⭐ 重音② 全静止
  { t: 14600, op: 'freeze', on: false },

  // ── 回笔 → 重新长出去 ─────────────────────────────────────
  { t: 14700, op: 'phase', phase: 'recoil' },
  { t: 14730, op: 'tag', text: '换个角度重查' },
  { t: 14800, op: 'knot', on: false },
  { t: 14850, op: 'draw', to: 0.62, dur: 520 },
  { t: 15500, op: 'phase', phase: 'write' },
  { t: 15530, op: 'tag', text: '重新推导', step: 6 },
  { t: 15550, op: 'draw', to: 0.74, dur: 1500 },

  // ── 浓墨：加粗 + 墨流 ─────────────────────────────────────
  { t: 17100, op: 'tag', text: '生成结论', step: 7 },
  { t: 17150, op: 'inkw', to: 3, dur: 420 },
  { t: 17200, op: 'draw', to: 1, dur: 2350 },

  // ── 静场 → 裂开 ───────────────────────────────────────────
  { t: 19600, op: 'phase', phase: 'still' },
  { t: 19630, op: 'tag', text: '' },
  { t: 20300, op: 'open', to: 1, dur: 720 },                // ⭐ 重音③ Split
  { t: 21000, op: 'reveal' },
  { t: 21600, op: 'phase', phase: 'done' },
  { t: 23500, op: 'end' },
]
