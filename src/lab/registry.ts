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
 * 线内序号：两条主线各自从 1 开始编号。
 * 由 ENTRIES 里的先后顺序决定，不用手工维护。
 */
export function lineIndex(entry: Entry): number {
  const live = ENTRIES.filter((x) => x.status === 'live' && x.line === entry.line)
  return live.findIndex((x) => x.no === entry.no) + 1
}

/** 线内序号带线名，用在没有分区上下文的地方（比如实验页顶栏） */
export function stampedNo(no: string): string {
  const entry = ENTRIES.find((x) => x.no === no)
  if (!entry || entry.status !== 'live') return no
  return (entry.line === 'a' ? 'A' : 'B') + lineIndex(entry)
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
  { no: '001', title: 'The Bench', route: '/001/a' },
  { no: '002', title: 'One Line', route: '/002' },
  { no: '003', title: 'Terminal', route: '/003' },
  { no: '004', title: 'Chronicle', route: '/004' },
  { no: '005', title: 'Desktop', route: '/005' },
  { no: '006', title: 'Spatial', route: '/006' },
  { no: '007', title: 'The Brief', route: '/007' },
  { no: '008', title: 'Baseline', route: '/008' },
  { no: '009', title: 'Workbench', route: '/009' },
  { no: '010', title: 'Home', route: '/010' },
  { no: '011', title: 'Bubble', route: '/011' },
  { no: '012', title: 'The Plan', route: '/012' },
  { no: '013', title: 'Weight', route: '/013' },
  { no: '014', title: 'Settle', route: '/014' },
  { no: '015', title: 'Return', route: '/015' },
]

