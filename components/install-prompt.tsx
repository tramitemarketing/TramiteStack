'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogoMark } from '@/components/logo'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'tstack-install-dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Già installata? Non mostrare.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return
    if (localStorage.getItem(DISMISS_KEY)) return

    const ua = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    if (ios) {
      // Rilevazione ambiente al mount (non un loop di render).
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsIOS(true)
      setVisible(true)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-2xl px-4"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-slate-200">
            <LogoMark size={40} boxed />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Installa T-Stack</p>
              {isIOS ? (
                <p className="text-xs text-slate-500">Tocca Condividi ⬆️ e poi “Aggiungi a Home”.</p>
              ) : (
                <p className="text-xs text-slate-500">Aggiungila al telefono per aprirla come un’app.</p>
              )}
            </div>
            {!isIOS && (
              <button
                onClick={install}
                className="press rounded-xl px-3 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                Installa
              </button>
            )}
            <button onClick={dismiss} className="press p-1 text-slate-400" aria-label="Chiudi">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
