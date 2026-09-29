/**
 * A8 · Ledger —— 剧本
 *
 * 一个搜索型 Agent 的答案，凭什么可信？
 *
 * 这一版的骨架是「中央阅读运河 + 页边注」：正文占中间一列，
 * 每句话后面的编号是上标，出处卡片浮在正文右侧的页边空白处，
 * 跟引用它的那一段齐平 —— 顺着编号能一路查到底，不用在两栏之间来回跳。
 *
 * 刻意保留了一段「需要注意的一处分歧」：两份来源对同一件事给了相反的
 * 建议。界面不替 Agent 掩饰证据强度的差异，这是可信的前提。
 *
 * t 是毫秒，总长 22 秒。
 */

export interface Source {
  n: number
  title: string
  domain: string
  /** 验完了才是可信的 */
  state: 'verifying' | 'ok'
  /** 被引用了几次 */
  hits: number
}

export interface Para {
  text: string
  cites: number[]
  /** 这一段是「有分歧」的那一段 */
  warn?: boolean
}

export interface L8State {
  /** 已经浮现到第几段 */
  shown: number
  sources: Source[]
  /** 追问与续答 */
  follow: { q: string; a: string }[]
  /** 正在高亮第几个出处 */
  hl: number | null
}

export type Beat =
  | { t: number; op: 'para' }
  | { t: number; op: 'src'; n: number }
  | { t: number; op: 'follow'; q: string; a: string }
  | { t: number; op: 'end' }

export const TOTAL = 22000

export const QUERY = '2026 年主流的 AI Agent 界面，主要分成哪几种骨架？'

export const SOURCES: Source[] = [
  { n: 1, title: 'Best AI agent UI examples in 2026', domain: 'aydesign.ai', state: 'verifying', hits: 2 },
  { n: 2, title: '16 AI agent UI design patterns', domain: 'setproduct.com', state: 'verifying', hits: 3 },
  { n: 3, title: 'ChatGPT — 对话为主轴的界面', domain: 'openai.com', state: 'verifying', hits: 1 },
  { n: 4, title: 'Claude — Artifacts 侧栏', domain: 'anthropic.com', state: 'verifying', hits: 2 },
  { n: 5, title: 'Introducing Canvas', domain: 'openai.com', state: 'verifying', hits: 1 },
  { n: 6, title: 'Antigravity — Manager Surface', domain: 'antigravity.google', state: 'verifying', hits: 2 },
  { n: 7, title: 'Linear — Priority Inbox', domain: 'linear.app', state: 'verifying', hits: 1 },
  { n: 8, title: 'Cursor — 并行 agent 面板', domain: 'cursor.com', state: 'verifying', hits: 1 },
]

export const PARAS: Para[] = [
  {
    text: '大致分成三种骨架：以对话为主轴的、以产物为主轴的、以状态为主轴的。[1][2] 划分的依据不是好不好看，而是「用户在等的那件事」是什么。',
    cites: [1, 2],
  },
  {
    text: '第一种最普遍：一问一答往下滚，Agent 的推理和工具调用折叠在回答里面。ChatGPT 和 Claude 的网页版都是这一路，区别只在于过程露多少。[3]',
    cites: [3],
  },
  {
    text: '第二种把产出物抬到跟对话平级：Claude 的 Artifacts 和 ChatGPT 的 Canvas 都是右边开一块面板，报告、表格、可运行的页面直接能在里面改。[4][5] 适合产出本身就是文档的场景。',
    cites: [4, 5],
  },
  {
    text: '第三种是今年才成形的：一次派出好几个 Agent，界面主角不再是任何一段对话，而是「它们各自到哪了」——Antigravity 的 Manager Surface 就是这么做的。[6]',
    cites: [6],
  },
  {
    text: '需要注意的一处分歧：多 Agent 并行时，到底该不该给用户一个总览界面？Linear 那一路主张把待处理的事收成一个收件箱，一次只让你看一件；[7] Cursor 那一路主张把五个 agent 的状态并排摊开。[8] 两份来源都没有给对方让路，所以这里不替你选。',
    cites: [7, 8],
    warn: true,
  },
]

export const SCENARIO: Beat[] = [
  { t: 400, op: 'para' },
  { t: 900, op: 'src', n: 1 },
  { t: 1400, op: 'src', n: 2 },

  { t: 3400, op: 'para' },
  { t: 4100, op: 'src', n: 3 },

  { t: 6800, op: 'para' },
  { t: 7600, op: 'src', n: 4 },
  { t: 8300, op: 'src', n: 5 },

  { t: 10800, op: 'para' },
  { t: 11600, op: 'src', n: 6 },

  // 有分歧的那一段，两个来源挨着点亮，但都不替它背书
  { t: 14400, op: 'para' },
  { t: 15300, op: 'src', n: 7 },
  { t: 16000, op: 'src', n: 8 },

  // 追问续在正文下面，不是另开一轮
  { t: 18600, op: 'follow', q: '那我该按哪种做？', a: '看你用户在等的那一件事是什么：等一句话就选第一种，等一份文档选第二种，等好几件事同时落地选第三种。' },
  { t: 22000, op: 'end' },
]

/** 把正文里的 [n] 切成普通文本和角标 */
export function sliceCites(text: string): ({ t: 's'; v: string } | { t: 'c'; v: number })[] {
  const out: ({ t: 's'; v: string } | { t: 'c'; v: number })[] = []
  const re = /\[(\d+)\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: 's', v: text.slice(last, m.index) })
    out.push({ t: 'c', v: Number(m[1]) })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ t: 's', v: text.slice(last) })
  return out
}
