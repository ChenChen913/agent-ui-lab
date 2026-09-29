import { Moon, Sun } from 'lucide-react'
import { useLabTheme } from './theme'

/** 白天 / 黑夜切换。两段式，当前生效的那一段是亮的，不会有歧义。 */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useLabTheme()
  const on = theme === 'light'

  const seg = (active: boolean) =>
    'flex items-center justify-center gap-1.5 rounded-md transition-colors ' +
    (compact ? 'h-8 w-8 ' : 'px-2.5 py-1.5 text-[12.5px] ') +
    (active ? 'font-medium lab-hover-plain' : 'lab-t3 lab-hover-plain')

  const segStyle = (active: boolean) =>
    active ? { background: 'var(--lab-accent-soft)', color: 'var(--lab-accent)' } : undefined

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border p-0.5 lab-line"
      style={{ background: 'var(--lab-panel)' }}
      role="group"
      aria-label="配色模式"
    >
      <button onClick={() => setTheme('light')} aria-pressed={on} title="白天" className={seg(on)} style={segStyle(on)}>
        <Sun size={14} strokeWidth={2} />
        {compact ? null : '白天'}
      </button>
      <button onClick={() => setTheme('dark')} aria-pressed={!on} title="黑夜" className={seg(!on)} style={segStyle(!on)}>
        <Moon size={14} strokeWidth={2} />
        {compact ? null : '黑夜'}
      </button>
    </div>
  )
}
