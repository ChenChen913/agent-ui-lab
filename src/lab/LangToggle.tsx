import type { Lang } from './registry'

/** 中英文切换。两段式，当前生效的那一段是亮的。 */
export default function LangToggle({ lang, setLang, compact = false }: {
  lang: Lang; setLang: (l: Lang) => void; compact?: boolean
}) {
  const seg = (active: boolean) =>
    'flex items-center justify-center rounded-md transition-colors ' +
    (compact ? 'h-8 px-2.5 text-[12px] ' : 'px-2.5 py-1.5 text-[12.5px] ') +
    (active ? 'font-medium lab-hover-plain' : 'lab-t3 lab-hover-plain')
  const segStyle = (active: boolean) =>
    active ? { background: 'var(--lab-accent-soft)', color: 'var(--lab-accent)' } : undefined

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border p-0.5 lab-line"
      style={{ background: 'var(--lab-panel)' }}
      role="group"
      aria-label="语言 / Language"
    >
      <button onClick={() => setLang('zh')} aria-pressed={lang === 'zh'} className={seg(lang === 'zh')} style={segStyle(lang === 'zh')}>中文</button>
      <button onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={seg(lang === 'en')} style={segStyle(lang === 'en')}>EN</button>
    </div>
  )
}
