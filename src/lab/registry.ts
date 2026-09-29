export interface Variant {
  id: string
  name: string
  tag: I18n
  /** 画廊预览色块 */
  bg: string
  fg: string
  accent: string
  /** 预览右侧半块的另一个颜色（用来说明「可以反转」） */
  bg2?: string
  /** 路由覆盖；不填就是 `${slug}/${id}` */
  href?: string
}

export interface Entry {
  no: string
  slug: string
  title: I18n
  question: I18n
  status: 'live' | 'planned'
  /** 属于哪条主线 */
  line: Line
  variants?: Variant[]
}

/* ─────────────────────────────────────────────────────────────
   两条主线。
   A：Agent 干活的时候，怎么让用户看懂？      → 过程怎么被看见
   B：用户应该如何使用 Agent？                 → 产品主界面长什么样
   主页按这两条线分区，每个模板只能属于一条。
   ───────────────────────────────────────────────────────────── */
export type Line = 'a' | 'b'
export type Lang = 'zh' | 'en'

/** 界面上每一句要显示的话都写成两种语言 */
export interface I18n { zh: string; en: string }

export interface LineMeta {
  id: Line
  /** 分区标题 */
  name: I18n
  /** 一句话：这条线在研究什么 */
  question: I18n
  /** 两三句：这条线包含什么、不包含什么 */
  desc: I18n
}

/** 展示顺序：主界面在前，过程可视化在后 */
export const LINES: LineMeta[] = [
  {
    id: 'a',
    name: { zh: 'Agent 主界面', en: 'Agent product UI' },
    question: { zh: '用户应该如何使用 Agent？', en: 'How should a person actually use an agent?' },
    desc: {
      zh: '从「Agent 正在干什么」转向「人怎么用它」。这一线研究的是产品入口、任务创建、委托与谈判、产物，以及人和 Agent 的持续交互。',
      en: 'Moving from what the agent is doing to how a person works with it. This line covers the entry point, task creation, commission and negotiation, artifacts, and the ongoing interaction between a person and an agent.',
    },
  },
  {
    id: 'b',
    name: { zh: 'Agent 工作过程可视化', en: 'Agent process visualisation' },
    question: { zh: 'Agent 在干活的时候，怎么让用户看懂？', en: 'When an agent is working, how do you let the user understand it?' },
    desc: {
      zh: '传统产品把 Agent 的工作压成一句 Loading。这一线探索的是：那整个过程除了聊天消息，还能怎么被表达出来。六个模板是六种完全不同的视觉语言，故意不统一。',
      en: 'Conventional products compress an agent work into one spinner. This line asks what else that whole process could be. The six templates are six deliberately un-unified visual languages.',
    },
  },
]

/**
 * 编号就是 A1…A9 / B1…B6 本身：两条主线各自从 1 开始。
 * 不再用一串连续数字再靠显示层换算 —— 目录名、路由、预览图
 * 和界面上看到的是同一个号。
 */
export function lineIndex(entry: Entry): number {
  return Number(entry.no.slice(1)) || 0
}

/** 顶栏、翻页这些地方直接用 no，它已经带线名 */
export function stampedNo(no: string): string {
  return no
}

/** 首屏主标题（分两行）与副标题 */
export const HERO = {
  line1: { zh: 'Agent 的界面', en: 'Agent interfaces' },
  line2: { zh: '不该只有一种', en: 'need not look alike' },
}
export const LAB_SUB: I18n = {
  zh: '两条主线：过程怎么被看见，以及人怎么使用 Agent。十五个模板，各自独立。',
  en: 'Two lines: how the process becomes visible, and how a person works with an agent. Fifteen templates, each independent.',
}

/** 主页上那些零碎的界面文案 */
export const UI: Record<string, I18n> = {
  eyebrow: { zh: '两条主线 · 15 个模板', en: 'Two lines · 15 templates' },
  count: { zh: '个模板', en: 'templates' },
  enter: { zh: '进入', en: 'Open' },
  planned: { zh: '待做', en: 'Planned' },
  lab: { zh: '实验室', en: 'Lab' },
  source: { zh: '源码', en: 'Source' },
  footL: { zh: 'Agent UI Lab · 个人实验场 · 不做 SDK，不做 Runtime', en: 'Agent UI Lab · a personal lab · no SDK, no runtime' },
  footR: { zh: '点卡片进入 · 进去之后左上角返回，或者用右上角直接翻页', en: 'Click a card to open it · use the top-left to go back, or the top-right to page through' },
}

/** 源码地址，顶栏那个 GitHub 图标指向它 */
export const GITHUB = 'https://github.com/ChenChen913/agent-ui-lab'

