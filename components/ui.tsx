import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  PRIORITY_LABEL,
  priorityColor,
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
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70', className)} style={style}>
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
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
      <p className="font-semibold text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  )
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="press inline-flex items-center gap-1 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
      style={{ backgroundColor: 'var(--brand)' }}
    >
      {children}
    </Link>
  )
}

const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  attivo: 'bg-sky-100 text-sky-700',
  in_corso: 'bg-amber-100 text-amber-700',
  completato: 'bg-emerald-100 text-emerald-700',
  sospeso: 'bg-slate-200 text-slate-600',
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', PROJECT_STATUS_STYLE[status])}>
      {PROJECT_STATUS_LABEL[status]}
    </span>
  )
}

const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  da_fare: 'bg-slate-200 text-slate-600',
  in_corso: 'bg-amber-100 text-amber-700',
  in_revisione: 'bg-violet-100 text-violet-700',
  completato: 'bg-emerald-100 text-emerald-700',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', TASK_STATUS_STYLE[status])}>
      {TASK_STATUS_LABEL[status]}
    </span>
  )
}

// Indicatore priorità 1–5 (pallini colorati)
export function PriorityPips({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Priorità: ${PRIORITY_LABEL[level] ?? level}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn('h-1.5 w-1.5 rounded-full', i <= level ? priorityColor(level) : 'bg-slate-200')}
        />
      ))}
    </span>
  )
}

export function Avatar({ name }: { name: string | null | undefined }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand"
      style={{ backgroundColor: 'var(--brand-50)', color: 'var(--brand)' }}>
      {initials}
    </span>
  )
}
