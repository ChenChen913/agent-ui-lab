/**
 * A9 · Return —— 剧本
 *
 * 问题：用户离开 20 分钟再回来，界面上应该是什么？
 *
 * 观点：你不在的时候，Agent 的工作不该变成一条你没读过的长消息，
 *       它应该变成一份「你不在时发生了什么」的简报。
 *
 * 最要紧的一点：**你不在的这段时间是有长度的。**
 * 底部那一条细细的时间带，把 23 分钟画成了一条能看见的线。
 *
 * t 毫秒，总长 14 秒。
 */

export type Kind = 'need' | 'took' | 'ignored'

export interface Item {
  id: string
  kind: Kind
  /** 时间带上的位置，0 到 1 */
  at: number
  time: string
  text: string
  /** 需要你决定时的两个选项 */
  options?: string[]
  /** 我替你决定时的：当时摆着的是什么、选了哪个、为什么 */
  was?: { options: string[]; chose: string; why: string }
  open?: boolean
  /** 已标记「下次问我」 */
  alwaysAsk?: boolean
  answered?: string
}

export type Beat =
  | { t: number; op: 'arrive' }
  | { t: number; op: 'item'; id: string; kind: Kind; at: number; time: string; text: string; options?: string[]; was?: Item['was'] }
  | { t: number; op: 'ignored'; count: number; minutes: number }
  | { t: number; op: 'open'; id: string }
  | { t: number; op: 'end' }

export const TOTAL = 14000
export const GONE = '23 分钟'

export const SCENARIO: Beat[] = [
  { t: 500, op: 'arrive' },

  { t: 1600, op: 'item', id: 'n1', kind: 'need', at: 0.72, time: '09:56', text: '两个来源的「上手成本」差了 3 倍，用哪一个？', options: ['官方文档口径', '第三方实测'] },

  { t: 3600, op: 'item', id: 'k1', kind: 'took', at: 0.06, time: '09:39', text: '跳过了 3 个 2023 年以前的来源', was: { options: ['全用', '只用 2024 年以后的'], chose: '只用 2024 年以后的', why: '那 3 个里的产品有两个已经停止维护，写进对比会误导。' } },
  { t: 4600, op: 'item', id: 'k2', kind: 'took', at: 0.30, time: '09:45', text: '把「上手成本」从结论挪到了存疑一节', was: { options: ['直接写进结论', '标成存疑'], chose: '标成存疑', why: '同一件事在两份资料里差 3 倍，直接下结论风险太大。' } },
  { t: 5600, op: 'item', id: 'k3', kind: 'took', at: 0.50, time: '09:50', text: '换了两次搜索词，第一次的结果太杂', was: { options: ['继续用原关键词', '换词重搜'], chose: '换词重搜', why: '原关键词返回的一半是招聘信息和课程广告。' } },
  { t: 6600, op: 'item', id: 'k4', kind: 'took', at: 0.62, time: '09:53', text: '没有订阅那份付费报告，改用公开摘要', was: { options: ['订阅（需要你付款）', '用公开摘要'], chose: '用公开摘要', why: '涉及花钱的事我不替你决定。摘要里缺的那两个字段我标出来了。' } },

  { t: 8000, op: 'ignored', count: 27, minutes: 23 },
  { t: 10200, op: 'open', id: 'k2' },
  { t: 14000, op: 'end' },
]
