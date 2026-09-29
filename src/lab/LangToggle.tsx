import { Globe } from 'lucide-react'
import type { Lang } from './registry'

/**
 * 语言切换。单个按钮，按一下换一种。
 *
 * 按钮上写的是**切过去之后你会看到的语言**，不是当前语言 ——
 * 这是加拿大政府设计系统（design.canada.ca）的语言切换规范：
 * 英文页面上写 Français，法文页面上写 English。
 * 小屏用两字母缩写。
 */
export default function LangToggle({ lang, setLang, compact = false }: {
  lang: Lang; setLang: (l: Lang) => void; compact?: boolean
}) {
  const next: Lang = lang === 'zh' ? 'en' : 'zh'
  const label = next === 'en' ? (compact ? 'EN' : 'English') : (compact ? '中' : '中文')

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className="lab-gh"
      title={next === 'en' ? 'Switch to English' : '切换到中文'}
      aria-label={next === 'en' ? 'Switch to English' : '切换到中文'}
    >
      <Globe size={14} strokeWidth={1.9} />
      <span>{label}</span>
    </button>
  )
}
