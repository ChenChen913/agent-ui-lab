/**
 * 001 · The Bench —— 剧本（时间线）
 *
 * 这是整个实验的核心资产：它描述「Agent 干活的过程」在时间上怎么发生。
 * 界面只是把它演出来。改这里 = 改节奏。
 *
 * 时间是毫秒，t=0 是用户按下回车那一刻。总长 18.5s。
 * 播放速度由外层控制（0.5x / 1x / 2x），这里只写 1x 的绝对时间。
 *
 * 三个「重音」：
 *   ① 1.40s  第一次沉降 —— 用 3 秒教会观众这个界面的语法
 *   ② 9.3–13.0s 绕路 —— 聊天框永远表现不出来的那一段
 *   ③ 16.0–16.9s 静场 —— 停顿比加速更有力
 */

export type StepKind = 'think' | 'search' | 'read' | 'verify' | 'write'

export type Beat =
  | { t: number; op: 'start'; id: string; label: string; kind: StepKind; detail?: string }
  | { t: number; op: 'detail'; id: string; text: string }
  | { t: number; op: 'progress'; id: string; to: number; dur: number }
  | { t: number; op: 'count'; id: string; to: number; dur: number }
  | { t: number; op: 'note'; id: string; text: string }
  | { t: number; op: 'sub'; id: string; sid: string; text: string }
  | { t: number; op: 'subdone'; id: string; sid: string }
  | { t: number; op: 'retry'; id: string; text: string }
  | { t: number; op: 'sink'; id: string; dur: number }
  | { t: number; op: 'output'; title: string; meta: string }
  | { t: number; op: 'end' }

export const USER_ASK = '帮我研究一下这个项目'

export const SCENARIO: Beat[] = [
  // ── ① 第一次沉降（教语法） ─────────────────────────────
  { t: 250, op: 'start', id: 'understand', label: '正在理解任务', kind: 'think' },
  { t: 900, op: 'detail', id: 'understand', text: '拆成 4 个步骤' },
  { t: 1400, op: 'sink', id: 'understand', dur: 1.2 },

  // ── 搜索 ───────────────────────────────────────────────
  { t: 1800, op: 'start', id: 'search', label: '正在搜索资料', kind: 'search' },
  { t: 2100, op: 'detail', id: 'search', text: '"agent ui" 开源' },
  { t: 2600, op: 'progress', id: 'search', to: 1, dur: 1700 },
  { t: 3100, op: 'count', id: 'search', to: 12, dur: 1200 },
  { t: 4300, op: 'detail', id: 'search', text: '找到 12 个来源' },
  { t: 4600, op: 'sink', id: 'search', dur: 2.8 },

  // ── 阅读：故意不等速 + 第 3 篇卡住 ─────────────────────
  { t: 5000, op: 'start', id: 'read', label: '正在阅读文档', kind: 'read' },
  { t: 5400, op: 'sub', id: 'read', sid: 'd1', text: 'Designing Agent Interfaces' },
  { t: 5900, op: 'subdone', id: 'read', sid: 'd1' },
  { t: 6000, op: 'sub', id: 'read', sid: 'd2', text: 'The State of Agent UX 2025' },
  { t: 6600, op: 'subdone', id: 'read', sid: 'd2' },
  { t: 6700, op: 'sub', id: 'read', sid: 'd3', text: 'Interface Patterns for LLM Tools' },
  { t: 8600, op: 'subdone', id: 'read', sid: 'd3' },
  { t: 8700, op: 'sub', id: 'read', sid: 'd4', text: 'Human-in-the-Loop Design' },
  { t: 9000, op: 'subdone', id: 'read', sid: 'd4' },
  { t: 9050, op: 'sub', id: 'read', sid: 'd5', text: 'Evaluating Agent UX' },
  { t: 9250, op: 'subdone', id: 'read', sid: 'd5' },
  { t: 9300, op: 'note', id: 'read', text: '两份资料的结论不一致' },
  { t: 9600, op: 'sink', id: 'read', dur: 4.6 },

  // ── ② 绕路（全片主角） ────────────────────────────────
  //    10.00–10.40 故意留 400ms 空窗：这是「它在想」的张力
  { t: 10400, op: 'start', id: 'verify', label: '正在核对矛盾点', kind: 'verify' },
  { t: 11100, op: 'sub', id: 'verify', sid: 'c1', text: 'A：本地优先会拖慢冷启动' },
  { t: 11250, op: 'sub', id: 'verify', sid: 'c2', text: 'B：本地优先是延迟的关键' },
  { t: 11800, op: 'retry', id: 'verify', text: '换个思路重查' },
  { t: 12200, op: 'sub', id: 'verify', sid: 'c3', text: '补充搜索 · 3 个来源' },
  { t: 12450, op: 'detail', id: 'verify', text: '两种说法都对，分歧在「冷启动」的定义' },
  { t: 12700, op: 'subdone', id: 'verify', sid: 'c3' },
  { t: 12900, op: 'sink', id: 'verify', dur: 2.5 },

  // ── 收敛：从慢突然变快 ────────────────────────────────
  { t: 13300, op: 'start', id: 'write', label: '正在生成报告', kind: 'write' },
  { t: 13600, op: 'sub', id: 'write', sid: 'w1', text: '整理结论' },
  { t: 13900, op: 'subdone', id: 'write', sid: 'w1' },
  { t: 13950, op: 'sub', id: 'write', sid: 'w2', text: '组织结构' },
  { t: 14300, op: 'subdone', id: 'write', sid: 'w2' },
  { t: 14350, op: 'sub', id: 'write', sid: 'w3', text: '撰写正文' },
  { t: 14800, op: 'subdone', id: 'write', sid: 'w3' },
  { t: 14850, op: 'sub', id: 'write', sid: 'w4', text: '校对引用' },
  { t: 15000, op: 'progress', id: 'write', to: 0.82, dur: 700 },
  { t: 15200, op: 'subdone', id: 'write', sid: 'w4' },
  { t: 15700, op: 'sink', id: 'write', dur: 2.4 },

  // ── ③ 静场 900ms，然后揭晓 ────────────────────────────
  { t: 16900, op: 'output', title: 'Agent UI 现状研究报告', meta: '6 个章节 · 14 个来源 · 3 个结论' },
  { t: 18500, op: 'end' },
];
