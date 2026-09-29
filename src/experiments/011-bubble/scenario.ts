/**
 * 011 · Bubble —— 剧本（重做版）
 *
 * 问题：如果 Agent 用最传统的那套聊天语法来表达自己呢？
 *       头像一个昵称一条气泡，谁都看得懂。
 *
 * 结构照参考图来，两个不对称是重点：
 *   1. 用户是一条窄气泡，深绿底白字
 *   2. Agent 是一块几乎占满宽度的白色内容面板 ——
 *      因为它要装的不止一句话，还有过程、列表和产物
 *
 * 时间在每条消息底部，参考图里没有，是项目自己的要求。
 *
 * t 是毫秒，总长 22 秒。
 */

export type Act = { label: string; state: 'pending' | 'running' | 'done'; note?: string }

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'acts'; acts: Act[] }
  | { kind: 'card'; title: string; desc: string; meta: string }

export interface Msg {
  id: string
  from: 'me' | 'agent'
  blocks: Block[]
  time: string
  /** 正在流式接收的块下标，-1 表示写完了 */
  streaming: number
  done: boolean
}

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send'; id: string; text: string; time: string }
  | { t: number; op: 'recv'; id: string; blocks: Block[]; time: string }
  | { t: number; op: 'push'; id: string; block: Block }
  | { t: number; op: 'stream'; id: string; index: number }
  | { t: number; op: 'act'; id: string; bi: number; ai: number; state: Act['state']; note?: string }
  | { t: number; op: 'done'; id: string }
  | { t: number; op: 'typing'; on: boolean }
  | { t: number; op: 'end' }

export const TOTAL = 19600
export const DEFAULT_ASK = '帮我把这份季度报告读一下，提炼三个关键点'

export const ME = { name: '我' }
export const AGENT = { name: '研究员小助手', initial: '研' }

/** 首屏那条：Agent 自己介绍能做什么。参考图里就是这个结构 */
const WELCOME: Block[] = [
  { kind: 'p', text: '你好！我是研究员小助手，可以帮你读文档、查资料、把结论整理成文件。🙂' },
  { kind: 'p', text: '我可以帮你做这些事：' },
  { kind: 'ul', items: [
    '**读文档**：把长报告读成三条结论，标出原文出处',
    '**查资料**：联网检索，或者只在你的资料库里找',
    '**做对比**：把两个方案摊开，列出取舍',
    '**整理成文件**：结论、表格、清单都可以导出',
    '**追问细节**：任何一句我都可以展开说',
  ] },
  { kind: 'p', text: '把文件发给我，或者直接说一句话就行。' },
]

/** 打开就该看到这条 —— 它是初始状态，不是演示的第一拍 */
export const WELCOME_MSG: Msg = {
  id: 'm0', from: 'agent', blocks: WELCOME, time: '15:24', streaming: -1, done: true,
}

export const SCENARIO: Beat[] = [
  { t: 1200, op: 'type', text: DEFAULT_ASK, dur: 1900 },
  { t: 3100, op: 'send', id: 'm1', text: DEFAULT_ASK, time: '15:24' },

  { t: 3400, op: 'typing', on: true },
  { t: 4100, op: 'recv', id: 'm2', blocks: [
    { kind: 'acts', acts: [
      { label: '读取 季度报告.pdf', state: 'running' },
      { label: '分析数据', state: 'pending' },
      { label: '整理结论', state: 'pending' },
    ] },
  ], time: '15:25' },
  { t: 5800, op: 'act', id: 'm2', bi: 0, ai: 0, state: 'done', note: '41 页' },
  { t: 6000, op: 'act', id: 'm2', bi: 0, ai: 1, state: 'running' },
  { t: 7800, op: 'act', id: 'm2', bi: 0, ai: 1, state: 'done', note: '12 张表' },
  { t: 8000, op: 'act', id: 'm2', bi: 0, ai: 2, state: 'running' },
  { t: 9200, op: 'typing', on: false },

  { t: 9600, op: 'push', id: 'm2', block: { kind: 'p', text: '读完了。这份季报的信息密度不低，但真正影响决策的只有三点：' } },
  { t: 10200, op: 'stream', id: 'm2', index: 1 },
  { t: 11400, op: 'push', id: 'm2', block: { kind: 'ol', items: [
    '营收环比 +12%，但增量几乎全部来自华东一条产品线',
    '毛利率掉了 2.4 个点，主要原因是新客户的获客成本',
    '研发投入占比首次超过 20%，和去年的 14% 相比是结构性变化',
  ] } },
  { t: 12000, op: 'stream', id: 'm2', index: 2 },
  { t: 13600, op: 'act', id: 'm2', bi: 0, ai: 2, state: 'done', note: '17s' },
  { t: 13800, op: 'push', id: 'm2', block: { kind: 'quote', text: '第二点出自附注 4，正文一个字都没提。如果你要拿这份报告去汇报，这一条值得单独说。' } },
  { t: 14400, op: 'stream', id: 'm2', index: 3 },
  { t: 16000, op: 'push', id: 'm2', block: { kind: 'card', title: '季度报告要点.md', desc: '三条结论 + 原文出处对照', meta: '4.2 KB' } },
  { t: 16600, op: 'stream', id: 'm2', index: 4 },
  { t: 17400, op: 'done', id: 'm2' },
  { t: 19600, op: 'end' },
]
