import { useCallback, useEffect, useState } from 'react'

export type LabTheme = 'dark' | 'light'

const KEY = 'agent-ui-lab:theme'

export function readTheme(): LabTheme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** 在首屏渲染之前调用，避免闪一下深色 */
export function applyStoredTheme() {
  document.documentElement.dataset.labTheme = readTheme()
}

export function useLabTheme() {
  const [theme, setTheme] = useState<LabTheme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.labTheme = theme
    try { localStorage.setItem(KEY, theme) } catch { /* 隐私模式下写不进去，无所谓 */ }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { theme, setTheme, toggle }
}
