/**
 * 008 · Baseline —— 剧本
 *
 * 通用聊天式 Agent 界面的演示脚本。它不是这个实验的「主角」——
 * 主角是用户打开产品时看到的那些东西：欢迎态、无气泡的对话、悬浮输入框、克制的执行状态。
 *
 * 所以这个实验默认不自动播放。用户先看到的是空状态，点播放才开始演示。
 *
 * t 是毫秒，总长 17 秒。
 */

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'table'; head: string[]; rows: string[][] }

export type ActState = 'pending' | 'running' | 'done'

export interface Act { id: string; label: string; state: ActState; note?: string }

export interface Msg {
  id: string
  role: 'user' | 'agent'
  /** 用户消息只有一句；Agent 消息是一串 block */
  text?: string
  blocks?: Block[]
  /** 正在流式接收的 block 下标，-1 表示写完了 */
  streaming?: number
  acts?: Act[]
  actsOpen?: boolean
  done?: boolean
}

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send' }
  | { t: number; op: 'acts'; id: string; labels: string[] }
  | { t: number; op: 'act'; id: string; i: number; state: ActState; note?: string }
  | { t: number; op: 'block'; id: string; block: Block }
  | { t: number; op: 'streaming'; id: string; index: number }
  | { t: number; op: 'finish'; id: string }
  | { t: number; op: 'openActs'; id: string; open: boolean }
  | { t: number; op: 'end' }

export const TOTAL = 17000
export const DEFAULT_ASK = '帮我把这份季度报告读一下，提炼三个关键点'

export const AGENT = { name: 'Agent', model: 'Pro', initial: 'A' }

export const SUGGESTIONS = [
  { title: '读一份文档', hint: '提炼要点和结论' },
  { title: '比较两个方案', hint: '列出取舍' },
  { title: '整理会议记录', hint: '输出待办事项' },
  { title: '查一下最近的进展', hint: '给出来源' },
]

export const HISTORY: { group: string; items: { id: string; title: string; active?: boolean }[] }[] = [
  { group: '今天', items: [
    { id: 'h1', title: '季度报告要点', active: false },
    { id: 'h2', title: '周报润色', active: false },
  ] },
  { group: '昨天', items: [
    { id: 'h3', title: '竞品定价对比' },
    { id: 'h4', title: '重构方案评审' },
  ] },
  { group: '更早', items: [
    { id: 'h5', title: '用户访谈整理' },
    { id: 'h6', title: '数据口径对齐' },
    { id: 'h7', title: '上线检查清单' },
  ] },
]

export const SCENARIO: Beat[] = [
  { t: 500, op: 'type', text: DEFAULT_ASK, dur: 1800 },
  { t: 2500, op: 'send' },

  { t: 2900, op: 'acts', id: 'm1', labels: ['读取 季度报告.pdf', '分析数据', '整理结论'] },
  { t: 3200, op: 'act', id: 'm1', i: 0, state: 'running' },
  { t: 5200, op: 'act', id: 'm1', i: 0, state: 'done', note: '41 页' },
  { t: 5400, op: 'act', id: 'm1', i: 1, state: 'running' },
  { t: 7400, op: 'act', id: 'm1', i: 1, state: 'done', note: '12 张表' },
  { t: 7600, op: 'act', id: 'm1', i: 2, state: 'running' },

  { t: 8000, op: 'block', id: 'm1', block: { kind: 'p', text: '读完了。这份季报的信息密度不低，但真正影响决策的只有三点：' } },
  { t: 8600, op: 'streaming', id: 'm1', index: 0 },
  { t: 10100, op: 'block', id: 'm1', block: { kind: 'ol', items: [
    '营收环比 +12%，但增量几乎全部来自华东一条产品线',
    '毛利率掉了 2.4 个点，主要原因是新客户的获客成本',
    '研发投入占比首次超过 20%，和去年同期的 14% 相比是结构性变化',
  ] } },
  { t: 10800, op: 'streaming', id: 'm1', index: 1 },
  { t: 13400, op: 'act', id: 'm1', i: 2, state: 'done', note: '17s' },
  { t: 13600, op: 'block', id: 'm1', block: { kind: 'quote', text: '第二点在原文里只出现在附注 4，正文没有提。如果你要拿这份报告去汇报，这一条值得单独说。' } },
  { t: 14300, op: 'streaming', id: 'm1', index: 2 },
  { t: 15900, op: 'finish', id: 'm1' },
  { t: 16300, op: 'openActs', id: 'm1', open: false },
  { t: 17000, op: 'end' },
]
