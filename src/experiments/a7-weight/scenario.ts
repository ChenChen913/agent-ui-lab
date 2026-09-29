/**
 * A7 · Weight —— 剧本
 *
 * 同一块界面，面对一句话和二十个项目，应该给出同样分量的过程吗？
 *
 * 这一版把「分量」做成了一块真的仪表：上半区是一块半环表，指针指到哪，
 * 就是这件事值多少过程；下半区是等宽日志流，一行一行刷出来。
 * 左边那块表越大，右边刷得越密 —— 分量不是形容词，是两个区一起长。
 *
 * 三个任务依次上场：一句话、中等、整个项目。第三个跑到一半，
 * 表自己从 34 爬到 96，日志区跟着吃下半个屏幕。
 *
 * t 是毫秒，总长 25 秒。
 */

export type LogKind = 'think' | 'read' | 'edit' | 'run' | 'ok' | 'warn'

export interface LogLine {
  /** 这一行出现在剧本的第几毫秒 */
  at: number
  k: LogKind
  text: string
  /** 属于第几个任务 */
  task: number
}

export interface Ask {
  text: string
  /** 这件事值多少过程，0–100 */
  weight: number
  /** 一句话结果 */
  answer: string
}

export interface W7State {
  asks: Ask[]
  /** 当前第几个任务 */
  cur: number
  /** 已经刷出来的日志行 */
  lines: LogLine[]
  /** 仪表读数 0–100 */
  w: number
  /** 过程区已经被撑大了（第三个任务跑到一半时发生） */
  grown: boolean
  /** 已经做完的任务 */
  done: string[]
}

export type Beat =
  | { t: number; op: 'ask'; text: string }
  | { t: number; op: 'log'; k: LogKind; text: string }
  | { t: number; op: 'w'; v: number }
  | { t: number; op: 'grew' }
  | { t: number; op: 'answer'; text: string }
  | { t: number; op: 'end' }

export const TOTAL = 25000

export const ASKS: Ask[] = [
  { text: '把首页标题改成红色', weight: 9, answer: '改了一个属性。' },
  { text: '给登录页加一个「记住我」', weight: 34, answer: '改了 2 个文件，补了 12 个用例。' },
  { text: '把整个项目的样式迁到 Tailwind v4', weight: 96, answer: '动了 63 个文件，4 处要你自己定。' },
]

const L = (at: number, k: LogKind, text: string, task: number): LogLine => ({ at, k, text, task })

/** 三个任务的日志，全部写在这里 —— 分量差异主要靠行数体现 */
export const LOGS: LogLine[] = [
  // 任务一：一句话。三行。
  L(300, 'think', '就改一个颜色，不用看别处', 0),
  L(900, 'edit', 'src/pages/home.tsx:18  color → #d93a2b', 0),
  L(1600, 'ok', '改完了', 0),

  // 任务二：中等。八行。
  L(5400, 'think', '记住我要存到本地，登录的时候还得读回来', 1),
  L(6100, 'read', 'src/pages/login.tsx', 1),
  L(6800, 'read', 'src/api/auth.ts', 1),
  L(7600, 'edit', 'login.tsx  加一个 checkbox', 1),
  L(8500, 'edit', 'auth.ts  记住 7 天', 1),
  L(9400, 'run', 'pnpm test', 1),
  L(11200, 'ok', '12 passed', 1),
  L(12000, 'ok', '改完了', 1),

  // 任务三：整个项目。行数明显多一截，而且中间有一处它自己拿不准。
  L(13400, 'think', '全项目迁移，先看清到底有多少东西', 2),
  L(13900, 'read', '扫 src/ 下 63 个文件', 2),
  L(14500, 'read', 'tailwind.config.ts', 2),
  L(15000, 'read', 'src/styles/base.css', 2),
  L(15600, 'edit', '换 v4 的 @theme 写法', 2),
  L(16200, 'edit', 'src/styles/base.css  拆出 41 个 token', 2),
  L(16800, 'run', 'pnpm build', 2),
  L(17600, 'warn', 'build 过了，但有 4 处自定义 class 没对应上', 2),
  L(18300, 'read', 'src/lab/Frame.tsx', 2),
  L(18900, 'read', 'src/lab/Index.tsx', 2),
  L(19500, 'read', 'src/lab/registry.ts', 2),
  L(20100, 'edit', '补 4 处 fallback', 2),
  L(20800, 'run', 'pnpm test', 2),
  L(22000, 'ok', '96 passed', 2),
  L(22800, 'warn', '4 处是我替你定的，你可能想改', 2),
  L(23900, 'ok', '迁完了', 2),
]

