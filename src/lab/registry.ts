export interface Variant {
  id: string
  name: string
  tag: string
  /** 用来在画廊里画预览色块 */
  bg: string
  fg: string
  accent: string
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
    question: 'Agent 正在干活的时候，界面除了转圈还能是什么样？',
    status: 'live',
    variants: [
      { id: 'a', name: '极简黑白', tag: '排版 / 层级', bg: '#ffffff', fg: '#0a0a0a', accent: '#d93a2b' },
      { id: 'b', name: '暖色纸张', tag: '温度 / 质感', bg: '#f7f4ee', fg: '#2a2622', accent: '#b5502e' },
      { id: 'c', name: '冷调玻璃', tag: '材质 / 动效', bg: '#0b0e14', fg: '#e8ecf2', accent: '#4fd1c5' },
    ],
  },
  { no: '002', slug: '/002', title: 'One Line', question: '如果整个 Agent 只有一行高？', status: 'planned' },
  { no: '003', slug: '/003', title: 'Terminal', question: '终端可以有多优雅？', status: 'planned' },
  { no: '004', slug: '/004', title: 'Chronicle', question: '把对话历史做成一条可以滑动的时间轴。', status: 'planned' },
  { no: '005', slug: '/005', title: 'Desktop', question: 'Agent 像操作系统助手一样活着。', status: 'planned' },
  { no: '006', slug: '/006', title: 'Spatial', question: '不用列表，用空间表达 Agent 的工作。', status: 'planned' },
  { no: '—', slug: '/', title: '…', question: '下一个想法。', status: 'planned' },
]
