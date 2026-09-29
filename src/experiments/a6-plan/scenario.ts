/**
 * A6 · The Plan —— 剧本
 *
 * Agent 已经开干了，你才发现它理解错了，除了打断重来还能怎么办？
 *
 * 这一版把计划从「一列待办」改成一条**横向时间轴**：
 * 每一步是一根横条，摆它在时间上的真实位置 —— 什么时候开始、
 * 干多久、跟谁连着。改一步的代价因此是看得见的：后面的条整排往右挪。
 *
 * 「涟漪」不是形容词，是依赖链真的重算了一遍。
 *
 * t 是毫秒，总长 26.8 秒（改过一步之后会变长）。
 */

export interface Step {
  id: string
  label: string
  /** 开始时刻，毫秒；由依赖链算出来，不手写 */
  start: number
  /** 时长，毫秒 */
  dur: number
  /** 已经跑了多少毫秒；进度条读它 */
  run: number
  /** 依赖哪一步 —— 它落地了这一步才开始 */
  after?: string
  state: 'pending' | 'running' | 'done'
  note?: string
}

export interface P6State {
  steps: Step[]
  /** 改动之后整条计划有多长 */
  total: number
  /** 刚被改过的那一步，用来在轴上标一下 */
  edited?: string
}

export type Beat =
  | { t: number; op: 'plan'; steps: Step[] }
  | { t: number; op: 'run'; id: string }
  | { t: number; op: 'done'; id: string; note?: string }
  /** 理解错了，改的是还在跑的那一步 */
  | { t: number; op: 'fix'; id: string; label: string; add: number }
  | { t: number; op: 'end' }

export const TOTAL = 26800

const S = (
  id: string, label: string, dur: number, after?: string, note?: string,
): Step => ({ id, label, dur, after, note, start: 0, run: 0, state: 'pending' })

export const PLAN: Step[] = [
  S('s1', '读整个仓库的结构', 3800, undefined, '知道东西都在哪'),
  S('s2', '定位登录页那几个文件', 4600, 's1', 'src/pages/login/*'),
  S('s3', '按你说的改样式', 6200, 's2'),
  S('s4', '补上改动的测试', 5400, 's3'),
  S('s5', '跑一遍 build 和类型检查', 4200, 's4'),
]

export const SCENARIO: Beat[] = [
  { t: 0, op: 'plan', steps: PLAN.map((s) => ({ ...s })) },
  { t: 0, op: 'run', id: 's1' },
  { t: 3800, op: 'done', id: 's1', note: '63 个文件，前端在 src/' },
  { t: 3800, op: 'run', id: 's2' },
  { t: 8400, op: 'done', id: 's2', note: 'src/pages/login' },
  { t: 8400, op: 'run', id: 's3' },

  // 你看到它跑起来了才反应过来：说的是注册页，不是登录页。
  // 这一步要改的东西变多了（+2600ms），后面两步整排往右挪 —— 这就是涟漪。
  { t: 11000, op: 'fix', id: 's3', label: '按你说的改注册页样式', add: 2600 },

  { t: 17200, op: 'done', id: 's3', note: '改了 5 个文件' },
  { t: 17200, op: 'run', id: 's4' },
  { t: 22600, op: 'done', id: 's4', note: '12 个用例' },
  { t: 22600, op: 'run', id: 's5' },
  { t: 26800, op: 'done', id: 's5', note: 'build 通过' },
  { t: 26800, op: 'end' },
]

/**
 * 依赖链重算：某一步变长（或变短），后面凡是挂在它后面的都跟着挪。
 * 这是这个模板唯一真的在计算的东西 —— 涟漪不能是演出来的。
 */
export function reflow(steps: Step[]): Step[] {
  const by = new Map(steps.map((s) => [s.id, s]))
  const end = (s: Step): number => {
    const a = s.after ? by.get(s.after) : undefined
    return (a ? end(a) : 0) + s.dur
  }
  for (const s of steps) {
    const a = s.after ? by.get(s.after) : undefined
    s.start = a ? end(a) : 0
  }
  return steps
}

export const planTotal = (steps: Step[]) =>
  steps.reduce((m, s) => Math.max(m, s.start + s.dur), 0)

export const fmtS = (ms: number) => (ms / 1000).toFixed(1) + 's'
