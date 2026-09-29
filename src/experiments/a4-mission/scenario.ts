/**
 * A4 · Mission Control —— 剧本
 *
 * 同时派五个 Agent 出去，界面除了并排五个聊天框还能是什么？
 *
 * 这一版把主角交给「状态」：屏幕是一块卡片网格，一张卡一个 agent。
 * 卡上有四件事 —— 它在干什么、干到哪了、花了多久、烧了多少钱。
 * 撞上依赖冲突的那张卡整张泛琥珀，并且把自己挪到底下那条
 * 「待你拍板」里 —— 那一块是这一页唯一的交互高潮，不该埋在网格里。
 *
 * t 是毫秒，总长 26 秒。
 */

export type AgentState = 'queued' | 'running' | 'waiting' | 'paused' | 'done'

export interface Agent {
  id: string
  /** 界面上一行的标题，等宽 */
  name: string
  /** 它自己那条分支，等宽 */
  branch: string
  state: AgentState
  /** 最新活动，一行等宽小字，会自己滚 */
  note: string
  /** 进度 0–1 */
  p: number
  /** 已经跑了多少毫秒 */
  ms: number
  /** 烧掉的 ACU，两位小数 */
  acu: number
  /** 预计总时长（毫秒），决定进度条爬多快 */
  dur: number
  /** 每秒烧多少 ACU */
  burn: number
  artifact?: string
  /** 卡住的那一问（state === 'waiting' 时才有） */
  gate?: string
}

/** 待你拍板的一问 */
export interface Gate {
  id: string
  agent: string
  q: string
  opts: [string, string]
  /** 选了第几个 */
  picked?: number
}

export interface Mc4State {
  agents: Agent[]
  gates: Gate[]
  /** 累计花掉的 ACU，顶栏那一行用 */
  spend: number
  /** 用户已经插过手（切到 live）。决定心跳挂不挂 */
  live: boolean
  /** 每现场派一个新 agent 就 +1，用来重挂心跳 */
  epoch: number
}

export type Beat =
  | { t: number; op: 'spawn'; a: Agent }
  | { t: number; op: 'note'; id: string; text: string }
  | { t: number; op: 'start'; id: string }
  | { t: number; op: 'gate'; id: string; q: string; opts: [string, string] }
  | { t: number; op: 'pick'; id: string; i: number }
  | { t: number; op: 'done'; id: string; artifact: string }
  | { t: number; op: 'end' }

export const TOTAL = 26000

const mk = (
  id: string, name: string, branch: string, dur: number, burn: number, note: string,
): Agent => ({ id, name, branch, state: 'queued', note, p: 0, ms: 0, acu: 0, dur, burn })

export const FLEET: Agent[] = [
  mk('a', 'refactor/api-client', 'a4/refactor-api', 21000, 0.42, '等派活'),
  mk('b', 'test/coverage-gap', 'a4/test-cov', 17000, 0.31, '等派活'),
  mk('c', 'docs/migrate-guide', 'a4/docs-migrate', 20000, 0.28, '等派活'),
  mk('d', 'dep/bump-vite', 'a4/bump-vite', 11000, 0.18, '等派活'),
  mk('e', 'lint/fix-rules', 'a4/lint-rules', 9000, 0.15, '等派活'),
]

export const SCENARIO: Beat[] = [
  { t: 0, op: 'spawn', a: { ...FLEET[0], state: 'running', note: '读 src/api/client.ts' } },
  { t: 700, op: 'spawn', a: { ...FLEET[1], state: 'running', note: '扫测试覆盖率报告' } },
  { t: 1400, op: 'spawn', a: { ...FLEET[2], state: 'running', note: '列 docs/ 下的旧指引' } },
  { t: 2100, op: 'spawn', a: { ...FLEET[3], state: 'running', note: '比对 vite 7→8 的破坏性变更' } },
  { t: 2800, op: 'spawn', a: { ...FLEET[4], state: 'running', note: '列出该关掉的规则' } },

  { t: 3200, op: 'note', id: 'a', text: '改 4 个文件的调用签名' },
  { t: 4800, op: 'note', id: 'b', text: '补 src/api/*.test.ts 的分支用例' },
  { t: 5200, op: 'note', id: 'd', text: '升 vite@8，跑一遍 build' },
  { t: 6400, op: 'note', id: 'a', text: '跑 tsc --noEmit' },

  // 撞上依赖冲突 —— 这一拍之后 docs 那张卡整张泛琥珀，并且挪到底下的队列里
  {
    t: 8200,
    op: 'gate',
    id: 'c',
    q: 'docs/migrate-guide 要改的两段正文，跟 refactor/api-client 正在改的同一批导出重了。让谁先落地？',
    opts: ['让 refactor 先落地，docs 等它', '让 docs 先落地，refactor 跟着改'],
  },

  { t: 9600, op: 'note', id: 'b', text: '覆盖率 71% → 84%' },
  { t: 10800, op: 'note', id: 'a', text: '类型全绿，等合并' },

  // 剧本自己拍板，让观众看到「拍完板它就活过来」
  { t: 12400, op: 'pick', id: 'c', i: 0 },
  { t: 12600, op: 'note', id: 'c', text: '按你选的：等 refactor 落地' },

  { t: 13800, op: 'done', id: 'd', artifact: 'vite.config.ts' },
  { t: 15400, op: 'note', id: 'b', text: '补完 12 个用例' },
  { t: 17200, op: 'done', id: 'a', artifact: 'src/api/client.ts' },

  { t: 17800, op: 'note', id: 'c', text: '重读新的导出签名' },
  { t: 21000, op: 'done', id: 'b', artifact: 'src/api/client.test.ts' },
  { t: 23400, op: 'done', id: 'c', artifact: 'docs/migrate.md' },
  { t: 26000, op: 'end' },
]

/** 顶栏那一行汇总 */
export function tally(s: Mc4State) {
  const n = (k: AgentState) => s.agents.filter((a) => a.state === k).length
  return { running: n('running'), waiting: n('waiting'), done: n('done'), queued: n('queued'), spend: s.spend }
}

export const fmtMs = (ms: number) => {
  const s = ms / 1000
  return s < 60 ? s.toFixed(1) + 's' : Math.floor(s / 60) + 'm' + String(Math.floor(s % 60)).padStart(2, '0') + 's'
}
