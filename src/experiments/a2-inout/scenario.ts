/**
 * A2 · 入口与对话 —— 剧本（高保真重做版）
 *
 * 概念没变：用户登录之后看到的那一层。
 * 变的是完成度 —— 一条 Agent 回复里，过程、工具、图表、正文、产物全部真的做出来。
 *
 * 一条回复 = 一串 Part。过程类的 Part 默认折叠成一条时间线，正文永远展开。
 * t 毫秒，总长 26 秒。
 */

export interface SearchHit { site: string; title: string; url: string; snippet: string }
export interface Bar { label: string; value: number }

export type Part =
  | { id: string; kind: 'thinking'; state: SState; text: string; secs: number }
  | { id: string; kind: 'search'; state: SState; query: string; hits: SearchHit[] }
  | { id: string; kind: 'read'; state: SState; file: string; pages: number; preview: string[] }
  | { id: string; kind: 'run'; state: SState; lang: string; code: string; out: string; exit: number; ms: number }
  | { id: string; kind: 'chart'; state: SState; title: string; unit: string; bars: Bar[] }
  | { id: string; kind: 'md'; state: SState; text: string }
  | { id: string; kind: 'artifact'; state: SState; title: string; desc: string; meta: string }

export type SState = 'running' | 'done'

export interface Msg {
  id: string
  role: 'user' | 'agent'
  text: string
  files?: { name: string; size: string; kind: 'pdf' | 'csv' }[]
  parts?: Part[]
  streaming?: number
  done?: boolean
}

export type Beat =
  | { t: number; op: 'type'; text: string; dur: number }
  | { t: number; op: 'send' }
  | { t: number; op: 'part'; msg: string; part: Part }
  | { t: number; op: 'fill'; msg: string; id: string; patch: Partial<Part> }
  | { t: number; op: 'stream'; msg: string; index: number }
  | { t: number; op: 'done'; msg: string }
  | { t: number; op: 'end' }

export const TOTAL = 26000
export const DEFAULT_ASK = '帮我把这份季度报告读一下，提炼三个关键点，顺便看看有没有藏着的问题'
export const AGENT = { name: 'Agent', model: 'Pro' }

const MD_BODY = [
  '## 一、三个关键点',
  '',
  '**1. 营收环比 +12%，但增量几乎全部来自华东一条产品线。**',
  '其余四个区域加起来只贡献了 1.4 个百分点，这条产品线一停，整体就回到持平。',
  '',
  '**2. 毛利率掉了 2.4 个点。**',
  '不是价格问题，是新客户的获客成本上来了。见下表。',
  '',
  '| 区域 | 营收环比 | 新客成本 | 毛利率 |',
  '|---|---|---|---|',
  '| 华东 | +38.1% | ¥412 | 31.2% |',
  '| 华北 | +2.3% | ¥688 | 24.5% |',
  '| 华南 | −1.1% | ¥731 | 22.8% |',
  '| 西南 | +0.9% | ¥795 | 21.4% |',
  '',
  '**3. 研发投入占比首次超过 20%**，去年同期是 14%。这是结构性变化，不是一次性支出。',
  '',
  '## 二、藏着的一个问题',
  '',
  '> 第二点在原文里只出现在**附注 4**，正文一个字都没提。原文的措辞是「客户获取成本的阶段性上升」，',
  '> 听起来像临时的，但附表里**连续三个季度都在涨**。',
  '',
  '如果你要拿这份报告去汇报，这一条值得单独说。[^1]',
  '',
  '[^1]: 附注 4，第 38 页；数据见附表 B-2。',
].join('\n')

