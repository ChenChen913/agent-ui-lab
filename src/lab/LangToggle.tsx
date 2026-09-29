import type { Lang } from './registry'

/**
 * 语言切换。一颗方按钮，上面只有两个字母：CN / EN。
 *
 * 写的是**当前**语言，不是点下去会去的那种语言 ——
 * 因为旁边两颗（GitHub、配色）都是「现状」图标，
 * 三颗并排时只有它是「预告」会读起来打架。要去哪边写在 title 里。
 *
 * 两字母用 lang 标自身语言，屏幕阅读器才不会念错。
 */
export default function LangToggle({ lang, setLang, compact = false }: {
  lang: Lang; setLang: (l: Lang) => void; compact?: boolean
}) {
  const next: Lang = lang === 'zh' ? 'en' : 'zh'

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className={'lab-ib lab-ib-lang' + (compact ? ' is-sm' : '')}
      lang={lang === 'zh' ? 'zh-CN' : 'en'}
      title={next === 'en' ? 'Switch to English' : '切换到中文'}
      aria-label={next === 'en' ? 'Switch to English' : '切换到中文'}
    >
      {lang === 'zh' ? 'CN' : 'EN'}
    </button>
  )
}
