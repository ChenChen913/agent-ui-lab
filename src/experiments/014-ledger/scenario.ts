/**
 * 014 · Ledger —— 剧本
 *
 * 回答的问题：一个搜索型 Agent 的答案，凭什么可信？
 *
 * 答案页的主角是「出处」。正文是衬线的长文，每个关键数字后面跟着一个
 * 等宽小角标；右栏是全部来源，谁被正文引用了谁才有青绿色。
 * 悬停角标亮来源，悬停来源亮角标 —— 每一句都能顺着编号查到底。
 *
 * 和 008 里「搜索是过程的一步」不同：这里检索不是过程，是证据链本身。
 * 灵感来自 Perplexity 的答案页。
 *
 * t 是毫秒，总长 22 秒。
 */

export type SrcState = 'reading' | 'verified'

export interface Src {
  n: number
  domain: string
  title: string
  state: SrcState
  /** 被正文引用的次数，verified 之后统计 */
  cites: number
}

export interface LBlock {
  id: string
  kind: 'h' | 'p' | 'li'
  /** 正文。‹n› 是引用角标标记 */
  text: string
  state: 'writing' | 'done'
}

export interface LgState {
  srcs: Src[]
  blocks: LBlock[]
  /** 当前高亮的来源编号 */
  hl: number | null
  /** 用户追问 */
  typed: string
  asked: { q: string; a: string; cites: number[] }[]
}

export type Beat =
  | { t: number; op: 'src'; n: number; domain: string; title: string }
  | { t: number; op: 'ok'; n: number }
  | { t: number; op: 'block'; id: string; kind: LBlock['kind']; text: string }
  | { t: number; op: 'doneBlock'; id: string }
  | { t: number; op: 'end' }

export const TOTAL = 22000

export const QUERY = '2025 年国内新能源车市场的真实格局是什么样？'

export function fresh(): LgState {
  return { srcs: [], blocks: [], hl: null, typed: '', asked: [] }
}

const F = (n: number, domain: string, title: string) => ({ n, domain, title, state: 'reading' as const, cites: 0 })

export const SCENARIO: Beat[] = [
  { t: 500, op: 'src', n: 1, domain: 'caam.org.cn', title: '中汽协：三季度新能源汽车产销快报' },
  { t: 1000, op: 'src', n: 2, domain: 'cpcia.org.cn', title: '乘联会周度零售数据（第 39 周）' },
  { t: 1400, op: 'ok', n: 1 },
  { t: 1800, op: 'block', id: 'b0', kind: 'p', text: '2025 年前三季度，国内新能源乘用车零售 812 万辆，同比增长 24.6%‹1›。渗透率连续三个月站稳 50%，第一次被当作常态而不是新闻‹2›。' },
  { t: 3400, op: 'doneBlock', id: 'b0' },

  { t: 3800, op: 'src', n: 3, domain: 'dcdx.com', title: '20 万以上价位补能体验调研（样本 1200）' },
  { t: 4400, op: 'ok', n: 2 },
  { t: 4700, op: 'block', id: 'b1', kind: 'h', text: '三个结构性变化' },
  { t: 5000, op: 'doneBlock', id: 'b1' },
  { t: 5300, op: 'block', id: 'b2', kind: 'li', text: '价格战触底：主力车型成交价连续两个季度持平，靠降价换量的边际收益基本消失‹2›。' },
  { t: 6800, op: 'block', id: 'b3', kind: 'li', text: '补能成为决策因素：20 万以上价位，补能体验首次超过续航里程成为下单第一考量‹3›。' },
  { t: 8300, op: 'block', id: 'b4', kind: 'li', text: '出口占比翻倍：从 8.4% 升到 17.1%，但高度集中在两个区域，波动风险大‹1›。' },
  { t: 9800, op: 'doneBlock', id: 'b2' },
  { t: 10100, op: 'doneBlock', id: 'b3' },
  { t: 10400, op: 'doneBlock', id: 'b4' },

  { t: 10800, op: 'src', n: 4, domain: 'brk-research.cn', title: '三家券商三季度行业观点汇总' },
  { t: 11400, op: 'ok', n: 3 },
  { t: 11800, op: 'block', id: 'b5', kind: 'h', text: '需要注意的一处分歧' },
  { t: 12100, op: 'doneBlock', id: 'b5' },
  { t: 12400, op: 'block', id: 'b6', kind: 'p', text: '「补能超过续航」这一条目前只有单一来源，样本 1200 份、区域集中‹3›。三家券商的渠道调研都没有复现这个排序‹4›，把它当作信号，不要当作结论。' },
  { t: 14400, op: 'doneBlock', id: 'b6' },

  { t: 14800, op: 'src', n: 5, domain: 'miit.gov.cn', title: '工信部：准入与产能合规季度通报' },
  { t: 15400, op: 'src', n: 6, domain: 'export-data.cn', title: '海关总署新能源出口月度口径' },
  { t: 16200, op: 'ok', n: 5 },
  { t: 16500, op: 'ok', n: 6 },
  { t: 16800, op: 'ok', n: 4 },
  { t: 17200, op: 'block', id: 'b7', kind: 'p', text: '产能端，合规产能利用率仍在 58% 附近，新增准入连续两个季度放缓‹5›；出口的口径差异比想象大，海关口径比车企自报高约 3 个百分点‹6›，跨来源对比时要注意。' },
  { t: 19600, op: 'doneBlock', id: 'b7' },
  { t: 22000, op: 'end' },
]

export const FOLLOWUP = {
  q: '那出口这两个区域具体是哪里？',
  a: '按海关口径，增量的七成集中在比利时和英国两个中转港，其余是东南亚的组装返销‹6›。车企自报口径里这两类经常混在一起，所以自报数据整体偏低。',
  cites: [6],
}
