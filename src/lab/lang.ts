import { useCallback, useEffect, useState } from 'react'
import type { I18n, Lang } from './registry'

const KEY = 'agent-ui-lab:lang'

export function readLang(): Lang {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'zh' } catch { return 'zh' }
}

/** 在首屏渲染之前调用，避免闪一下中文 */
export function applyStoredLang() {
  document.documentElement.lang = readLang() === 'en' ? 'en' : 'zh-CN'
}

export function useLang() {
  const [lang, setLang] = useState<Lang>(readLang)

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
    try { localStorage.setItem(KEY, lang) } catch { /* 隐私模式下写不进去 */ }
  }, [lang])

  const t = useCallback((v: I18n) => v[lang], [lang])
  return { lang, setLang, t }
}
