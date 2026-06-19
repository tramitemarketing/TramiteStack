import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, PriorityDot, EmptyState } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import {
  TASK_STATUS_ORDER,
  TASK_STATUS_LABEL,
  type Task,
  type TaskStatus,
} from '@/types/database'
import { setTaskStatus } from '@/app/(app)/actions'

export const dynamic = 'force-dynamic'

type TaskRow = Task & { projects: { id: string; name: string } | null }

const COLUMN_TINT: Record<TaskStatus, string> = {
  da_fare: 'border-t-slate-400',
  in_corso: 'border-t-amber-400',
  in_revisione: 'border-t-violet-400',
  completato: 'border-t-emerald-400',
}

export default async function TasksPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('*, projects(id, name)')
    .order('due_date', { ascending: true, nullsFirst: false })

  const tasks = (data as TaskRow[] | null) ?? []
  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s)

  return (
    <div className="space-y-4">
      <PageHeader title="Task" subtitle={`${tasks.length} totali`} />

      {tasks.length === 0 ? (
        <EmptyState title="Nessun task" hint="Aggiungi task dai progetti" />
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {TASK_STATUS_ORDER.map((status) => {
            const items = byStatus(status)
            return (
              <div key={status} className="w-64 shrink-0">
                <div className={cn('mb-2 flex items-center justify-between rounded-t-lg border-t-4 bg-white px-2 py-1.5 ring-1 ring-slate-200', COLUMN_TINT[status])}>
                  <span className="text-sm font-semibold">{TASK_STATUS_LABEL[status]}</span>
                  <span className="text-xs text-slate-400">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                      <p className="text-sm font-medium">{t.title}</p>
                      {t.projects && (
                        <Link href={`/projects/${t.projects.id}`} className="mt-0.5 block truncate text-xs text-indigo-600">
                          {t.projects.name}
                        </Link>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <PriorityDot priority={t.priority} />
                        {t.due_date && <span className="text-xs text-slate-400">{formatDate(t.due_date, 'd MMM')}</span>}
                      </div>
                      <form action={setTaskStatus} className="mt-2 flex items-center gap-1">
                        <input type="hidden" name="id" value={t.id} />
                        <select name="status" defaultValue={t.status} className="flex-1 rounded-md border border-slate-300 px-1.5 py-1 text-xs">
                          {TASK_STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {TASK_STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-md bg-slate-800 px-2 py-1 text-xs text-white">OK</button>
                      </form>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-300">
                      vuoto
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
