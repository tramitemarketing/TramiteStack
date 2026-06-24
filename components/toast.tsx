'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: number; kind: ToastKind; message: string }

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const STYLE: Record<ToastKind, string> = {
  success: 'border-[#BFE3CF] bg-[#E6F3EC] text-[#16633F]',
  error: 'border-[#F0C9C0] bg-[#FBEAE6] text-[#9A2F1B]',
  info: 'border-[#BFD9F2] bg-[#EEF5FC] text-[#0F4C81]',
}

const ROLE: Record<ToastKind, 'status' | 'alert'> = {
  success: 'status',
  info: 'status',
  error: 'alert',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: string) => {
    idRef.current += 1
    const id = idRef.current
    setItems((prev) => [...prev, { id, kind, message }])
  }, [])

  const api: ToastApi = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((t) => (
            <Toast key={t.id} item={t} onDone={() => remove(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, item.kind === 'error' ? 5000 : 3200)
    return () => clearTimeout(timer)
  }, [item.kind, onDone])

  return (
    <motion.div
      role={ROLE[item.kind]}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${STYLE[item.kind]}`}
      onClick={onDone}
    >
      {item.message}
    </motion.div>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback no-op se usato fuori dal provider (non blocca il render).
    return { success: () => {}, error: () => {}, info: () => {} }
  }
  return ctx
}
