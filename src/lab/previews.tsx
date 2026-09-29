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
const MULTI: Record<string, string[]> = { '001': ['a', 'b', 'c'] }

function Shot({ no, vn, bg }: { no: string; vn?: string; bg: string }) {
  const file = vn && MULTI[no]?.includes(vn) ? no + '-' + vn : no
  return (
    <div className="lab-shot" style={{ background: bg }}>
      <img src={'/previews/' + file + '.png'} alt="" draggable={false} />
    </div>
  )
}

const make = (no: string) => (p: PreviewProps) => <Shot no={no} vn={p.vn} bg={p.bg ?? '#ffffff'} />

export const PREVIEWS: Record<string, (p: PreviewProps) => JSX.Element> = {
  '001': make('001'),
  '002': make('002'),
  '003': make('003'),
  '004': make('004'),
  '005': make('005'),
  '006': make('006'),
  '007': make('007'),
  '008': make('008'),
  '009': make('009'),
  '010': make('010'),
  '011': make('011'),
  '012': make('012'),
  '013': make('013'),
  '014': make('014'),
  '015': make('015'),
}
