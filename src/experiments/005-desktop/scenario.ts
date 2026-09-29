/**
 * 005 · Desktop —— 剧本
 *
 * 问题：如果 Agent 不是一个网页，而是一个活在桌面上的存在，会怎么样？
 *
 * 三个层次：
 *   ① 桌面本身 —— 一个地方，不是一个页面。环境光随 Agent 的状态微微变化。
 *   ② Agent 本体 —— 右下角一个常驻的方块。它呼吸、它忙碌、它需要你的时候会变形。
 *   ③ 任务窗口 —— Agent 干活时开出来的东西。可以拖动、最小化、恢复。
 *
 * 最关键的映射：**一个任务 = 一个窗口**。
 * 窗口可以最小化 → Agent 在后台继续干 → 干完了弹一张卡片给你。
 * 这是聊天记录永远表达不了的东西。
 */

export type Presence = 'idle' | 'thinking' | 'working' | 'waiting' | 'done' | 'error'
export type WinState = 'running' | 'done' | 'warn' | 'waiting'
export type WinKind = 'table' | 'checklist' | 'confirm'

export type Beat =
  | { t: number; op: 'presence'; state: Presence }
  | { t: number; op: 'summon' }
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'submit' }
  | { t: number; op: 'open'; id: string; title: string; kind: WinKind; x: number; y: number; items: number }
  | { t: number; op: 'fill'; id: string; from?: number; to: number; dur: number }
  | { t: number; op: 'win'; id: string; state: WinState }
  | { t: number; op: 'minimize'; id: string }
  | { t: number; op: 'close'; id: string }
  | { t: number; op: 'notify'; id: string; title: string; body: string; tone: 'ok' | 'warn' }
  | { t: number; op: 'dismiss' }
  | { t: number; op: 'end' }

export const ASK = '把这个季度的数据整理一下，顺便看看依赖有没有更新'
export const TOTAL = 27000

export const SIZES: Record<WinKind, { w: number; h: number }> = {
  table: { w: 340, h: 208 },
  checklist: { w: 306, h: 194 },
  confirm: { w: 336, h: 152 },
}

export const TABLE = {
  head: ['区域', 'Q1', 'Q2', 'Q3'],
  rows: [
    ['华东', '12.4', '14.1', '16.8'],
    ['华南', '8.2', '9.0', '10.4'],
    ['华北', '6.7', '7.9', '9.1'],
    ['西南', '4.1', '4.8', '5.6'],
  ],
}

export const CHECK = [
  { name: 'vite', from: '8.3.1', to: '8.4.0', warn: false },
  { name: 'eslint', from: '9.39.0', to: '9.41.2', warn: false },
  { name: 'typescript', from: '5.9.3', to: '7.0.2', warn: true },
  { name: 'concurrently', from: '9.2.1', to: '9.2.1', warn: false },
]

export const CONFIRM = {
  title: '需要你确认',
  body: 'typescript 7.0 有 breaking change，要现在升级吗？',
  yes: '升级',
  no: '先跳过',
}

export const SCENARIO: Beat[] = [
  // ── ① 桌面安静着 ────────────────────────────────────────
  { t: 1600, op: 'presence', state: 'thinking' },
  { t: 2000, op: 'summon' },
  { t: 2400, op: 'type', text: ASK, dur: 1600 },
  { t: 4050, op: 'submit' },
  { t: 4150, op: 'presence', state: 'working' },

  // ── ② 开窗口干活：两个任务同时在跑 ──────────────────────
  { t: 4300, op: 'open', id: 'w1', title: '整理季度数据', kind: 'table', x: 12, y: 13, items: 4 },
  { t: 4600, op: 'fill', id: 'w1', to: 1, dur: 5800 },
  { t: 5200, op: 'open', id: 'w2', title: '检查依赖更新', kind: 'checklist', x: 52, y: 30, items: 4 },
  { t: 5500, op: 'fill', id: 'w2', to: 1, dur: 7000 },

  // ── ③ 一个先干完 ────────────────────────────────────────
  { t: 10600, op: 'win', id: 'w1', state: 'done' },
  { t: 10900, op: 'notify', id: 'n1', title: '整理季度数据 · 完成', body: '4 个区域 · 12 个季度值已归并', tone: 'ok' },

  // ── ④ 最小化：Agent 继续在后台干 ────────────────────────
  { t: 12000, op: 'minimize', id: 'w1' },

  // ── ⑤ 卡住了，需要人拍板 ────────────────────────────────
  { t: 12500, op: 'win', id: 'w2', state: 'warn' },
  { t: 13000, op: 'presence', state: 'waiting' },
  { t: 13400, op: 'open', id: 'w3', title: CONFIRM.title, kind: 'confirm', x: 31, y: 40, items: 1 },
  { t: 17600, op: 'close', id: 'w3' },

  // ── ⑥ 批准 → 继续 → 全部完成 ────────────────────────────
  { t: 17900, op: 'presence', state: 'working' },
  { t: 18000, op: 'win', id: 'w2', state: 'running' },
  { t: 18100, op: 'fill', id: 'w2', from: 0, to: 1, dur: 3400 },
  { t: 21700, op: 'win', id: 'w2', state: 'done' },
  { t: 22100, op: 'presence', state: 'done' },
  { t: 22900, op: 'presence', state: 'idle' },
  { t: 23200, op: 'notify', id: 'n2', title: '全部完成 · 2 个任务', body: '数据已归并，依赖已升级并复检', tone: 'ok' },
  { t: 26000, op: 'dismiss' },
  { t: 27000, op: 'end' },
]
