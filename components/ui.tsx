import Link from 'next/link'
import { cn } from '@/lib/utils'
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
}: {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-xl bg-white p-4 ring-1 ring-[#E0E4EB] shadow-[0_1px_2px_rgba(16,40,80,0.04)]', className)} style={style}>
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
        {hint && <p className="mt-1 text-sm font-medium text-[#9CA5B3]">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="press inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-sm font-bold text-white shadow-sm"
      style={{ backgroundColor: 'var(--brand)' }}
    >
      {children}
    </Link>
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

// Avatar a iniziali con colore deterministico dal nome
const AVATAR_COLORS = ['#0F4C81', '#7C5CD6', '#1F8A5B', '#2A78C2', '#C8932B', '#D8553F']

export function Avatar({ name, size = 24 }: { name: string | null | undefined; size?: number }) {
  const label = name || '?'
  const initials = label
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  const bg = AVATAR_COLORS[hash % AVATAR_COLORS.length]
  return (
    <span
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  )
}
