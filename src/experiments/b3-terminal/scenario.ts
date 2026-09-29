/**
 * 003 · Terminal —— 剧本
 *
 * 这个实验的核心区分（也是整个设计的骨架）：
 *
 *   \n  追加  = 已经定论的事  →  写进 scrollback，永久
 *   \r  原地  = 还没定论的事  →  在状态行 / 进度行上原地重绘
 *
 * 终端的两种输出模式，正好对应 Agent 的两种状态。
 * 用户一眼就能看出「哪些还在变，哪些已经定了」。
 *
 * t 是毫秒，总长 22.5 秒。
 */

export type Tone = 'fg' | 'dim' | 'ok' | 'err' | 'warn' | 'path' | 'accent' | 'tool'

export type Beat =
  | { t: number; op: 'cmd'; text: string; dur: number }
  | { t: number; op: 'send' }
  | { t: number; op: 'task'; text: string }
  | { t: number; op: 'note'; text: string; tone?: Tone; indent?: number }
  | { t: number; op: 'blank' }
  | { t: number; op: 'bar'; id: string; label: string; dur: number; cells?: number }
  | { t: number; op: 'status'; text: string; tone?: Tone; spin?: boolean }
  | { t: number; op: 'result'; title: string; head: string; lines: string[] }
  | { t: number; op: 'end' }

export const DEFAULT_CMD = '把过时的依赖升一下，然后跑一遍测试'
export const TOTAL = 22500
export const CELLS = 26

export const RESULT = {
  title: '依赖升级',
  head: '3 个包已更新，128 个测试全绿',
  lines: [
    'typescript  5.9.3 → 7.0.2    有 breaking change',
    'vite        8.3.1 → 8.4.0',
    'eslint      9.39.0 → 9.41.2',
    '修复 1 处：prompt.ts:41 丢弃了尾部空行',
  ],
  ms: '18.4s',
}

export const SCENARIO: Beat[] = [
  // ── 输入 ────────────────────────────────────────────────
  { t: 400, op: 'cmd', text: DEFAULT_CMD, dur: 1400 },
  { t: 1900, op: 'send' },

  // ── 读取 ────────────────────────────────────────────────
  { t: 2100, op: 'task', text: '读取 package.json' },
  { t: 2150, op: 'status', text: '解析依赖树', tone: 'accent' },
  { t: 2200, op: 'bar', id: 'parse', label: '解析依赖树', dur: 1000 },
  { t: 3300, op: 'note', text: '37 个依赖 · 3 个过时', tone: 'dim', indent: 1 },

  // ── 并发查询 registry：4 条进度条同时跑 ─────────────────
  { t: 3600, op: 'task', text: '查询 npm registry' },
  { t: 3650, op: 'status', text: '查询 registry · 4 个包', tone: 'accent' },
  { t: 3700, op: 'bar', id: 'concurrently', label: 'concurrently', dur: 1500 },
  { t: 3750, op: 'bar', id: 'vite', label: 'vite', dur: 1200 },
  { t: 3800, op: 'bar', id: 'eslint', label: 'eslint', dur: 2500 },
  { t: 3850, op: 'bar', id: 'typescript', label: 'typescript', dur: 2000 },
  { t: 6500, op: 'note', text: 'typescript 5.9.3 → 7.0.2   有 breaking change', tone: 'warn', indent: 1 },
  { t: 6900, op: 'note', text: 'vite 8.3.1 → 8.4.0', tone: 'dim', indent: 1 },
  { t: 7100, op: 'note', text: 'eslint 9.39.0 → 9.41.2', tone: 'dim', indent: 1 },
  { t: 7300, op: 'note', text: 'concurrently 已是最新', tone: 'dim', indent: 1 },

  // ── 升级 ────────────────────────────────────────────────
  { t: 7600, op: 'task', text: '升级依赖' },
  { t: 7650, op: 'status', text: '写入 package.json', tone: 'accent' },
  { t: 7700, op: 'note', text: '$ bun add -D typescript@7.0.2 vite@8.4.0 eslint@9.41.2', tone: 'path', indent: 1 },
  { t: 7750, op: 'bar', id: 'install', label: '安装', dur: 1500 },
  { t: 9400, op: 'note', text: '3 个包已更新 · 412ms', tone: 'ok', indent: 1 },

  // ── 跑测试：流式输出 ────────────────────────────────────
  { t: 9700, op: 'task', text: '运行测试' },
  { t: 9750, op: 'status', text: 'vitest', tone: 'accent' },
  { t: 9800, op: 'note', text: '$ vitest run --reporter=verbose', tone: 'path', indent: 1 },
  { t: 10000, op: 'note', text: '✓ src/lib/cursor.test.ts   (12 tests)', tone: 'ok', indent: 1 },
  { t: 10400, op: 'note', text: '✓ src/lib/keys.test.ts     (8 tests)', tone: 'ok', indent: 1 },
  { t: 10900, op: 'note', text: '✓ src/lib/theme.test.ts    (21 tests)', tone: 'ok', indent: 1 },
  { t: 11400, op: 'note', text: '✗ src/lib/prompt.test.ts   (9 tests | 2 failed)', tone: 'err', indent: 1 },
  { t: 11700, op: 'note', text: '保留最后的空行', tone: 'err', indent: 3 },
  { t: 12000, op: 'note', text: '处理 \\r 原地重绘', tone: 'err', indent: 3 },

  // ── 定位 ────────────────────────────────────────────────
  { t: 12500, op: 'task', text: '定位失败' },
  { t: 12550, op: 'status', text: '检索调用点', tone: 'accent' },
  { t: 12600, op: 'bar', id: 'grep', label: '检索调用点', dur: 900 },
  { t: 13600, op: 'note', text: 'src/lib/prompt.ts:41   split(\'\\n\') 丢弃了尾部空行', tone: 'dim', indent: 1 },
  { t: 14000, op: 'note', text: '→ 改用 split(/(?<=\\n)/)', tone: 'path', indent: 1 },

  // ── 修复 + 重跑 ─────────────────────────────────────────
  { t: 14300, op: 'task', text: '重跑失败的用例' },
  { t: 14400, op: 'note', text: '✓ 保留最后的空行', tone: 'ok', indent: 1 },
  { t: 14800, op: 'note', text: '✓ 处理 \\r 原地重绘', tone: 'ok', indent: 1 },

  { t: 15300, op: 'task', text: '运行全部测试' },
  { t: 15350, op: 'status', text: 'vitest', tone: 'accent' },
  { t: 15400, op: 'bar', id: 'vitest', label: 'vitest', dur: 2200 },
  { t: 17900, op: 'note', text: 'Test Files  14 passed (14)', tone: 'ok', indent: 1 },
  { t: 18200, op: 'note', text: 'Tests       128 passed (128)', tone: 'ok', indent: 1 },
  { t: 18500, op: 'note', text: 'Time        3.42s', tone: 'dim', indent: 1 },

  // ── 收尾 ────────────────────────────────────────────────
  { t: 19100, op: 'result', title: RESULT.title, head: RESULT.head, lines: RESULT.lines },
  { t: 19700, op: 'status', text: '就绪', tone: 'dim', spin: false },
  { t: 22500, op: 'end' },
]
