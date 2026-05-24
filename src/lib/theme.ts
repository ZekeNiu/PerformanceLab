import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'sportpulse-theme'
const THEME_CHANGE_EVENT = 'sportpulse-theme-change'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

export function applyThemeMode(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('light', theme === 'light')
}

export function persistThemeMode(theme: ThemeMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: theme }))
}

export function useAppTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme())

  useEffect(() => {
    applyThemeMode(theme)
  }, [theme])

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = event instanceof CustomEvent ? event.detail : getStoredTheme()
      if (nextTheme === 'dark' || nextTheme === 'light') {
        setThemeState(nextTheme)
        applyThemeMode(nextTheme)
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        const nextTheme = event.newValue === 'light' ? 'light' : 'dark'
        setThemeState(nextTheme)
        applyThemeMode(nextTheme)
      }
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme)
    applyThemeMode(nextTheme)
    persistThemeMode(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme }
}
