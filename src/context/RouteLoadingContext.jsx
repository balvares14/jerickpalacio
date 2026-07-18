import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'

const RouteLoadingContext = createContext(null)

const HIDE_DEBOUNCE_MS = 280

function isInternalNavLink(anchor) {
  if (!anchor || anchor.tagName !== 'A') return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return false
    const next = `${url.pathname}${url.search}`
    const current = `${window.location.pathname}${window.location.search}`
    return next !== current
  } catch {
    return false
  }
}

function routeKey(pathname) {
  if (pathname === '/' || pathname === '/work') return '/work'
  return pathname
}

export function RouteLoadingProvider({ children }) {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const pathRef = useRef(routeKey(location.pathname))
  const hideTimer = useRef(null)
  const contentLoadingRef = useRef(false)

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const show = useCallback(() => {
    clearHideTimer()
    setVisible(true)
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    hideTimer.current = setTimeout(() => {
      if (!contentLoadingRef.current) setVisible(false)
    }, HIDE_DEBOUNCE_MS)
  }, [])

  const setPageLoading = useCallback(
    (loading) => {
      contentLoadingRef.current = Boolean(loading)
      if (loading) show()
      else scheduleHide()
    },
    [show, scheduleHide],
  )

  // Capture header / work-grid / in-app link clicks before navigation
  useEffect(() => {
    function onClick(event) {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target.closest?.('a')
      if (!isInternalNavLink(anchor)) return
      if (anchor.pathname.startsWith('/admin') || location.pathname.startsWith('/admin')) return
      // Treat / and /work as the same home route — no overlay for that swap
      if (routeKey(anchor.pathname) === routeKey(location.pathname)) return
      show()
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [location.pathname, show])

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      clearHideTimer()
      contentLoadingRef.current = false
      setVisible(false)
      pathRef.current = routeKey(location.pathname)
      return
    }

    const next = routeKey(location.pathname)
    if (pathRef.current !== next) {
      pathRef.current = next
      show()
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [location.pathname, show])

  useEffect(() => () => clearHideTimer(), [])

  const value = useMemo(
    () => ({ setPageLoading, showOverlay: visible }),
    [setPageLoading, visible],
  )

  return (
    <RouteLoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay active={visible && !location.pathname.startsWith('/admin')} />
    </RouteLoadingContext.Provider>
  )
}

export function useRouteLoading() {
  const ctx = useContext(RouteLoadingContext)
  if (!ctx) {
    return {
      setPageLoading: () => {},
      showOverlay: false,
    }
  }
  return ctx
}

/** Sync a page's data-loading flag into the shared route overlay. */
export function usePageLoading(loading) {
  const { setPageLoading } = useRouteLoading()
  useEffect(() => {
    setPageLoading(loading)
  }, [loading, setPageLoading])
}
