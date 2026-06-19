import { format } from 'date-fns'
import { it } from 'date-fns/locale'

// Formatta un importo in Euro (it-IT).
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount ?? 0)
}

// Formatta una data ISO/yyyy-mm-dd in formato leggibile italiano.
export function formatDate(value: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!value) return '—'
  try {
    return format(new Date(value), pattern, { locale: it })
  } catch {
    return '—'
  }
}

// Unisce classi condizionali (mini-clsx).
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
