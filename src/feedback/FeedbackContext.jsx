import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

const FeedbackContext = createContext(null)

export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [dialog, setDialog] = useState(null)
  const toastTimer = useRef(null)

  const clearToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(null)
  }, [])

  const showToast = useCallback((type, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const success = useCallback((message) => showToast('success', message), [showToast])
  const error = useCallback((message) => showToast('error', message), [showToast])

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : (options || {})
    return new Promise((resolve) => {
      setDialog({
        title: opts.title || 'Please confirm',
        message: opts.message || 'Are you sure you want to continue?',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        danger: !!opts.danger,
        resolve,
      })
    })
  }, [])

  const closeDialog = (result) => {
    dialog?.resolve(result)
    setDialog(null)
  }

  const value = useMemo(() => ({ success, error, confirm }), [success, error, confirm])

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm animate-[fadeIn_.2s_ease]">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
            role="status"
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
              : <XCircle className="mt-0.5 shrink-0 text-red-600" size={20} />}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button type="button" onClick={clearToast} className="rounded-lg p-1 opacity-60 hover:opacity-100" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-2xl" role="alertdialog" aria-modal="true">
            <h2 className="text-lg font-semibold text-ink">{dialog.title}</h2>
            <p className="mt-2 text-sm text-ink/70">{dialog.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => closeDialog(false)}
                className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
              >
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeDialog(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  dialog.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-forest hover:bg-forest-soft'
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider')
  return ctx
}
