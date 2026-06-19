import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  type ProjectStatus,
  type TaskStatus,
  type TaskPriority,
} from '@/types/database'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200', className)}>
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
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <p className="font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  )
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white active:scale-[0.98]"
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
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PROJECT_STATUS_STYLE[status])}>
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
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TASK_STATUS_STYLE[status])}>
      {TASK_STATUS_LABEL[status]}
    </span>
  )
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  bassa: 'text-slate-400',
  media: 'text-amber-500',
  alta: 'text-red-500',
}

export function PriorityDot({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', PRIORITY_STYLE[priority])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {TASK_PRIORITY_LABEL[priority]}
    </span>
  )
}
