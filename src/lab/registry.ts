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

export const LAB_INTRO = '把「Agent 干活的过程」设计出来 —— 一次一个实验。'

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
  { no: '004', slug: '/004', title: 'Chronicle', question: '把对话历史做成一条可以滑动的时间轴。', status: 'planned' },
  { no: '005', slug: '/005', title: 'Desktop', question: 'Agent 像操作系统助手一样活着。', status: 'planned' },
  { no: '006', slug: '/006', title: 'Spatial', question: '不用列表，用空间表达 Agent 的工作。', status: 'planned' },
  { no: '—', slug: '/', title: '…', question: '下一个想法。', status: 'planned' },
]
