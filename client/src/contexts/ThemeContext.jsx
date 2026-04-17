import { useLayoutEffect } from 'react'

const applyTheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark)
}

export function ThemeProvider({ children }) {
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mediaQuery.matches)
    const handler = (e) => applyTheme(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return children
}
