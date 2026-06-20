'use client'

import { useRef } from 'react'

// <details> che, quando viene espanso, porta automaticamente l'utente su di sé.
export function AutoScrollDetails({
  summary,
  children,
}: {
  summary: React.ReactNode
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)

  function onToggle() {
    if (ref.current?.open) {
      // Attende l'espansione, poi scrolla con un po' di margine.
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 60)
    }
  }

  return (
    <details ref={ref} onToggle={onToggle}>
      <summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--brand)' }}>
        {summary}
      </summary>
      {children}
    </details>
  )
}
