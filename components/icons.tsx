// Set icone T-Stack · griglia 24px · linea 2px · usano currentColor.
import { cn } from '@/lib/utils'

type P = { className?: string; size?: number; strokeWidth?: number }

function Svg({ className, size = 24, strokeWidth = 2, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/* ===== Navigazione ===== */
export const IconHome = (p: P) => (<Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></Svg>)
export const IconTask = (p: P) => (<Svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12l2.2 2.2L16 9" /></Svg>)
export const IconCalendar = (p: P) => (<Svg {...p}><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M4 9.5h16M8 3v4M16 3v4" /></Svg>)
export const IconBudget = (p: P) => (<Svg {...p}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16.5 14.5h.01" /></Svg>)
export const IconProjects = (p: P) => (<Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>)

/* ===== Azioni ===== */
export const IconPlus = (p: P) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>)
export const IconClose = (p: P) => (<Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>)
export const IconCheck = (p: P) => (<Svg {...p}><path d="M5 12l5 5L20 6" /></Svg>)
export const IconEdit = (p: P) => (<Svg {...p}><path d="M16.5 4.5l3 3L8 19l-4 1 1-4z" /></Svg>)
export const IconTrash = (p: P) => (<Svg {...p}><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" /></Svg>)
export const IconSearch = (p: P) => (<Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>)
export const IconFilter = (p: P) => (<Svg {...p}><path d="M3 5h18M6 12h12M10 19h4" /></Svg>)
export const IconAttach = (p: P) => (<Svg {...p}><path d="M19 11l-7.5 7.5a3.5 3.5 0 0 1-5-5L13 6a2.3 2.3 0 0 1 3.3 3.3L9 16.5" /></Svg>)
export const IconUpload = (p: P) => (<Svg {...p}><path d="M12 16V4M7 9l5-5 5 5M5 18v2h14v-2" /></Svg>)
export const IconFile = (p: P) => (<Svg {...p}><path d="M14 3v5h5" /><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /></Svg>)

/* ===== Direzioni ===== */
export const IconBack = (p: P) => (<Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>)
export const IconChevronLeft = (p: P) => (<Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>)
export const IconChevronRight = (p: P) => (<Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>)
export const IconChevronDown = (p: P) => (<Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>)

/* ===== Bilancio / meta ===== */
export const IconEuro = (p: P) => (<Svg {...p}><path d="M17 8a6 6 0 1 0 0 8" /><path d="M4 11h9M4 14h7" /></Svg>)
export const IconUp = (p: P) => (<Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>)
export const IconDown = (p: P) => (<Svg {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>)
export const IconClock = (p: P) => (<Svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></Svg>)
export const IconBell = (p: P) => (<Svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 21a2 2 0 0 0 4 0" /></Svg>)

/* ⋮ menu (riempito) */
export const IconDots = ({ className, size = 24 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cn('shrink-0', className)} aria-hidden>
    <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
  </svg>
)