export const SCENARIO: Beat[] = [
  { t: 400, op: 'type', text: DEFAULT_ASK, dur: 2400 },
  { t: 3000, op: 'send' },

  { t: 3400, op: 'part', msg: 'm1', part: { id: 'p1', kind: 'thinking', state: 'running', secs: 0, text: [
    '用户要三件事：读报告、提炼三点、找出问题。',
    '第三件没有明说范围，但「藏着的问题」通常指正文没写、附注里有的东西。',
    '我打算先通读，再重点看附注和附表，最后交叉核对一遍数字。',
  ].join('\n') } },
  { t: 6200, op: 'fill', msg: 'm1', id: 'p1', patch: { state: 'done', secs: 2.8 } },

  { t: 6400, op: 'part', msg: 'm1', part: { id: 'p2', kind: 'search', state: 'running', query: '2025 Q3 新能源汽车 行业 环比 基准', hits: [] } },
  { t: 8200, op: 'fill', msg: 'm1', id: 'p2', patch: { state: 'done', hits: [
    { site: '中汽协', title: '2025 年三季度汽车工业经济运行情况', url: 'caam.org.cn/news/2025-q3', snippet: '三季度新能源乘用车零售 812 万辆，同比增长 24.6%，渗透率首次稳定在 50% 以上。' },
    { site: '乘联会', title: '周度数据快报（第 39 周）', url: 'cpca.org.cn/weekly/39', snippet: '主力车型成交价连续两个季度持平，靠降价换量的边际收益基本消失。' },
    { site: '某券商', title: '新能源车行业深度：补能体验的权重变化', url: 'research.example.com/ev-2025', snippet: '在 20 万以上价位，补能体验首次超过续航里程成为首要决策因素。样本 1200。' },
  ] } },

  { t: 8400, op: 'part', msg: 'm1', part: { id: 'p3', kind: 'read', state: 'running', file: '季度报告.pdf', pages: 0, preview: [] } },
  { t: 10600, op: 'fill', msg: 'm1', id: 'p3', patch: { state: 'done', pages: 41, preview: [
    '第 12 页 · 三、经营情况分析',
    '　　本季度营收较上季度增长 12.0%，主要来自华东区域的渠道拓展……',
    '第 38 页 · 附注 4 客户获取成本',
    '　　本季度新客户获取成本较上季度上升 8.4%，属于阶段性上升……',
  ] } },

  { t: 10800, op: 'part', msg: 'm1', part: { id: 'p4', kind: 'run', state: 'running', lang: 'python', ms: 0, exit: 0,
    code: [
      'df = pd.read_csv("附表B-2.csv")',
      'q = df.pivot_table(index="区域", values=["营收", "新客成本"], aggfunc="sum")',
      'print(q.sort_values("营收", ascending=False))',
    ].join('\n'),
    out: '' } },
  { t: 12800, op: 'fill', msg: 'm1', id: 'p4', patch: { state: 'done', ms: 1420, exit: 0, out: [
    '        营收        新客成本',
    '华东    4,182,400      412',
    '华北    1,046,200      688',
    '华南      982,700      731',
    '西南      618,300      795',
    '',
    '[4 rows x 2 columns]',
  ].join('\n') } },

  { t: 13000, op: 'part', msg: 'm1', part: { id: 'p5', kind: 'chart', state: 'running', title: '各区域营收环比', unit: '%', bars: [] } },
  { t: 14600, op: 'fill', msg: 'm1', id: 'p5', patch: { state: 'done', bars: [
    { label: '华东', value: 38.1 }, { label: '华北', value: 2.3 },
    { label: '华南', value: -1.1 }, { label: '西南', value: 0.9 },
  ] } },

  { t: 15000, op: 'part', msg: 'm1', part: { id: 'p6', kind: 'md', state: 'running', text: MD_BODY } },
  { t: 15800, op: 'stream', msg: 'm1', index: 5 },
  { t: 17800, op: 'stream', msg: 'm1', index: -1 },

  { t: 18600, op: 'part', msg: 'm1', part: { id: 'p7', kind: 'artifact', state: 'done', title: '季度报告要点.md', desc: '三个关键点 + 附注 4 的问题 + 数据表', meta: '6.8 KB' } },
  { t: 19600, op: 'done', msg: 'm1' },
  { t: 26000, op: 'end' },
]