/** 按顺序浏览用：每个实验的主入口。Frame 用它渲染 ‹ › 翻页。 */
export interface NavItem { no: string; title: string; route: string }
export const NAV: NavItem[] = [
  { no: 'B1', title: 'The Bench', route: '/b1/a' },
  { no: 'B2', title: 'One Line', route: '/b2' },
  { no: 'B3', title: 'Terminal', route: '/b3' },
  { no: 'B4', title: 'Chronicle', route: '/b4' },
  { no: 'B5', title: 'Desktop', route: '/b5' },
  { no: 'B6', title: 'Spatial', route: '/b6' },
  { no: 'A1', title: 'The Brief', route: '/a1' },
  { no: 'A2', title: 'In & Out', route: '/a2' },
  { no: 'A3', title: 'Workbench', route: '/a3' },
  { no: 'A4', title: 'Mission Control', route: '/a4' },
  { no: 'A5', title: 'Bubble', route: '/a5' },
  { no: 'A6', title: 'The Plan', route: '/a6' },
  { no: 'A7', title: 'Weight', route: '/a7' },
  { no: 'A8', title: 'Ledger', route: '/a8' },
  { no: 'A9', title: 'Return', route: '/a9' },
]

export const ENTRIES: Entry[] = [
  {
    no: 'B1',
    slug: '/b1',
    line: 'b',
    title: { zh: '当前这步', en: 'The Bench' },
    question: { zh: 'Agent 干活的时候，界面除了转圈还能是什么样？', en: 'When an agent is working, what can the interface be besides a spinner?' },
    status: 'live',
    variants: [
      { id: 'a', name: '极简黑白', tag: { zh: '排版 / 层级', en: 'Typography / hierarchy' }, bg: '#ffffff', fg: '#0a0a0a', accent: '#d93a2b' },
      { id: 'b', name: '暖色纸张', tag: { zh: '温度 / 质感', en: 'Warmth / texture' }, bg: '#f7f4ee', fg: '#2a2622', accent: '#b5502e' },
      { id: 'c', name: '冷调玻璃', tag: { zh: '材质 / 动效', en: 'Material / motion' }, bg: '#0b0e14', fg: '#e8ecf2', accent: '#4fd1c5' },
    ],
  },
  {
    no: 'B2',
    slug: '/b2',
    line: 'b',
    title: { zh: '一条线', en: 'One Line' },
    question: { zh: '如果整个界面只允许存在一条线，Agent 还能怎么工作？', en: 'If the whole interface were allowed exactly one line, how could an agent still work?' },
    status: 'live',
    variants: [
      {
        id: 'a', name: '一线', tag: { zh: '编码 / 动效 / 0 色彩', en: 'Encoding / motion / zero colour' },
        bg: '#ffffff', fg: '#111111', accent: '#111111',
        bg2: '#0b0b0c', href: '/B2',
      },
    ],
  },
  {
    no: 'B3',
    slug: '/b3',
    line: 'b',
    title: { zh: '终端当界面', en: 'Terminal' },
    question: { zh: '终端本身很粗糙，能不能把它设计成一个高级的 Agent Interface？', en: 'Terminals are crude. Can one be designed into a first-class agent interface?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Terminal', tag: { zh: '调色板 / 文本动效', en: 'Palette / text motion' }, bg: '#0e1012', fg: '#cbc8c0', accent: '#d6a45f', href: '/B3' },
    ],
  },
  {
    no: 'B4',
    slug: '/b4',
    line: 'b',
    title: { zh: '时间即长度', en: 'Chronicle' },
    question: { zh: '如果不用传统聊天记录，而是用时间轴表达 Agent 的工作过程，会怎么样？', en: 'What if an agent\'s work were shown as a timeline instead of a chat log?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Chronicle', tag: { zh: '时间轴 / 泳道 / 可拖动', en: 'Timeline / lanes / draggable' }, bg: '#eef1f3', fg: '#16232e', accent: '#c4472c', href: '/B4' },
    ],
  },
  {
    no: 'B5',
    slug: '/b5',
    line: 'b',
    title: { zh: '活在桌面上', en: 'Desktop' },
    question: { zh: '如果 Agent 不是一个网页，而是一个活在桌面上的存在，会怎么样？', en: 'What if an agent were not a web page but something that lives on your desktop?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Desktop', tag: { zh: '桌面 / 窗口 / 常驻本体', en: 'Desktop / windows / a presence' }, bg: '#a7b3c0', fg: '#1b2027', accent: '#3f8fa8', href: '/B5' },
    ],
  },
  {
    no: 'B6',
    slug: '/b6',
    line: 'b',
    title: { zh: '清晰与模糊', en: 'Spatial' },
    question: { zh: '如果 Agent 的状态不是用列表表达，而是用空间关系表达，会怎么样？', en: 'What if an agent\'s state were expressed through spatial relationships instead of a list?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Spatial', tag: { zh: '空间 / 景深 / 相机', en: 'Space / depth of field / camera' }, bg: '#08090c', fg: '#e6e4df', accent: '#6ea8d8', href: '/B6' },
    ],
  },
  {
    no: 'A1',
    slug: '/a1',
    line: 'a',
    title: { zh: '先谈后做', en: 'The Brief' },
    question: { zh: '如果界面的主角是「这份委托」，而不是聊天记录，会怎么样？', en: 'What if the interface were about the commission, not the chat log?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'The Brief', tag: { zh: '条款 · 谈判 · 逐条兑现', en: 'Clauses · negotiation · delivered item by item' }, bg: '#131211', fg: '#ece7dd', accent: '#c8623f', href: '/A1' },
    ],
  },
  {
    no: 'A2',
    slug: '/a2',
    line: 'a',
    title: { zh: '入口与对话', en: 'In & Out' },
    question: { zh: '从打开产品到拿到结果，中间这条路长什么样？', en: 'What does the road from opening the product to getting a result look like?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'In & Out', tag: { zh: '首页即输入 · 落到底部 · 过程流', en: 'Home is the input · it settles down · process stream' }, bg: '#fbfbfc', fg: '#15181d', accent: '#2f6bd8', href: '/A2' },
    ],
  },
  {
    no: 'A3',
    slug: '/a3',
    line: 'a',
    title: { zh: '过程与产物', en: 'Workbench' },
    question: { zh: '过程是结果的记录，还是结果的草稿？', en: 'Is the process a log of the result, or its draft?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Workbench', tag: { zh: '段落连着步骤 · 撤一步看少什么', en: 'Sections trace to steps · drop one, see what is lost' }, bg: '#f6f6f4', fg: '#191a18', accent: '#2e6b52', href: '/A3' },
    ],
  },
  {
    no: 'A4',
    slug: '/a4',
    line: 'a',
    title: { zh: '并行控制塔', en: 'Mission Control' },
    question: { zh: '同时派五个 Agent 出去，界面除了并排五个聊天框还能是什么？', en: 'You dispatch five agents at once. What is the interface, besides five chats side by side?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Mission Control', tag: { zh: '状态矩阵 · 确认门 · 回执', en: 'State matrix · decision gate · receipts' }, bg: '#0a0c0f', fg: '#e4e8ee', accent: '#4da3ff', href: '/A4' },
    ],
  },
  {
    no: 'A5',
    slug: '/a5',
    line: 'a',
    title: { zh: '熟悉的聊天', en: 'Bubble' },
    question: { zh: '如果 Agent 就长成你最熟悉的那个聊天软件的样子呢？', en: 'What if the agent looked like the chat app you already know by heart?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Bubble', tag: { zh: '头像 · 昵称 · 气泡 · 时间', en: 'Avatar · name · bubble · time' }, bg: '#ffffff', fg: '#1a1a1a', accent: '#0e8a5f', href: '/A5' },
    ],
  },
  {
    no: 'A6',
    slug: '/a6',
    line: 'a',
    title: { zh: '活的计划', en: 'The Plan' },
    question: { zh: 'Agent 已经开干了，你才发现它理解错了，除了打断重来还能怎么办？', en: 'The agent already started, and you realise it misunderstood. What now, besides killing it?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'The Plan', tag: { zh: '活的计划 · 改一步看涟漪', en: 'A live plan · edit a step, see the ripple' }, bg: '#f7f8f9', fg: '#14171a', accent: '#2f4bb8', href: '/A6' },
    ],
  },
  {
    no: 'A7', slug: '/a7', line: 'a', title: { zh: '按需展开', en: 'Weight' },
    question: { zh: '同一块界面，面对一句话和二十个项目，应该给出同样分量的过程吗？', en: 'Should one screen give the same amount of process for one sentence and for twenty projects?' },
    status: 'live',
    variants: [{ id: 'a', name: 'Weight', tag: { zh: '分量刻度 · 一步一格 · 自己长大', en: 'Weight ticks · one per step · it grows by itself' }, bg: '#fafaf9', fg: '#1c1c1a', accent: '#c2410c', href: '/A7' }],
  },
  {
    no: 'A8', slug: '/a8', line: 'a', title: { zh: '可验证的答案', en: 'Ledger' },
    question: { zh: '一个搜索型 Agent 的答案，凭什么可信？', en: 'What makes a search agent’s answer worth trusting?' },
    status: 'live',
    variants: [{ id: 'a', name: 'Ledger', tag: { zh: '衬线答案 · 编号出处 · 悬停互亮', en: 'Serif answer · numbered sources · cross highlight' }, bg: '#fbf9f5', fg: '#23201b', accent: '#20808d', href: '/A8' }],
  },
  {
    no: 'A9', slug: '/a9', line: 'a', title: { zh: '回来先看简报', en: 'Return' },
    question: { zh: '用户离开 20 分钟再回来，界面上应该是什么？', en: 'The user was away for 20 minutes. What should they see when they come back?' },
    status: 'live',
    variants: [{ id: 'a', name: 'Return', tag: { zh: '简报 · 替你做的决定 · 时间带', en: 'Briefing · decisions I made · a time band' }, bg: '#f4f6f8', fg: '#14171b', accent: '#b8811c', href: '/A9' }],
  },
  { no: '—', slug: '/', title: { zh: '…', en: '…' }, question: { zh: '下一个想法。', en: 'The next idea.' }, status: 'planned', line: 'a' },
]