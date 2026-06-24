import { cn } from '@/lib/utils'

// Classi condivise dei campi form (prima duplicate in 5+ file).
// min-h 44px → touch target adeguato; anello di focus accessibile.
export const inputCls =
  'w-full min-h-[44px] rounded-xl border border-[#CBD2DC] bg-white px-3.5 py-2.5 text-base text-[#1A1F2B] outline-none transition placeholder:text-[#8A93A3] focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'

export const labelCls = 'mb-1.5 block text-sm font-semibold text-[#3E4757]'

export function Label({
  htmlFor,
  required,
  children,
  className,
}: {
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn(labelCls, className)}>
      {children}
      {required && (
        <span className="text-danger" aria-hidden>
          {' '}*
        </span>
      )}
    </label>
  )
}

// Wrapper campo: label associata (htmlFor) + controllo + hint + errore.
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  error?: string | null
  children: React.ReactNode
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined
  const errId = error ? `${htmlFor}-error` : undefined
  return (
    <div>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs font-medium text-[#6B7280]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

// Banner d'errore generale (in cima ai form).
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg border border-[#F0C9C0] bg-[#FBEAE6] px-3 py-2 text-sm font-medium text-[#9A2F1B]">
      {message}
    </p>
  )
}
