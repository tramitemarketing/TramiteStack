'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

// Bottone di submit con spinner inline (niente overlay a tutto schermo).
export function SubmitButton({
  children,
  className,
  pendingLabel,
  style,
}: {
  children: React.ReactNode
  className?: string
  pendingLabel?: string
  style?: React.CSSProperties
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn('press inline-flex items-center justify-center gap-2 disabled:opacity-70', className)} style={style}>
      {pending && <span className="spinner" style={{ width: '1rem', height: '1rem', borderTopColor: 'currentColor' }} />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}

// Icona di submit (cestino, ecc.): mostra lo spinner al posto dell'icona quando pending.
export function SubmitIcon({
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className?: string
  label: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-label={label} className={cn('press', className)}>
      {pending ? <span className="spinner" style={{ width: '0.9rem', height: '0.9rem' }} /> : children}
    </button>
  )
}
