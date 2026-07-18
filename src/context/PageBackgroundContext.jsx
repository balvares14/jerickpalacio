import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const PageThemeContext = createContext(null)

const emptyTheme = {
  background_color: null,
  text_color: null,
  font_family: null,
}

export function PageThemeProvider({ children }) {
  const [pageTheme, setPageThemeState] = useState(emptyTheme)

  const setPageTheme = useCallback((partial) => {
    setPageThemeState({
      background_color: partial?.background_color ?? null,
      text_color: partial?.text_color ?? null,
      font_family: partial?.font_family ?? null,
    })
  }, [])

  const clearPageTheme = useCallback(() => {
    setPageThemeState(emptyTheme)
  }, [])

  const value = useMemo(
    () => ({ pageTheme, setPageTheme, clearPageTheme }),
    [pageTheme, setPageTheme, clearPageTheme],
  )

  return <PageThemeContext.Provider value={value}>{children}</PageThemeContext.Provider>
}

export function usePageThemeContext() {
  const ctx = useContext(PageThemeContext)
  if (!ctx) {
    return {
      pageTheme: emptyTheme,
      setPageTheme: () => {},
      clearPageTheme: () => {},
    }
  }
  return ctx
}

/** Apply this page's theme overrides while mounted; clears on leave. */
export function usePageTheme(theme) {
  const { setPageTheme, clearPageTheme } = usePageThemeContext()
  const background_color = theme?.background_color ?? null
  const text_color = theme?.text_color ?? null
  const font_family = theme?.font_family ?? null

  useEffect(() => {
    setPageTheme({ background_color, text_color, font_family })
    return () => clearPageTheme()
  }, [background_color, text_color, font_family, setPageTheme, clearPageTheme])
}

/** @deprecated use usePageTheme */
export function usePageBackground(color) {
  usePageTheme({ background_color: color })
}
