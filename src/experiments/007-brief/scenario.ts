/**
 * 007 · The Brief —— 剧本
 *
 * 核心观点：
 *   界面的主角是「这份委托」，不是「聊天记录」。
 *   对话只是把委托谈清楚的过程；谈成之后它被委托书吸收掉，消失。
 *
 * 于是这份剧本里没有一条「消息」。每一拍都在改委托书本身：
 *   加一条条款 / 把某条标成不确定 / 在某条下面提问 / 把某条改写 / 把某条划掉
 *
 * t 是毫秒，总长 26 秒。
 */

export type ClauseState = 'draft' | 'asking' | 'working' | 'done' | 'unmet' | 'error'
export type StepState = 'pending' | 'working' | 'done'
export type Stage = 'idle' | 'drafting' | 'negotiating' | 'ready' | 'working' | 'done'

export interface BStep { label: string; state: StepState }

export interface Clause {
  id: string
  no: string
  title: string
  text: string
  state: ClauseState
  note?: string
  question?: string
  options?: string[]
  answer?: string
  steps?: BStep[]
  open?: boolean
}

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'submit' }
  | { t: number; op: 'stage'; stage: Stage }
  | { t: number; op: 'clause'; id: string; no: string; title: string; text: string }
  | { t: number; op: 'set'; id: string; patch: Partial<Clause> }
  | { t: number; op: 'ask'; id: string; question: string; options: string[] }
  | { t: number; op: 'answer'; id: string; text: string }
  | { t: number; op: 'steps'; id: string; labels: string[] }
  | { t: number; op: 'step'; id: string; i: number; state: StepState }
  | { t: number; op: 'rerun'; id: string }
  | { t: number; op: 'stamp' }
  | { t: number; op: 'end' }

export const DEFAULT_ASK = '帮我做一份 Q3 的复盘'
export const TOTAL = 26000
export const DOC_TITLE = 'Q3 复盘'

export const SCENARIO: Beat[] = [
  // ── 起草：它不开工，先把你这句话拆成条款 ─────────────────
  { t: 700, op: 'type', text: DEFAULT_ASK, dur: 2000 },
  { t: 2900, op: 'submit' },
  { t: 3300, op: 'stage', stage: 'drafting' },
  { t: 3400, op: 'clause', id: 'c1', no: '一', title: '范围', text: '整个 Q3' },
  { t: 3700, op: 'clause', id: 'c2', no: '二', title: '对象', text: '三条产品线' },
  { t: 4000, op: 'clause', id: 'c3', no: '三', title: '数据口径', text: '按 GMV' },
  { t: 4300, op: 'clause', id: 'c4', no: '四', title: '材料', text: 'analytics 导出 + 周报' },
  { t: 4600, op: 'clause', id: 'c5', no: '五', title: '篇幅', text: '1500 字以内' },

  // ── 谈判：一次只问一条 ──────────────────────────────────
  { t: 5100, op: 'stage', stage: 'negotiating' },
  { t: 5300, op: 'ask', id: 'c2', question: '三条产品线具体是哪三条？', options: ['A、B、C', '全部五条'] },
  { t: 6900, op: 'answer', id: 'c2', text: 'A、B、C' },
  { t: 7200, op: 'ask', id: 'c3', question: 'GMV 按含税还是不含税？', options: ['含税', '不含税'] },
  { t: 8800, op: 'answer', id: 'c3', text: '不含税' },
  { t: 9100, op: 'ask', id: 'c4', question: '我读不到 analytics 的数据，先用周报里的数字可以吗？', options: ['可以', '你想想办法'] },
  { t: 10700, op: 'answer', id: 'c4', text: '可以' },
  { t: 11100, op: 'stage', stage: 'ready' },

  // ── 兑现：条款逐条被划掉 ────────────────────────────────
  { t: 12400, op: 'stage', stage: 'working' },
  { t: 12600, op: 'set', id: 'c1', patch: { state: 'working' } },
  { t: 13200, op: 'set', id: 'c1', patch: { state: 'done', note: '0.4s' } },

  { t: 13400, op: 'set', id: 'c4', patch: { state: 'working' } },
  { t: 13450, op: 'steps', id: 'c4', labels: ['2025-W27 周报', '2025-W28 周报', '2025-W29 周报', '2025-W30 周报'] },
  { t: 13600, op: 'step', id: 'c4', i: 0, state: 'done' },
  { t: 13800, op: 'step', id: 'c4', i: 1, state: 'done' },
  { t: 14100, op: 'step', id: 'c4', i: 2, state: 'working' },
  { t: 14800, op: 'step', id: 'c4', i: 2, state: 'done' },
  { t: 15000, op: 'step', id: 'c4', i: 3, state: 'working' },
  { t: 15400, op: 'step', id: 'c4', i: 3, state: 'done' },
  { t: 15600, op: 'set', id: 'c4', patch: { state: 'done', note: '4 份 · 2.2s', open: false } },

  { t: 15800, op: 'set', id: 'c2', patch: { state: 'working' } },
  { t: 16300, op: 'set', id: 'c2', patch: { state: 'done', note: '0.2s' } },

  // ── 冲突：周报的数字和谈定的口径对不上 ──────────────────
  { t: 16500, op: 'set', id: 'c3', patch: { state: 'working' } },
  { t: 16700, op: 'ask', id: 'c3', question: '周报里的 GMV 是含税的，和「不含税」冲突', options: ['改用含税', '按不含税重算'] },
  { t: 18200, op: 'answer', id: 'c3', text: '改用含税' },
  { t: 18400, op: 'set', id: 'c3', patch: { text: '按含税 GMV' } },
  { t: 18800, op: 'set', id: 'c3', patch: { state: 'done', note: '2.1s' } },

  // ── 未兑现：写了 2140 字 ────────────────────────────────
  { t: 19000, op: 'set', id: 'c5', patch: { state: 'working' } },
  { t: 20900, op: 'set', id: 'c5', patch: { state: 'unmet', note: '写了 2140 字，超出 1500' } },

  // ── 只重跑这一条 ────────────────────────────────────────
  { t: 22100, op: 'rerun', id: 'c5' },
  { t: 22300, op: 'steps', id: 'c5', labels: ['重写正文', '压到 1500 字以内'] },
  { t: 22400, op: 'step', id: 'c5', i: 0, state: 'working' },
  { t: 22900, op: 'step', id: 'c5', i: 0, state: 'done' },
  { t: 23000, op: 'step', id: 'c5', i: 1, state: 'working' },
  { t: 23500, op: 'step', id: 'c5', i: 1, state: 'done' },
  { t: 23700, op: 'set', id: 'c5', patch: { state: 'done', note: '1460 字 · 1.7s', open: false } },

  { t: 24100, op: 'stage', stage: 'done' },
  { t: 24400, op: 'stamp' },
  { t: 26000, op: 'end' },
]
