import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './styles/base.css'
import { applyStoredTheme } from './lab/theme'
import { applyStoredLang } from './lab/lang'
import App from './App'

applyStoredTheme()
applyStoredLang()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
