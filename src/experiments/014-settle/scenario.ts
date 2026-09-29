/**
 * 014 · Settle —— 剧本
 *
 * 问题：过程和结果，是两个东西，还是同一个东西的两个阶段？
 *
 * 观点：过程不是结果旁边的一份记录，过程是结果的草稿。
 *       每做完一步，那一步不是消失，而是变成文档的一部分。
 *
 * 所以这个界面里没有过程面板 —— 只有一份正在长出来的文档，
 * 每一段左边的页边标记，就是产出它的那一步。
 *
 * t 毫秒，总长 19 秒。
 */

export type BState = 'writing' | 'done' | 'dropped'
export type SState = 'pending' | 'running' | 'done' | 'dropped'

export interface Src { id: string; label: string; state: SState; count?: string }

export interface Doc {
  id: string
  kind: 'h' | 'p' | 'ul' | 'table' | 'quote'
  text?: string
  items?: string[]
  rows?: string[][]
  src: string
  state: BState
}

export type Beat =
  | { t: number; op: 'srcs'; list: [string, string][] }
  | { t: number; op: 'src'; id: string; state: SState; count?: string }
  | { t: number; op: 'doc'; id: string; kind: Doc['kind']; text?: string; items?: string[]; rows?: string[][]; src: string }
  | { t: number; op: 'block'; id: string; state: BState }
  | { t: number; op: 'end' }

export const TOTAL = 19000
export const TITLE = '国内 AI Agent 开发平台 · 调研'

export const SCENARIO: Beat[] = [
  { t: 400, op: 'srcs', list: [['s1', '搜索'], ['s2', '阅读'], ['s3', '提取'], ['s4', '对比']] },

  { t: 800, op: 'src', id: 's1', state: 'running' },
  { t: 1600, op: 'doc', id: 'd0', kind: 'h', text: '一、候选范围', src: 's1' },
  { t: 1900, op: 'block', id: 'd0', state: 'writing' },
  { t: 3000, op: 'doc', id: 'd1', kind: 'p', text: '本次纳入 8 个平台，其中 5 个是 API 框架，3 个是应用平台。范围以「能独立跑起一个 Agent 应用」为准。', src: 's1' },
  { t: 3400, op: 'block', id: 'd1', state: 'writing' },
  { t: 4400, op: 'block', id: 'd0', state: 'done' },
  { t: 4600, op: 'block', id: 'd1', state: 'done' },
  { t: 4800, op: 'src', id: 's1', state: 'done', count: '8 个结果' },

  { t: 5200, op: 'src', id: 's2', state: 'running' },
  { t: 6000, op: 'doc', id: 'd2', kind: 'h', text: '二、三个维度的差异', src: 's2' },
  { t: 6300, op: 'block', id: 'd2', state: 'writing' },
  { t: 7400, op: 'doc', id: 'd3', kind: 'ul', items: ['上手成本：应用平台平均 20 分钟能跑通，框架要 2 小时以上', '可迁移性：框架的产出更容易搬走，平台更容易被锁', '价格：三家有免费额度，两家的免费额度只够试用'], src: 's2' },
  { t: 7800, op: 'block', id: 'd3', state: 'writing' },
  { t: 9000, op: 'block', id: 'd2', state: 'done' },
  { t: 9200, op: 'block', id: 'd3', state: 'done' },
  { t: 9400, op: 'src', id: 's2', state: 'done', count: '12 篇资料' },

  { t: 9800, op: 'src', id: 's3', state: 'running' },
  { t: 10600, op: 'doc', id: 'd4', kind: 'table', rows: [['平台', '上手', '可迁移', '免费额度'], ['Dify', '20 分钟', '中', '有'], ['Coze', '15 分钟', '低', '有'], ['LangChain', '2 小时', '高', '无']], src: 's3' },
  { t: 11000, op: 'block', id: 'd4', state: 'writing' },
  { t: 12400, op: 'block', id: 'd4', state: 'done' },
  { t: 12600, op: 'src', id: 's3', state: 'done', count: '24 个字段' },

  { t: 13000, op: 'src', id: 's4', state: 'running' },
  { t: 13800, op: 'doc', id: 'd5', kind: 'quote', text: 'Dify 和 Coze 的「上手成本」在两份资料里差了 3 倍，取的是官方文档的口径，第三方实测更慢。这一条证据不足，先不下结论。', src: 's4' },
  { t: 14200, op: 'block', id: 'd5', state: 'writing' },
  { t: 15800, op: 'block', id: 'd5', state: 'done' },
  { t: 16000, op: 'src', id: 's4', state: 'done', count: '发现 2 处冲突' },
  { t: 19000, op: 'end' },
]
