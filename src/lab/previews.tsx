import type { JSX } from 'react'

/**
 * 主页上的预览图 —— 全部是真截图，不是画出来的示意图。
 *
 * 每张都抓在演示跑到最有代表性的那一刻（时间点写在 scripts 里没有，
 * 是逐个人肉挑的）。截图尺寸 1280×560，卡片把顶部的实验外壳那条黑边裁掉。
 *
 * 001 有三套皮肤，所以它有三张图；变体切换器一按，预览跟着换。
 */

export interface PreviewProps {
  bg?: string
  fg?: string
  accent?: string
  bg2?: string
  /** 变体 id；只有 001 有多张图 */
  vn?: string
}

/** 有多张截图的模板 */
const MULTI: Record<string, string[]> = { 'B1': ['a', 'b', 'c'] }

function Shot({ no, vn, bg }: { no: string; vn?: string; bg: string }) {
  const file = vn && MULTI[no]?.includes(vn) ? no + '-' + vn : no
  return (
    <div className="lab-shot" style={{ background: bg }}>
      <img src={import.meta.env.BASE_URL + 'previews/' + file + '.png'} alt="" draggable={false} />
    </div>
  )
}

const make = (no: string) => (p: PreviewProps) => <Shot no={no} vn={p.vn} bg={p.bg ?? '#ffffff'} />

export const PREVIEWS: Record<string, (p: PreviewProps) => JSX.Element> = {
  'B1': make('B1'),
  'B2': make('B2'),
  'B3': make('B3'),
  'B4': make('B4'),
  'B5': make('B5'),
  'B6': make('B6'),
  'A1': make('A1'),
  'A2': make('A2'),
  'A3': make('A3'),
  'A4': make('A4'),
  'A5': make('A5'),
  'A6': make('A6'),
  'A7': make('A7'),
  'A8': make('A8'),
  'A9': make('A9'),
}
