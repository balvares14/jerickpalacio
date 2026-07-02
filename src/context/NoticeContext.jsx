import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import FloatingNotice from '../components/admin/FloatingNotice'
import BlockingErrorOverlay from '../components/admin/BlockingErrorOverlay'

const NoticeContext = createContext(null)

const DEFAULT_SUCCESS = {
  title: 'Success',
  message: '',
  backgroundColor: '#e6f4ea',
  borderColor: '#137333',
  textColor: '#137333',
  dismissOnClick: true,
  autoDismissMs: 4500,
}

const DEFAULT_ERROR = {
  title: 'Something went wrong',
  message:
    'An unexpected error occurred. Please reload the page using your browser refresh control. If the problem continues, try again later or contact support.',
}

export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null)
  const [blockingError, setBlockingError] = useState(null)
  const timerRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const dismissNotice = useCallback(() => {
    clearTimer()
    setNotice(null)
  }, [clearTimer])

  const showNotice = useCallback(
    (options = {}) => {
      clearTimer()
      const next = { ...DEFAULT_SUCCESS, ...options, id: Date.now() }
      setNotice(next)

      if (next.autoDismissMs > 0) {
        timerRef.current = setTimeout(() => {
          setNotice(null)
          timerRef.current = null
        }, next.autoDismissMs)
      }
    },
    [clearTimer],
  )

  const showBlockingError = useCallback(
    (options = {}) => {
      clearTimer()
      setNotice(null)
      setBlockingError({ ...DEFAULT_ERROR, ...options })
    },
    [clearTimer],
  )

  useEffect(() => () => clearTimer(), [clearTimer])

  const value = useMemo(
    () => ({ showNotice, showBlockingError, dismissNotice }),
    [showNotice, showBlockingError, dismissNotice],
  )

  return (
    <NoticeContext.Provider value={value}>
      {children}
      {notice && (
        <FloatingNotice
          title={notice.title}
          message={notice.message}
          backgroundColor={notice.backgroundColor}
          borderColor={notice.borderColor}
          textColor={notice.textColor}
          dismissOnClick={notice.dismissOnClick}
          onDismiss={dismissNotice}
        />
      )}
      {blockingError && (
        <BlockingErrorOverlay title={blockingError.title} message={blockingError.message} />
      )}
    </NoticeContext.Provider>
  )
}

export function useNotice() {
  const ctx = useContext(NoticeContext)
  if (!ctx) throw new Error('useNotice must be used within NoticeProvider')
  return ctx
}
