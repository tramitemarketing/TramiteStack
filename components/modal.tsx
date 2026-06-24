'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

// Dialog accessibile: focus trap, chiusura con Esc, scroll-lock, role/aria,
// rispetto di prefers-reduced-motion. Sostituisce le modali ad-hoc duplicate.
export function Modal({
  open,
  onClose,
  title,
  children,
  panelClassName,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  panelClassName?: string
}) {
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const reduce = useReducedMotion()

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  // Scroll-lock del body mentre la modale è aperta.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Focus iniziale + ripristino, Esc per chiudere, trap del Tab.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    // Porta il focus dentro la modale (primo campo o pannello).
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (nodes.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const firstEl = nodes[0]
      const lastEl = nodes[nodes.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey && (activeEl === firstEl || activeEl === panel)) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && activeEl === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!mounted) return null

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/40 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn('my-auto w-full max-w-md rounded-t-3xl bg-white p-5 outline-none sm:rounded-3xl', panelClassName)}
            initial={reduce ? false : { y: 40, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={titleId} className="font-display text-lg font-bold text-navy">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="press -mr-1.5 -mt-1 flex h-11 w-11 items-center justify-center rounded-xl text-[#5A6473] hover:bg-[#EFF1F5]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(overlay, document.body)
}