export const SCENARIO: Beat[] = [
  { t: 0, op: 'ask', text: ASKS[0].text },
  { t: 300, op: 'log', k: 'think', text: '就改一个颜色，不用看别处' },
  { t: 900, op: 'log', k: 'edit', text: 'src/pages/home.tsx:18  color → #d93a2b' },
  { t: 1600, op: 'log', k: 'ok', text: '改完了' },
  { t: 1800, op: 'w', v: 9 },
  { t: 2200, op: 'answer', text: ASKS[0].answer },

  { t: 5000, op: 'ask', text: ASKS[1].text },
  { t: 5400, op: 'log', k: 'think', text: '记住我要存到本地，登录的时候还得读回来' },
  { t: 6100, op: 'log', k: 'read', text: 'src/pages/login.tsx' },
  { t: 6800, op: 'log', k: 'read', text: 'src/api/auth.ts' },
  { t: 7600, op: 'log', k: 'edit', text: 'login.tsx  加一个 checkbox' },
  { t: 8500, op: 'log', k: 'edit', text: 'auth.ts  记住 7 天' },
  { t: 9400, op: 'log', k: 'run', text: 'pnpm test' },
  { t: 11200, op: 'log', k: 'ok', text: '12 passed' },
  { t: 12000, op: 'log', k: 'ok', text: '改完了' },
  { t: 12200, op: 'w', v: 34 },
  { t: 12600, op: 'answer', text: ASKS[1].answer },

  { t: 13200, op: 'ask', text: ASKS[2].text },
  { t: 13400, op: 'log', k: 'think', text: '全项目迁移，先看清到底有多少东西' },
  { t: 13900, op: 'log', k: 'read', text: '扫 src/ 下 63 个文件' },
  { t: 14500, op: 'log', k: 'read', text: 'tailwind.config.ts' },
  { t: 15000, op: 'log', k: 'read', text: 'src/styles/base.css' },
  { t: 15600, op: 'log', k: 'edit', text: '换 v4 的 @theme 写法' },
  { t: 16200, op: 'log', k: 'edit', text: 'src/styles/base.css  拆出 41 个 token' },
  { t: 16800, op: 'log', k: 'run', text: 'pnpm build' },

  // 跑到一半它自己撑大了 —— 这一拍是这个模板存在的理由
  { t: 17400, op: 'grew' },
  { t: 17600, op: 'w', v: 62 },
  { t: 17600, op: 'log', k: 'warn', text: 'build 过了，但有 4 处自定义 class 没对应上' },
  { t: 18300, op: 'log', k: 'read', text: 'src/lab/Frame.tsx' },
  { t: 18900, op: 'log', k: 'read', text: 'src/lab/Index.tsx' },
  { t: 19500, op: 'log', k: 'read', text: 'src/lab/registry.ts' },
  { t: 20100, op: 'log', k: 'edit', text: '补 4 处 fallback' },
  { t: 20800, op: 'log', k: 'run', text: 'pnpm test' },
  { t: 21400, op: 'w', v: 96 },
  { t: 22000, op: 'log', k: 'ok', text: '96 passed' },
  { t: 22800, op: 'log', k: 'warn', text: '4 处是我替你定的，你可能想改' },
  { t: 23900, op: 'log', k: 'ok', text: '迁完了' },
  { t: 24500, op: 'answer', text: ASKS[2].answer },
  { t: 25000, op: 'end' },
]

/** 日志行左边那串时间：mm:ss.s */
export const stamp = (ms: number) => {
  const s = ms / 1000
  return Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0')
}

/** live 模式：按你这句话的长度和用词，粗估一个分量 */
export function guessWeight(text: string): number {
  const n = text.trim().length
  const heavy = /整个|全部|所有|迁移|重构|项目|migrate|refactor|all/i.test(text)
  const mid = /加|改|补|修|测试|add|fix|test/i.test(text)
  let w = 6 + n * 0.9
  if (heavy) w += 46
  else if (mid) w += 18
  return Math.max(4, Math.min(99, Math.round(w)))
}
