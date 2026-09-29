/**
 * 011 · Bubble —— 剧本
 *
 * 问题：如果 Agent 就长成你最熟悉的那个聊天软件的样子呢？
 *
 * 观点：微信早就有一套完整的词汇描述「异步、会失败、需要等待」的通信。
 *       Agent 正好塞得进去，一条新的界面语言都不用发明。
 *
 *        正在输入    → 标题栏的「对方正在输入…」
 *        工具调用    → 居中灰底的系统消息
 *        产出        → 会话里的文件卡片
 *        失败 / 降级 → 系统消息里直说
 *        时间        → 每条消息下面
 *
 * t 是毫秒，总长 22 秒。
 */

export interface Card {
  icon: 'file' | 'doc'
  title: string
  desc: string
  meta: string
}

export type MsgState = 'sending' | 'sent' | 'failed'

export interface Msg {
  kind: 'msg'
  id: string
  from: 'me' | 'agent'
  text?: string
  card?: Card
  time: string
  state: MsgState
  /** 首次出现的毫秒时刻，用于入场动画 */
  t: number
}

export interface Sys {
  kind: 'system'
  id: string
  text: string
  time: string
  t: number
}

export type Item = Msg | Sys

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send'; id: string; from: 'me' | 'agent'; text?: string; card?: Card; time: string }
  | { t: number; op: 'recv'; id: string; from: 'me' | 'agent'; text?: string; card?: Card; time: string }
  | { t: number; op: 'sys'; id: string; text: string; time: string }
  | { t: number; op: 'typed'; id: string; state: 'sending' | 'sent' | 'failed' }
  | { t: number; op: 'typing'; on: boolean }
  | { t: number; op: 'end' }

export const TOTAL = 22000
export const DEFAULT_ASK = '帮我把这份季度报告读一下，提炼三个关键点'

export const ME = { name: '陈晨', initial: '陈', color: '#4a6fa5' }
export const AGENT = { name: '研究员小助手', initial: '研', color: '#3f7f5f' }

export const CHATS: { id: string; name: string; last: string; time: string; unread?: number; initial: string; color: string; active?: boolean }[] = [
  { id: 'c1', name: '研究员小助手', last: '已发送「复盘要点.md」', time: '15:31', initial: '研', color: '#3f7f5f', active: true },
  { id: 'c2', name: '文件传输助手', last: '复盘要点.md', time: '15:31', initial: '文', color: '#5a8fbf' },
  { id: 'c3', name: '产品组', last: '李工：明早十点评审', time: '14:02', unread: 3, initial: '产', color: '#a8712c' },
  { id: 'c4', name: '周然', last: '收到，我看下', time: '11:47', initial: '周', color: '#8a5fa8' },
  { id: 'c5', name: '数据平台', last: '你的导出任务已完成', time: '10:15', initial: '数', color: '#4f8a63' },
  { id: 'c6', name: '设计评审群', last: '王：这版我同意', time: '昨天', initial: '设', color: '#b0553f' },
  { id: 'c7', name: '张一鸣', last: '[图片]', time: '昨天', initial: '张', color: '#3f7f8a' },
]

export const SCENARIO: Beat[] = [
  { t: 600, op: 'sys', id: 's0', text: '你已添加了「研究员小助手」，现在可以开始聊天了', time: '15:24' },

  { t: 1800, op: 'type', text: DEFAULT_ASK, dur: 2000 },
  { t: 4000, op: 'send', id: 'm1', from: 'me', text: DEFAULT_ASK, time: '15:24' },

  { t: 4300, op: 'typing', on: true },
  { t: 5200, op: 'sys', id: 's1', text: '正在读取「季度报告.pdf」', time: '15:24' },
  { t: 7400, op: 'sys', id: 's2', text: '已读取 41 页 · 12 张表', time: '15:24' },
  { t: 7800, op: 'typing', on: false },

  { t: 8100, op: 'recv', id: 'm2', from: 'agent', text: '读完了。这份季报的信息密度不低，但真正影响决策的只有三点：', time: '15:25' },
  { t: 9200, op: 'recv', id: 'm3', from: 'agent', text: '1. 营收环比 +12%，但增量几乎全部来自华东一条产品线\n2. 毛利率掉了 2.4 个点，主要原因是新客户的获客成本\n3. 研发投入占比首次超过 20%', time: '15:25' },
  { t: 10800, op: 'recv', id: 'm4', from: 'agent', card: { icon: 'doc', title: '季度报告要点.md', desc: '三点结论 + 原文出处对照', meta: '4.2 KB' }, time: '15:25' },

  { t: 13000, op: 'send', id: 'm5', from: 'me', text: '第二点展开说说', time: '15:26' },
  { t: 13400, op: 'typing', on: true },
  { t: 14200, op: 'sys', id: 's3', text: '正在查找附注', time: '15:26' },
  { t: 16200, op: 'sys', id: 's4', text: '联网检索超时，改用本地资料', time: '15:26' },
  { t: 16600, op: 'typing', on: false },
  { t: 17000, op: 'recv', id: 'm6', from: 'agent', text: '第二点出自附注 4，正文一个字都没提。原文的措辞是「客户获取成本的阶段性上升」，听起来像临时的，但附表里连续三个季度都在涨。', time: '15:27' },

  { t: 19400, op: 'end' },
]
