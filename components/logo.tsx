// Logo T-Stack: tre barre impilate (navy / blu / oro) = livelli di lavoro organizzati.
import { cn } from '@/lib/utils'

export function LogoMark({
  size = 32,
  variant = 'color',
  boxed = false,
}: {
  size?: number
  variant?: 'color' | 'knockout' | 'mono'
  boxed?: boolean
}) {
  const fills =
    variant === 'knockout'
      ? ['#FFFFFF', '#7DB2E6', '#F2C14E']
      : variant === 'mono'
        ? ['#0F4C81', '#0F4C81', '#0F4C81']
        : ['#0F4C81', '#4A93D9', '#F2C14E']

  const bars = (
    <svg width={boxed ? size * 0.6 : size} height={boxed ? size * 0.6 : size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="6" y="8" width="28" height="7" rx="2.5" fill={fills[0]} />
      <rect x="6" y="18" width="28" height="7" rx="2.5" fill={fills[1]} />
      <rect x="6" y="28" width="28" height="7" rx="2.5" fill={fills[2]} />
    </svg>
  )

  if (boxed) {
    return (
      <span
        className="flex items-center justify-center"
        style={{ width: size, height: size, borderRadius: size * 0.23, background: '#0F4C81' }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40" fill="none" aria-hidden>
          <rect x="6" y="8" width="28" height="7" rx="2.5" fill="#FFFFFF" />
          <rect x="6" y="18" width="28" height="7" rx="2.5" fill="#7DB2E6" />
          <rect x="6" y="28" width="28" height="7" rx="2.5" fill="#F2C14E" />
        </svg>
      </span>
    )
  }
  return bars
}

export function LogoWordmark({
  size = 30,
  dark = false,
  className,
}: {
  size?: number
  dark?: boolean
  className?: string
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} variant={dark ? 'knockout' : 'color'} />
      <span
        className="font-display text-lg font-bold tracking-tight"
        style={{ color: dark ? '#FFFFFF' : '#0A2E4D' }}
      >
        T-Stack
      </span>
    </span>
  )
}
