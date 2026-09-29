/**
 * 010 · Mission Control —— 剧本
 *
 * 回答的问题：同时派五个 Agent 出去干活的时候，界面长什么样？
 *
 * 答案不是把五段聊天并排放。控制塔的主角是「状态」本身：
 * 每行一个 agent，等宽小字 telemetry 一直滚，成本一直跳；
 * 有 agent 被问题卡住，琥珀色的确认门亮起来，等你拍板；
 * 干完一个，回执自己落进右边的 Inbox。
 *
 * 灵感来自 Cursor 2.0 的并行 agent 面板和 Google Antigravity 的 Manager Surface。
 *
 * t 是毫秒，总长 31 秒。
 */

export type AgState = 'queued' | 'running' | 'blocked' | 'paused' | 'done'

export interface Agent {
  id: string
  /** worktree 分支名，等宽小字 */
  name: string
  /** 一句话任务 */
  task: string
  state: AgState
  /** 累计运行毫秒（只在 running 时走） */
  runMs: number
  /** 进度 0-100 */
  pct: number
  /** 每秒进度 */
  rate: number
  /** ACU 成本，每秒累加 */
  cost: number
  /** 每秒成本 */
  burn: number
  /** 最新一行活动，等宽 */
  ticker: string
  /** 被卡住时的问题与两个选项 */
  blockQ?: { q: string; opts: [string, string] }
  chosen?: 0 | 1
  expanded?: boolean
}

export type InboxKind = 'pr' | 'warn' | 'ok' | 'note'
export interface InboxItem {
  id: string
  kind: InboxKind
  agent: string
  text: string
  /** 出现时刻，用于显示 mono 时间戳 */
  at: number
}

export interface McState {
  agents: Agent[]
  inbox: InboxItem[]
  /** 用户已经插过手（切到 live）。驱动 live 心跳挂载 */
  live: boolean
}

export type Beat =
  | { t: number; op: 'ticker'; id: string; text: string }
  | { t: number; op: 'state'; id: string; state: AgState }
  | { t: number; op: 'block'; id: string; q: string; opts: [string, string] }
  | { t: number; op: 'choose'; id: string; opt: 0 | 1 }
  | { t: number; op: 'expand'; id: string }
  | { t: number; op: 'done'; id: string }
  | { t: number; op: 'inbox'; kind: InboxKind; agent: string; text: string }
  | { t: number; op: 'end' }

export const TOTAL = 31000
export const TITLE = '周一集群 · 5 个 agent'

const mk = (id: string, name: string, task: string, pct: number, rate: number, ticker: string): Agent =>
  ({ id, name, task, state: 'running', runMs: 14000 + Math.floor(Math.random() * 4000), pct, rate, cost: 0.3 + pct / 60, burn: 0.013, ticker })

export function fresh(): McState {
  return {
    agents: [
      mk('a1', 'auth-refactor', '重构鉴权中间件，拆出可测试的 verifyToken', 24, 4.6, 'reading src/middleware/auth.ts'),
      mk('a2', 'cart-race-fix', '修复购物车并发写导致的会话串单', 38, 5.8, 'reproducing race on cart.sync()'),
      mk('a3', 'billing-v2', '计费服务 17 个端点迁移到 v2 API', 11, 3.4, 'PATCH /invoices/:id migrated (3/17)'),
      { ...mk('a4', 'checkout-e2e', '给结账页补端到端测试', 0, 4.2, 'queued — waiting for a slot'), state: 'queued' as const },
      mk('a5', 'react-19', '依赖升级：React 18 → 19', 41, 6.4, 'resolving react-dom peer deps'),
    ],
    inbox: [],
    live: false,
  }
}

export const SCENARIO: Beat[] = [
  { t: 400, op: 'inbox', kind: 'note', agent: 'a3', text: '迁移计划已生成：17 个端点，先读后写' },

  { t: 1400, op: 'ticker', id: 'a1', text: 'extracting verifyToken() → 41 call sites' },
  { t: 2400, op: 'ticker', id: 'a2', text: 'race reproduced: 2 req, same session, write order lost' },
  { t: 3400, op: 'state', id: 'a4', state: 'running' },
  { t: 3500, op: 'ticker', id: 'a4', text: 'spawning playwright chromium' },
  { t: 5200, op: 'ticker', id: 'a3', text: 'POST /credit-notes migrated (7/17)' },
  { t: 6600, op: 'ticker', id: 'a1', text: 'writing tests/middleware/verify.spec.ts' },
  { t: 7600, op: 'inbox', kind: 'warn', agent: 'a2', text: 'cart.sync() 复现：两个请求并发写同一 session' },
  { t: 8800, op: 'ticker', id: 'a4', text: 'checkout.spec.ts · 6 scenarios sketched' },

  // a5 被版本冲突卡住，确认门亮起
  { t: 9400, op: 'block', id: 'a5', q: 'react-cookie v5 和现有 session 中间件冲突，peer 依赖互斥。', opts: ['锁 v4，等上游适配', '改 session 中间件，直接上 v5'] },
  { t: 9500, op: 'ticker', id: 'a5', text: 'waiting for decision — cookie peer conflict' },
  { t: 9700, op: 'expand', id: 'a5' },
  { t: 10400, op: 'inbox', kind: 'warn', agent: 'a5', text: 'React 19 升级被 cookie 依赖卡住，需要你拍板' },

  // 拍板，关门，收起
  { t: 13400, op: 'choose', id: 'a5', opt: 1 },
  { t: 13500, op: 'ticker', id: 'a5', text: 'migrating session middleware → v5 API' },
  { t: 14200, op: 'expand', id: 'a5' },

  { t: 16400, op: 'ticker', id: 'a2', text: 'patch: session write queue + optimistic lock' },
  { t: 18200, op: 'ticker', id: 'a4', text: 'running checkout.spec.ts (14/24)' },
  { t: 19800, op: 'ticker', id: 'a1', text: '41 call sites migrated · tests green' },

  { t: 21400, op: 'done', id: 'a2' },
  { t: 21600, op: 'inbox', kind: 'pr', agent: 'a2', text: 'PR #218 已开：修复购物车竞态（+62 −41）' },
  { t: 24000, op: 'done', id: 'a1' },
  { t: 24200, op: 'inbox', kind: 'pr', agent: 'a1', text: 'PR #219 已开：拆出 verifyToken()（+180 −95）' },
  { t: 26400, op: 'ticker', id: 'a3', text: 'webhook signature endpoints (13/17)' },
  { t: 27600, op: 'done', id: 'a4' },
  { t: 27800, op: 'inbox', kind: 'ok', agent: 'a4', text: 'e2e 24 通过 · 0 失败 · 截图 9 张' },
  { t: 29800, op: 'done', id: 'a5' },
  { t: 30000, op: 'inbox', kind: 'pr', agent: 'a5', text: 'PR #221 已开：React 19 + session 中间件 v5' },
  { t: 31000, op: 'end' },
]