export const ENTRIES: Entry[] = [
  {
    no: '001',
    slug: '/001',
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
    no: '002',
    slug: '/002',
    line: 'b',
    title: { zh: '一条线', en: 'One Line' },
    question: { zh: '如果整个界面只允许存在一条线，Agent 还能怎么工作？', en: 'If the whole interface were allowed exactly one line, how could an agent still work?' },
    status: 'live',
    variants: [
      {
        id: 'a', name: '一线', tag: { zh: '编码 / 动效 / 0 色彩', en: 'Encoding / motion / zero colour' },
        bg: '#ffffff', fg: '#111111', accent: '#111111',
        bg2: '#0b0b0c', href: '/002',
      },
    ],
  },
  {
    no: '003',
    slug: '/003',
    line: 'b',
    title: { zh: '终端当界面', en: 'Terminal' },
    question: { zh: '终端本身很粗糙，能不能把它设计成一个高级的 Agent Interface？', en: 'Terminals are crude. Can one be designed into a first-class agent interface?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Terminal', tag: { zh: '调色板 / 文本动效', en: 'Palette / text motion' }, bg: '#0e1012', fg: '#cbc8c0', accent: '#d6a45f', href: '/003' },
    ],
  },
  {
    no: '004',
    slug: '/004',
    line: 'b',
    title: { zh: '时间即长度', en: 'Chronicle' },
    question: { zh: '如果不用传统聊天记录，而是用时间轴表达 Agent 的工作过程，会怎么样？', en: 'What if an agent\'s work were shown as a timeline instead of a chat log?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Chronicle', tag: { zh: '时间轴 / 泳道 / 可拖动', en: 'Timeline / lanes / draggable' }, bg: '#eef1f3', fg: '#16232e', accent: '#c4472c', href: '/004' },
    ],
  },
  {
    no: '005',
    slug: '/005',
    line: 'b',
    title: { zh: '活在桌面上', en: 'Desktop' },
    question: { zh: '如果 Agent 不是一个网页，而是一个活在桌面上的存在，会怎么样？', en: 'What if an agent were not a web page but something that lives on your desktop?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Desktop', tag: { zh: '桌面 / 窗口 / 常驻本体', en: 'Desktop / windows / a presence' }, bg: '#a7b3c0', fg: '#1b2027', accent: '#3f8fa8', href: '/005' },
    ],
  },
  {
    no: '006',
    slug: '/006',
    line: 'b',
    title: { zh: '清晰与模糊', en: 'Spatial' },
    question: { zh: '如果 Agent 的状态不是用列表表达，而是用空间关系表达，会怎么样？', en: 'What if an agent\'s state were expressed through spatial relationships instead of a list?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Spatial', tag: { zh: '空间 / 景深 / 相机', en: 'Space / depth of field / camera' }, bg: '#08090c', fg: '#e6e4df', accent: '#6ea8d8', href: '/006' },
    ],
  },
  {
    no: '007',
    slug: '/007',
    line: 'a',
    title: { zh: '先谈后做', en: 'The Brief' },
    question: { zh: '如果界面的主角是「这份委托」，而不是聊天记录，会怎么样？', en: 'What if the interface were about the commission, not the chat log?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'The Brief', tag: { zh: '条款 · 谈判 · 逐条兑现', en: 'Clauses · negotiation · delivered item by item' }, bg: '#131211', fg: '#ece7dd', accent: '#c8623f', href: '/007' },
    ],
  },
  {
    no: '008',
    slug: '/008',
    line: 'a',
    title: { zh: '标准聊天', en: 'Baseline' },
    question: { zh: '用户登录之后第一眼看到的那一层，应该长什么样？', en: 'What should the layer a user sees right after signing in actually look like?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Baseline', tag: { zh: '通用 · 无气泡 · 悬浮输入框', en: 'General · no bubbles · floating composer' }, bg: '#fbfbfc', fg: '#15181d', accent: '#2f6bd8', href: '/008' },
    ],
  },
  {
    no: '009',
    slug: '/009',
    line: 'a',
    title: { zh: '产物在旁', en: 'Workbench' },
    question: { zh: '如果产出不是最后一条消息，而是一个放在旁边的产物呢？', en: 'What if the output were not the last message but an artifact sitting next to the chat?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Workbench', tag: { zh: '活动面板 · 工作区 · 双层', en: 'Activity · workspace · two layers' }, bg: '#f6f6f4', fg: '#191a18', accent: '#2e6b52', href: '/009' },
    ],
  },
  {
    no: '010',
    slug: '/010',
    line: 'a',
    title: { zh: '首页即输入', en: 'Home' },
    question: { zh: '如果首页本身就是这个产品，输入框悬在正中，会怎么样？', en: 'What if the home screen were the product itself, with the input floating in the center?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Home', tag: { zh: '首页 · 轻量状态 · Context', en: 'Home · light status · context' }, bg: '#f8f7f5', fg: '#17171a', accent: '#17171a', href: '/010' },
    ],
  },
  {
    no: '011',
    slug: '/011',
    line: 'a',
    title: { zh: '熟悉的聊天', en: 'Bubble' },
    question: { zh: '如果 Agent 就长成你最熟悉的那个聊天软件的样子呢？', en: 'What if the agent looked like the chat app you already know by heart?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'Bubble', tag: { zh: '头像 · 昵称 · 气泡 · 时间', en: 'Avatar · name · bubble · time' }, bg: '#ffffff', fg: '#1a1a1a', accent: '#0e8a5f', href: '/011' },
    ],
  },
  {
    no: '012',
    slug: '/012',
    line: 'a',
    title: { zh: '活的计划', en: 'The Plan' },
    question: { zh: 'Agent 已经开干了，你才发现它理解错了，除了打断重来还能怎么办？', en: 'The agent already started, and you realise it misunderstood. What now, besides killing it?' },
    status: 'live',
    variants: [
      { id: 'a', name: 'The Plan', tag: { zh: '活的计划 · 改一步看涟漪', en: 'A live plan · edit a step, see the ripple' }, bg: '#f7f8f9', fg: '#14171a', accent: '#2f4bb8', href: '/012' },
    ],
  },
  {
    no: '013', slug: '/013', line: 'a', title: { zh: '按需展开', en: 'Weight' },
    question: { zh: '同一块界面，面对一句话和二十个项目，应该给出同样分量的过程吗？', en: 'Should one screen give the same amount of process for one sentence and for twenty projects?' },
    status: 'live',
    variants: [{ id: 'a', name: 'Weight', tag: { zh: '分量随任务变 · 自己长大', en: 'Weight follows the task · it grows by itself' }, bg: '#fafaf9', fg: '#1c1c1a', accent: '#c2410c', href: '/013' }],
  },
  {
    no: '014', slug: '/014', line: 'a', title: { zh: '过程即草稿', en: 'Settle' },
    question: { zh: '过程和结果，是两个东西，还是同一个东西的两个阶段？', en: 'Are the process and the result two things, or two stages of one thing?' },
    status: 'live',
    variants: [{ id: 'a', name: 'Settle', tag: { zh: '过程即草稿 · 撤来源看少掉什么', en: 'Process as draft · drop a source, the doc loses it' }, bg: '#f2f1ee', fg: '#1b1a18', accent: '#1f5f8b', href: '/014' }],
  },
  {
    no: '015', slug: '/015', line: 'a', title: { zh: '回来先看简报', en: 'Return' },
    question: { zh: '用户离开 20 分钟再回来，界面上应该是什么？', en: 'The user was away for 20 minutes. What should they see when they come back?' },
    status: 'live',
    variants: [{ id: 'a', name: 'Return', tag: { zh: '简报 · 替你做的决定 · 时间带', en: 'Briefing · decisions I made · a time band' }, bg: '#f4f6f8', fg: '#14171b', accent: '#b8811c', href: '/015' }],
  },
  { no: '—', slug: '/', title: { zh: '…', en: '…' }, question: { zh: '下一个想法。', en: 'The next idea.' }, status: 'planned', line: 'a' },
]