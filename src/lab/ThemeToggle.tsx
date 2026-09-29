import { Moon, Sun } from 'lucide-react'
import { useLabTheme } from './theme'

/**
 * 白天 / 黑夜切换。一颗按钮，按一下换一种。
 *
 * 图标画的是**当前**是什么（白天画太阳），不是按下去会变成什么 ——
 * 一排三颗按钮里，另外两颗也都是这个读法。
 */
export default function ThemeToggle({ compact = false, lang = 'zh' }: { compact?: boolean; lang?: 'zh' | 'en' }) {
  const { theme, setTheme } = useLabTheme()
  const on = theme === 'light'
  const next = on ? 'dark' : 'light'
  const label = lang === 'en'
    ? (on ? 'Switch to dark' : 'Switch to light')
    : (on ? '切到黑夜' : '切到白天')

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={'lab-ib' + (compact ? ' is-sm' : '')}
      title={label}
      aria-label={label}
    >
      {on ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
    </button>
  )
}
