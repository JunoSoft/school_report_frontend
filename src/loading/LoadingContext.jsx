import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { bindLoadingHandlers } from '../api/client'

const LoadingContext = createContext(null)

export function Spinner({ className = 'h-10 w-10', label }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div
        className={`animate-spin rounded-full border-[3px] border-line border-t-forest ${className}`}
        aria-hidden="true"
      />
      {label ? <p className="text-sm font-medium text-ink/70">{label}</p> : null}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function LoadingProvider({ children }) {
  const [pending, setPending] = useState(0)
  const [visible, setVisible] = useState(false)
  const showTimer = useRef(null)

  const start = useCallback(() => {
    setPending((n) => n + 1)
  }, [])

  const stop = useCallback(() => {
    setPending((n) => Math.max(0, n - 1))
  }, [])

  useEffect(() => {
    bindLoadingHandlers({ start, stop })
    return () => bindLoadingHandlers(null)
  }, [start, stop])

  useEffect(() => {
    if (pending > 0) {
      if (!showTimer.current) {
        showTimer.current = setTimeout(() => setVisible(true), 160)
      }
      return
    }
    if (showTimer.current) {
      clearTimeout(showTimer.current)
      showTimer.current = null
    }
    setVisible(false)
  }, [pending])

  useEffect(() => () => {
    if (showTimer.current) clearTimeout(showTimer.current)
  }, [])

  const value = useMemo(() => ({ pending, busy: pending > 0 }), [pending])

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {visible && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/25 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-paper px-8 py-6 shadow-xl">
            <Spinner label="Please wait…" />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider')
  return ctx
}
