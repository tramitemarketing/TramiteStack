'use client'

import { useFormStatus } from 'react-dom'

// Spinner a cerchio classico, centrato sullo schermo (overlay).
export function CenterSpinner() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
      <span className="spinner" style={{ width: '2.75rem', height: '2.75rem', borderWidth: '3px' }} />
    </div>
  )
}

// Da inserire dentro un <form>: mostra lo spinner centrale finché l'azione è in corso.
export function SubmitSpinner() {
  const { pending } = useFormStatus()
  return pending ? <CenterSpinner /> : null
}
