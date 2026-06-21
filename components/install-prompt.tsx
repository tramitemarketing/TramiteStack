'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogoMark } from '@/components/logo'
import { initInstall, subscribeInstall, canInstall, promptInstall, isIOS, isStandalone } from '@/lib/pwa-install'

const DISMISS_KEY = 'tstack-install-dismissed'

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    initInstall()
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return

    if (isIOS()) {
      // Rilevazione ambiente al mount (non un loop di render).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIos(true)
      setVisible(true)
      return
    }
    // Android: mostra il banner quando l'evento è disponibile.
    const update = () => { if (canInstall()) setVisible(true) }
    update()
    return subscribeInstall(update)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function install() {
    await promptInstall()
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
              {ios ? (
                <p className="text-xs text-slate-500">Tocca Condividi ⬆️ e poi “Aggiungi a Home”.</p>
              ) : (
                <p className="text-xs text-slate-500">Aggiungila al telefono per aprirla come un’app.</p>
              )}
            </div>
            {!ios && (
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
