import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/button'
import {
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  PRIORITY_LABEL,
  priorityBadge,
  type ProjectStatus,
  type TaskStatus,
} from '@/types/database'

export function Card({
  className,
  style,
  children,
  onClick,
}: {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div className={cn('rounded-xl bg-white p-4 ring-1 ring-[#E0E4EB] shadow-[0_1px_2px_rgba(16,40,80,0.04)]', className)} style={style} onClick={onClick}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[26px] font-extrabold leading-none tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm font-medium text-[#5A6473]">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function EmptyState({
  title,
  hint,
  illustration,
  action,
}: {
  title: string
  hint?: string
  illustration?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="dot-grid flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#C4CBD6] bg-[#F7F8FA] px-5 py-8 text-center">
      {illustration}
      <div>
        <p className="font-display font-bold text-[#1A1F2B]">{title}</p>
        {hint && <p className="mt-1 text-sm font-medium text-[#6B7280]">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <ButtonLink href={href} size="sm">
      {children}
    </ButtonLink>
  )
}

// Bottone quadrato outline (azioni icona: filtra, cerca…)
export function IconButton({
  children,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('press flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E0E4EB] bg-white text-[#3E4757]', className)}
    >
      {children}
    </button>
  )
}

const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  attivo: 'bg-[#EEF5FC] text-[#2A78C2]',
  in_corso: 'bg-[#FDF4DD] text-[#C8932B]',
  completato: 'bg-[#E6F3EC] text-[#1F8A5B]',
  sospeso: 'bg-[#EFF1F5] text-[#5A6473]',
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('rounded-md px-2.5 py-1 text-[11px] font-bold', PROJECT_STATUS_STYLE[status])}>
      {PROJECT_STATUS_LABEL[status]}
    </span>
  )
}

const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  da_fare: 'bg-[#EFF1F5] text-[#5A6473]',
  in_corso: 'bg-[#FDF4DD] text-[#C8932B]',
  in_revisione: 'bg-[#EFE8FB] text-[#7C5CD6]',
  completato: 'bg-[#E6F3EC] text-[#1F8A5B]',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold', TASK_STATUS_STYLE[status])}>
      {TASK_STATUS_LABEL[status]}
    </span>
  )
}

// Barra di avanzamento (task completate / totali)
export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B7280]">
        <span>{done}/{total} task completate</span>
        <span className="tnum">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFF1F5]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? 'var(--ok)' : 'var(--brand)' }} />
      </div>
    </div>
  )
}

// Badge priorità "P#" colorato
export function PriorityBadge({ level }: { level: number }) {
  return (
    <span
      className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-extrabold', priorityBadge(level))}
      title={`Priorità: ${PRIORITY_LABEL[level] ?? level}`}
    >
      P{level}
    </span>
  )
}

// Avatar a iniziali con colore deterministico (preferisce un id stabile)
const AVATAR_COLORS = ['#0F4C81', '#7C5CD6', '#1F8A5B', '#2A78C2', '#C8932B', '#D8553F', '#0E7C86', '#B4458E']

export function Avatar({
  name,
  size = 24,
  colorKey,
  color,
}: {
  name: string | null | undefined
  size?: number
  colorKey?: string | null
  color?: string | null
}) {
  const label = name || '?'
  const initials = label
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const key = colorKey || label
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  const bg = color || AVATAR_COLORS[hash % AVATAR_COLORS.length]
  return (
    <span
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  )
}
