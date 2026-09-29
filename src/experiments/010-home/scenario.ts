/**
 * 010 · Home —— 剧本
 *
 * 下一代 AI Operating System 的感觉。和 008 / 009 最大的区别：
 *   1. 首页就是这个产品本身 —— 居中的问候 + 建议操作 + 一个 OS 级输入框
 *   2. Agent 状态是一行微小的指示器，做完自动收起，不是面板
 *   3. 右侧是 Context（它用了什么），默认收起
 *
 * t 是毫秒，总长 19 秒。
 */

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'quote'; text: string }

export type StepState = 'pending' | 'running' | 'done'
export interface Step { id: string; label: string; state: StepState }

export interface Msg { id: string; role: 'user' | 'agent'; text?: string; blocks?: Block[]; streaming?: number; done?: boolean }

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send' }
  | { t: number; op: 'steps'; labels: string[] }
  | { t: number; op: 'step'; i: number; state: StepState }
  | { t: number; op: 'block'; id: string; block: Block }
  | { t: number; op: 'streaming'; id: string; index: number }
  | { t: number; op: 'finish'; id: string }
  | { t: number; op: 'ctx'; files?: number; sources?: number; tools?: number; memory?: boolean }
  | { t: number; op: 'end' }

export const TOTAL = 19000
export const DEFAULT_ASK = '帮我看看固态电池最近有什么进展'
export const AGENT = { name: 'Halo' }

export const SUGGESTIONS = [
  { k: 'research', title: '研究一件事', hint: 'Research something' },
  { k: 'doc', title: '分析一份文档', hint: 'Analyze a document' },
  { k: 'plan', title: '规划一个项目', hint: 'Plan a project' },
  { k: 'kb', title: '查我的知识库', hint: 'Search my knowledge' },
  { k: 'make', title: '创作点什么', hint: 'Create something' },
]

export const NAV = [
  { id: 'home', label: '首页' },
  { id: 'tasks', label: '任务' },
  { id: 'lib', label: '资料库' },
  { id: 'mem', label: '记忆' },
]

export const SCENARIO: Beat[] = [
  { t: 500, op: 'type', text: DEFAULT_ASK, dur: 1800 },
  { t: 2500, op: 'send' },

  { t: 2900, op: 'steps', labels: ['思考', '搜索网络', '阅读资料', '整理结论'] },
  { t: 3100, op: 'step', i: 0, state: 'running' },
  { t: 4100, op: 'step', i: 0, state: 'done' },
  { t: 4300, op: 'step', i: 1, state: 'running' },
  { t: 4700, op: 'ctx', sources: 2 },
  { t: 6600, op: 'step', i: 1, state: 'done' },
  { t: 6800, op: 'step', i: 2, state: 'running' },
  { t: 7200, op: 'ctx', files: 3 },
  { t: 9400, op: 'step', i: 2, state: 'done' },
  { t: 9600, op: 'step', i: 3, state: 'running' },
  { t: 9800, op: 'ctx', tools: 1 },

  { t: 10200, op: 'block', id: 'm1', block: { kind: 'p', text: '固态电池这半年有三件事值得注意，按确定性从高到低：' } },
  { t: 10800, op: 'streaming', id: 'm1', index: 0 },
  { t: 12400, op: 'block', id: 'm1', block: { kind: 'ul', items: [
    '半固态已经量产上车，但成本仍是液态的 1.8 倍，目前只出现在两个高端车型上',
    '硫化物路线的专利数量第一次超过氧化物，方向开始收敛',
    '全固态的量产时间表普遍往后推了一年，最新口径是 2028 年小批量',
  ] } },
  { t: 13100, op: 'streaming', id: 'm1', index: 1 },
  { t: 16000, op: 'step', i: 3, state: 'done' },
  { t: 16200, op: 'block', id: 'm1', block: { kind: 'quote', text: '第二条我只有两个来源，其中一个是厂商自己发的，参考价值有限。' } },
  { t: 16800, op: 'streaming', id: 'm1', index: 2 },
  { t: 18600, op: 'finish', id: 'm1' },
  { t: 18900, op: 'ctx', memory: true },
  { t: 19000, op: 'end' },
]
