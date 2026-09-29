/**
 * 012 · The Plan —— 剧本
 *
 * 问题：Agent 已经开干了，你才发现它理解错了。除了「打断重来」，还能怎么办？
 *
 * 观点：计划本身就是界面，而且它是活的。
 *       你改任何一步，Agent 当场重排 —— 关键是要让你看见「为什么重排这几步」。
 *
 * 涟漪是算出来的，不是演的：每一步声明自己依赖哪几步，
 * 改一步就沿着依赖关系往下找，找出来的就是要作废的。
 *
 * t 是毫秒，总长 23 秒。
 */

export type StepState = 'pending' | 'running' | 'done' | 'asking' | 'stale'

export interface Step {
  id: string
  no: number
  title: string
  detail: string
  state: StepState
  /** 依赖哪几步的产出 */
  deps: string[]
  output?: string
  note?: string
  items?: { label: string; state: 'done' | 'running' | 'pending' }[]
  question?: string
  options?: string[]
  answer?: string
}

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send' }
  | { t: number; op: 'intro'; text: string }
  | { t: number; op: 'plan' }
  | { t: number; op: 'step'; id: string; patch: Partial<Step> }
  | { t: number; op: 'items'; id: string; labels: string[] }
  | { t: number; op: 'item'; id: string; i: number; state: 'done' | 'running' }
  | { t: number; op: 'ask'; id: string; question: string; options: string[] }
  | { t: number; op: 'answer'; id: string; text: string }
  | { t: number; op: 'ripple'; id: string; summary: string }
  | { t: number; op: 'apply' }
  | { t: number; op: 'result'; title: string; desc: string; meta: string }
  | { t: number; op: 'end' }

export const TOTAL = 23000
export const DEFAULT_ASK = '帮我研究国内 AI Agent 开发平台，比较 20 个项目，给我一份报告'

export const PLAN: Step[] = [
  { id: 's1', no: 1, title: '确定比较维度', detail: '列出后面用来横向对比的几个维度', state: 'pending', deps: [] },
  { id: 's2', no: 2, title: '搜索并筛选候选', detail: '找到 20 个符合条件的开发平台', state: 'pending', deps: [] },
  { id: 's3', no: 3, title: '逐个收集信息', detail: '按第一步定下的维度，把每个项目填满', state: 'pending', deps: ['s2'] },
  { id: 's4', no: 4, title: '横向对比', detail: '拉成一张表，标出信息冲突的地方', state: 'pending', deps: ['s1', 's3'] },
  { id: 's5', no: 5, title: '生成报告', detail: '把对比结果写成一份带出处的报告', state: 'pending', deps: ['s4'] },
]

/**
 * 改某一步会让哪些步骤作废。
 * 沿着 deps 往下找，传递闭包。只算一次，不递归去重。
 */
export function ripple(steps: Step[], id: string): string[] {
  const hit = new Set<string>()
  let frontier = [id]
  while (frontier.length) {
    const next: string[] = []
    for (const s of steps) {
      if (s.id === id || hit.has(s.id)) continue
      if (s.deps.some((d) => frontier.includes(d))) { hit.add(s.id); next.push(s.id) }
    }
    frontier = next
  }
  return [...hit]
}

export const SCENARIO: Beat[] = [
  { t: 600, op: 'type', text: DEFAULT_ASK, dur: 2200 },
  { t: 3000, op: 'send' },
  { t: 3300, op: 'intro', text: '这个任务我先拆成五步。任何一步你都可以当场改，改了我立刻重排。' },
  { t: 4200, op: 'plan' },

  { t: 4600, op: 'step', id: 's1', patch: { state: 'running' } },
  { t: 6000, op: 'step', id: 's1', patch: { state: 'done', output: '技术路线 / 商业模式 / 开源生态 / 定价' } },

  { t: 6200, op: 'step', id: 's2', patch: { state: 'running', note: '已找到 8 个' } },
  { t: 7400, op: 'items', id: 's2', labels: ['Dify', 'Coze', 'LangChain', 'Flowise', 'n8n', 'AutoGen'] },

  { t: 8400, op: 'ask', id: 's2', question: '这 8 个里有 5 个是 API 框架（LangChain、AutoGen 这类），3 个是应用平台（Dify、Coze）。你说的「开发平台」指哪一类？', options: ['都算', '只算应用平台', '只算框架'] },
  { t: 10800, op: 'answer', id: 's2', text: '只算应用平台' },
  { t: 11100, op: 'ripple', id: 's2', summary: '口径改了：③④⑤ 要重做，① 不受影响' },
  { t: 12800, op: 'apply' },

  { t: 13200, op: 'step', id: 's2', patch: { state: 'done', note: undefined, items: undefined, output: '20 个应用平台' } },
  { t: 13400, op: 'step', id: 's3', patch: { state: 'running' } },
  { t: 15200, op: 'step', id: 's3', patch: { state: 'done', output: '20 个项目 × 4 个维度' } },
  { t: 15400, op: 'step', id: 's4', patch: { state: 'running' } },
  { t: 17000, op: 'step', id: 's4', patch: { state: 'done', output: '一张对比表 · 2 处信息冲突' } },
  { t: 17200, op: 'step', id: 's5', patch: { state: 'running' } },
  { t: 19000, op: 'step', id: 's5', patch: { state: 'done', output: '报告已生成' } },
  { t: 19400, op: 'result', title: '国内 AI Agent 开发平台对比.md', desc: '20 个平台 · 4 个维度 · 2 处冲突已标注', meta: '18.4 KB' },
  { t: 23000, op: 'end' },
]
