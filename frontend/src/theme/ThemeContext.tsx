import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => {},
  setMode: () => {},
})

const STORAGE_KEY = 'openlist-theme'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  // 默认跟随浏览器主题
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode)

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  // 监听系统主题变化（当用户未手动选择时跟随）
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) setModeState(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    document.documentElement.style.colorScheme = mode
  }, [mode])

  const value = useMemo(() => ({ mode, toggle, setMode }), [mode, toggle, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
