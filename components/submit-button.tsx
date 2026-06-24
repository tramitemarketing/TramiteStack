'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'
import { buttonClasses, type ButtonVariant, type ButtonSize } from '@/components/button'

// Bottone di submit con spinner inline (niente overlay a tutto schermo).
// Riusa le classi di Button per coerenza visiva nei form server-action.
export function SubmitButton({
  children,
  className,
  pendingLabel,
  variant = 'primary',
  size = 'md',
  fullWidth,
}: {
  children: React.ReactNode
  className?: string
  pendingLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={buttonClasses(variant, size, fullWidth, className)}>
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
