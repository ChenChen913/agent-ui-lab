/**
 * 009 · Workbench —— 剧本
 *
 * 「聊天 + 工作状态」双层结构：左边是对话，右边是 Workspace。
 * 重点不是聊天，是让用户看见 Agent 到底在干什么、以及产出了什么。
 *
 * 这一版的关键时刻：报告不是「最后一条消息」，它出现在右边的 Workspace 里，边写边长。
 *
 * t 是毫秒，总长 21 秒。
 */

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'quote'; text: string }

export type ActState = 'pending' | 'running' | 'done'
export interface Act { id: string; label: string; state: ActState; note?: string }

export interface Msg {
  id: string; role: 'user' | 'agent'
  text?: string
  blocks?: Block[]
  streaming?: number
  acts?: Act[]
  actsOpen?: boolean
  done?: boolean
}

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send' }
  | { t: number; op: 'text'; id: string; text: string }
  | { t: number; op: 'acts'; id: string; labels: string[] }
  | { t: number; op: 'act'; id: string; i: number; state: ActState; note?: string }
  | { t: number; op: 'actsOpen'; id: string; open: boolean }
  | { t: number; op: 'block'; id: string; block: Block }
  | { t: number; op: 'streaming'; id: string; index: number }
  | { t: number; op: 'finish'; id: string }
  | { t: number; op: 'ws'; open: boolean }
  | { t: number; op: 'wsTitle'; title: string }
  | { t: number; op: 'wsBlock'; block: Block }
  | { t: number; op: 'wsStream'; index: number }
  | { t: number; op: 'wsDone' }
  | { t: number; op: 'end' }

export const TOTAL = 21000
export const DEFAULT_ASK = '研究一下新能源汽车市场'
export const AGENT = { name: 'Atlas', initial: 'A' }

export const HISTORY: { group: string; items: string[] }[] = [
  { group: '进行中', items: ['新能源汽车市场'] },
  { group: '今天', items: ['竞品定价对比', '周报自动生成'] },
  { group: '昨天', items: ['重构方案评审', '用户访谈整理'] },
  { group: '更早', items: ['数据口径对齐', '上线检查清单', 'API 文档梳理'] },
]

const REPORT: Block[] = [
  { kind: 'h', text: '一、市场概况' },
  { kind: 'p', text: '2025 年前三季度，国内新能源乘用车零售 812 万辆，同比增长 24.6%，渗透率首次稳定在 50% 以上。增速比去年同期回落 9 个百分点，市场从「抢份额」转入「拼效率」。' },
  { kind: 'table', head: ['阵营', '份额', '同比'], rows: [
    ['头部三家', '48.2%', '+3.1pp'],
    ['腰部六家', '31.5%', '−1.4pp'],
    ['其余', '20.3%', '−1.7pp'],
  ] },
  { kind: 'h', text: '二、三个变化' },
  { kind: 'ul', items: [
    '价格战触底：主力车型成交价连续两个季度持平，靠降价换量的边际收益基本消失',
    '补能成为决策因素：在 20 万以上价位，补能体验首次超过续航里程',
    '出口占比翻倍：从 8.4% 升到 17.1%，但集中在两个区域',
  ] },
  { kind: 'h', text: '三、风险' },
  { kind: 'quote', text: '数据来源：中汽协月度快报、乘联会周度数据、三家券商行业报告。其中「补能体验超过续航」这一条只有单一来源（某券商 8 月消费者调研，样本 1200），证据强度不足，建议不要单独用于决策。' },
]

export const SCENARIO: Beat[] = [
  { t: 500, op: 'type', text: DEFAULT_ASK, dur: 1700 },
  { t: 2400, op: 'send' },

  { t: 2800, op: 'text', id: 'm1', text: '我先把它拆成四个方向，然后逐一去查。' },
  { t: 3500, op: 'acts', id: 'm1', labels: ['搜索网络', '阅读资料', '对比信息', '生成报告'] },
  { t: 3700, op: 'act', id: 'm1', i: 0, state: 'running' },
  { t: 5600, op: 'act', id: 'm1', i: 0, state: 'done', note: '23 条结果' },
  { t: 5800, op: 'act', id: 'm1', i: 1, state: 'running' },
  { t: 8600, op: 'act', id: 'm1', i: 1, state: 'done', note: '12 篇' },
  { t: 8800, op: 'act', id: 'm1', i: 2, state: 'running' },

  { t: 9400, op: 'block', id: 'm1', block: { kind: 'p', text: '资料够了。我边写边放到右边的 Workspace 里，你可以随时打断我。' } },
  { t: 10500, op: 'streaming', id: 'm1', index: 0 },

  { t: 10800, op: 'ws', open: true },
  { t: 11000, op: 'wsTitle', title: '新能源汽车市场 · 研究报告' },
  { t: 11400, op: 'act', id: 'm1', i: 2, state: 'done', note: '3 处出入' },
  { t: 11600, op: 'act', id: 'm1', i: 3, state: 'running' },

  { t: 12000, op: 'wsBlock', block: REPORT[0] },
  { t: 12600, op: 'wsStream', index: 0 },
  { t: 13600, op: 'wsBlock', block: REPORT[1] },
  { t: 14200, op: 'wsStream', index: 1 },
  { t: 16200, op: 'wsBlock', block: REPORT[2] },
  { t: 16800, op: 'wsStream', index: 2 },
  { t: 18600, op: 'wsBlock', block: REPORT[3] },
  { t: 19200, op: 'wsStream', index: 3 },
  { t: 20600, op: 'wsDone' },
  { t: 20800, op: 'act', id: 'm1', i: 3, state: 'done', note: '3.2s' },
  { t: 21000, op: 'end' },
]
