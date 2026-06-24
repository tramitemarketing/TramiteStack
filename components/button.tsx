import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

// Base condivisa: touch target adeguato, focus gestito globalmente in globals.css.
const BASE =
  'press inline-flex items-center justify-center gap-2 rounded-xl font-bold leading-none transition disabled:opacity-60 disabled:pointer-events-none select-none'

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-3.5 text-sm',
  md: 'min-h-[44px] px-4 text-[15px]',
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'on-brand bg-brand text-white shadow-sm hover:bg-brand-600',
  secondary: 'bg-white text-[#1A1F2B] ring-1 ring-[#E0E4EB] hover:bg-[#F7F8FA]',
  ghost: 'bg-transparent text-[#5A6473] hover:bg-[#EFF1F5]',
  danger: 'bg-[#D8553F] text-white shadow-sm hover:bg-[#c4452f]',
}

function classes(variant: ButtonVariant, size: ButtonSize, fullWidth?: boolean, className?: string) {
  return cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && 'w-full', className)
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  loadingLabel,
  className,
  disabled,
  type = 'button',
  ...rest
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  loadingLabel?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes(variant, size, fullWidth, className)}
      {...rest}
    >
      {loading && <span className="spinner" style={{ borderTopColor: 'currentColor', borderColor: 'rgba(255,255,255,0.4)' }} aria-hidden />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  )
}

export function ButtonLink({
  children,
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...rest
}: {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </Link>
  )
}
