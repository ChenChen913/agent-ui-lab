export interface Variant {
  id: string
  name: string
  tag: string
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
  title: string
  question: string
  status: 'live' | 'planned'
  variants?: Variant[]
}

/** 首屏主标题（分两行）与副标题 */
export const HERO = { line1: '把「Agent 干活的过程」', line2: '设计出来' }
export const LAB_SUB = '一次一个实验，都在回答同一个问题：Agent 干活的时候，用户看得懂吗？'

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
]

export const ENTRIES: Entry[] = [
  {
    no: '001',
    slug: '/001',
    title: 'The Bench',
    question: 'Agent 干活的时候，界面除了转圈还能是什么样？',
    status: 'live',
    variants: [
      { id: 'a', name: '极简黑白', tag: '排版 / 层级', bg: '#ffffff', fg: '#0a0a0a', accent: '#d93a2b' },
      { id: 'b', name: '暖色纸张', tag: '温度 / 质感', bg: '#f7f4ee', fg: '#2a2622', accent: '#b5502e' },
      { id: 'c', name: '冷调玻璃', tag: '材质 / 动效', bg: '#0b0e14', fg: '#e8ecf2', accent: '#4fd1c5' },
    ],
  },
  {
    no: '002',
    slug: '/002',
    title: 'One Line',
    question: '如果整个界面只允许存在一条线，Agent 还能怎么工作？',
    status: 'live',
    variants: [
      {
        id: 'a', name: '一线', tag: '编码 / 动效 / 0 色彩',
        bg: '#ffffff', fg: '#111111', accent: '#111111',
        bg2: '#0b0b0c', href: '/002',
      },
    ],
  },
  {
    no: '003',
    slug: '/003',
    title: 'Terminal',
    question: '终端本身很粗糙，能不能把它设计成一个高级的 Agent Interface？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Terminal', tag: '调色板 / 文本动效', bg: '#0e1012', fg: '#cbc8c0', accent: '#d6a45f', href: '/003' },
    ],
  },
  {
    no: '004',
    slug: '/004',
    title: 'Chronicle',
    question: '如果不用传统聊天记录，而是用时间轴表达 Agent 的工作过程，会怎么样？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Chronicle', tag: '时间轴 / 泳道 / 可拖动', bg: '#eef1f3', fg: '#16232e', accent: '#c4472c', href: '/004' },
    ],
  },
  {
    no: '005',
    slug: '/005',
    title: 'Desktop',
    question: '如果 Agent 不是一个网页，而是一个活在桌面上的存在，会怎么样？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Desktop', tag: '桌面 / 窗口 / 常驻本体', bg: '#a7b3c0', fg: '#1b2027', accent: '#3f8fa8', href: '/005' },
    ],
  },
  {
    no: '006',
    slug: '/006',
    title: 'Spatial',
    question: '如果 Agent 的状态不是用列表表达，而是用空间关系表达，会怎么样？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Spatial', tag: '空间 / 景深 / 相机', bg: '#08090c', fg: '#e6e4df', accent: '#6ea8d8', href: '/006' },
    ],
  },
  {
    no: '007',
    slug: '/007',
    title: 'The Brief',
    question: '如果界面的主角是「这份委托」，而不是聊天记录，会怎么样？',
    status: 'live',
    variants: [
      { id: 'a', name: 'The Brief', tag: '条款 · 谈判 · 逐条兑现', bg: '#131211', fg: '#ece7dd', accent: '#c8623f', href: '/007' },
    ],
  },
  {
    no: '008',
    slug: '/008',
    title: 'Baseline',
    question: '用户登录之后第一眼看到的那一层，应该长什么样？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Baseline', tag: '通用 · 无气泡 · 悬浮输入框', bg: '#fbfbfc', fg: '#15181d', accent: '#2f6bd8', href: '/008' },
    ],
  },
  {
    no: '009',
    slug: '/009',
    title: 'Workbench',
    question: '如果产出不是最后一条消息，而是一个放在旁边的产物呢？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Workbench', tag: '活动面板 · 工作区 · 双层', bg: '#f6f6f4', fg: '#191a18', accent: '#2e6b52', href: '/009' },
    ],
  },
  {
    no: '010',
    slug: '/010',
    title: 'Home',
    question: '如果首页本身就是这个产品，输入框悬在正中，会怎么样？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Home', tag: '首页 · 轻量状态 · Context', bg: '#f8f7f5', fg: '#17171a', accent: '#17171a', href: '/010' },
    ],
  },
  {
    no: '011',
    slug: '/011',
    title: 'Bubble',
    question: '如果 Agent 就长成你最熟悉的那个聊天软件的样子呢？',
    status: 'live',
    variants: [
      { id: 'a', name: 'Bubble', tag: '头像 · 昵称 · 气泡 · 时间', bg: '#ffffff', fg: '#1a1a1a', accent: '#0e8a5f', href: '/011' },
    ],
  },
  {
    no: '012',
    slug: '/012',
    title: 'The Plan',
    question: 'Agent 已经开干了，你才发现它理解错了，除了打断重来还能怎么办？',
    status: 'live',
    variants: [
      { id: 'a', name: 'The Plan', tag: '活的计划 · 改一步看涟漪', bg: '#f7f8f9', fg: '#14171a', accent: '#2f4bb8', href: '/012' },
    ],
  },
  { no: '—', slug: '/', title: '…', question: '下一个想法。', status: 'planned' },
]
