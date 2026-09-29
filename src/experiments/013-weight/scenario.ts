/**
 * 013 · Weight —— 剧本
 *
 * 问题：同一块界面，面对「把这段话缩成一句」和「比较 20 个项目」，
 *       应该给出同样分量的工作过程吗？
 *
 * 观点：过程占多大分量，由「用户有多需要知道」决定，不由「Agent 做了多少」决定。
 *       而且任务的复杂度是逐步暴露的 —— Agent 一开始也不知道有多复杂。
 *
 * t 毫秒，总长 21 秒。
 */

export type Size = 'none' | 'mini' | 'band' | 'full'
export type SState = 'pending' | 'running' | 'done'

export interface SStep { label: string; state: SState; note?: string }

export interface Task {
  id: string
  ask: string
  size: Size
  steps: SStep[]
  answer?: string
  open: boolean
  /** 中途长大过 */
  grew?: boolean
  /** 强制浮上来的那一步 */
  alert?: { text: string; options: string[] }
}

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send'; id: string; ask: string }
  | { t: number; op: 'size'; id: string; size: Size; grew?: boolean }
  | { t: number; op: 'steps'; id: string; labels: string[] }
  | { t: number; op: 'step'; id: string; i: number; state: SState; note?: string }
  | { t: number; op: 'answer'; id: string; text: string; note?: string }
  | { t: number; op: 'alert'; id: string; text: string; options: string[] }
  | { t: number; op: 'clear' }
  | { t: number; op: 'end' }

export const TOTAL = 21000
export const DEFAULT_ASK = '研究国内 AI Agent 开发平台，比较 20 个项目，给我一份报告'

export const T1 = '把这段话缩成一句'
export const T2 = '把上周的三份会议记录整理成待办'
export const T3 = DEFAULT_ASK

export const SCENARIO: Beat[] = [
  { t: 500, op: 'type', text: T1, dur: 1400 },
  { t: 2100, op: 'send', id: 't1', ask: T1 },
  { t: 2400, op: 'steps', id: 't1', labels: ['理解', '压缩'] },
  { t: 2600, op: 'step', id: 't1', i: 0, state: 'running' },
  { t: 3200, op: 'step', id: 't1', i: 0, state: 'done' },
  { t: 3400, op: 'step', id: 't1', i: 1, state: 'running' },
  { t: 4200, op: 'answer', id: 't1', text: '一句话就够了：这件事先不做。', note: '2 步 · 1.4s' },
  { t: 4400, op: 'size', id: 't1', size: 'mini' },

  { t: 6200, op: 'type', text: T2, dur: 1800 },
  { t: 8200, op: 'send', id: 't2', ask: T2 },
  { t: 8500, op: 'size', id: 't2', size: 'band' },
  { t: 8700, op: 'steps', id: 't2', labels: ['读取 3 份记录', '提取待办', '合并重复项'] },
  { t: 8900, op: 'step', id: 't2', i: 0, state: 'running' },
  { t: 10200, op: 'step', id: 't2', i: 0, state: 'done', note: '3 份' },
  { t: 10400, op: 'step', id: 't2', i: 1, state: 'running' },
  { t: 11600, op: 'step', id: 't2', i: 1, state: 'done', note: '11 条' },
  { t: 11800, op: 'step', id: 't2', i: 2, state: 'running' },
  { t: 12800, op: 'step', id: 't2', i: 2, state: 'done', note: '合并掉 3 条' },
  { t: 13100, op: 'answer', id: 't2', text: '整理完了，8 条待办，其中 2 条是重复的已经合掉。', note: '3 步 · 4.6s' },
  { t: 13300, op: 'size', id: 't2', size: 'mini' },

  { t: 15200, op: 'type', text: T3, dur: 2200 },
  { t: 17600, op: 'send', id: 't3', ask: T3 },
  { t: 17900, op: 'size', id: 't3', size: 'band' },
  { t: 18100, op: 'steps', id: 't3', labels: ['确定比较维度', '搜索并筛选候选', '逐个收集信息', '横向对比', '生成报告'] },
  { t: 18300, op: 'step', id: 't3', i: 0, state: 'running' },
  { t: 19100, op: 'step', id: 't3', i: 0, state: 'done', note: '4 个维度' },

  // ── 复杂度暴露：它自己长大 ──────────────────────────────
  { t: 19300, op: 'size', id: 't3', size: 'full', grew: true },
  { t: 19600, op: 'step', id: 't3', i: 1, state: 'running' },
  { t: 20400, op: 'alert', id: 't3', text: '找到 8 个，但其中 5 个是 API 框架，3 个是应用平台。你说的「开发平台」指哪一类？', options: ['都算', '只算应用平台'] },
  { t: 21000, op: 'end' },
]
