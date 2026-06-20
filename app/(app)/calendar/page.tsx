import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, Card } from '@/components/ui'
import { CalendarView, type CalItem } from '@/components/calendar-view'
import { SubmitSpinner } from '@/components/loading-overlay'
import { createEvent } from '@/app/(app)/actions'
import type { CalendarEvent, Task, Project } from '@/types/database'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-violet-200'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ off?: string }>
}) {
  const { off: offParam } = await searchParams
  const off = Number(offParam) || 0

  const base = addMonths(new Date(), off)
  const rangeStart = startOfWeek(startOfMonth(base), { weekStartsOn: 1 })
  const rangeEnd = endOfWeek(endOfMonth(addMonths(base, 1)), { weekStartsOn: 1 })
  const sIso = rangeStart.toISOString()
  const eIso = rangeEnd.toISOString()
  const sDay = format(rangeStart, 'yyyy-MM-dd')
  const eDay = format(rangeEnd, 'yyyy-MM-dd')

  const supabase = await createClient()
  const [{ data: events }, { data: tasks }, { data: projects }, { data: projList }] = await Promise.all([
    supabase.from('calendar_events').select('id, title, starts_at').gte('starts_at', sIso).lte('starts_at', eIso),
    supabase.from('tasks').select('id, title, due_date').gte('due_date', sDay).lte('due_date', eDay).neq('status', 'completato'),
    supabase.from('projects').select('id, name, due_date').gte('due_date', sDay).lte('due_date', eDay),
    supabase.from('projects').select('id, name').order('name'),
  ])

  const items: CalItem[] = [
    ...((events as Pick<CalendarEvent, 'id' | 'title' | 'starts_at'>[] | null) ?? []).map((e) => ({
      id: 'e' + e.id, date: e.starts_at.slice(0, 10), title: e.title, kind: 'evento' as const,
    })),
    ...((tasks as Pick<Task, 'id' | 'title' | 'due_date'>[] | null) ?? []).map((t) => ({
      id: 't' + t.id, date: t.due_date as string, title: 'Task: ' + t.title, kind: 'task' as const,
    })),
    ...((projects as Pick<Project, 'id' | 'name' | 'due_date'>[] | null) ?? []).map((p) => ({
      id: 'p' + p.id, date: p.due_date as string, title: 'Consegna: ' + p.name, kind: 'progetto' as const,
    })),
  ]

  const projects2 = (projList as Pick<Project, 'id' | 'name'>[] | null) ?? []

  return (
    <div className="space-y-5">
      <PageHeader title="Calendario" subtitle="Scadenze di task e progetti sincronizzate" />

      <CalendarView items={items} off={off} />

      <details>
        <summary className="cursor-pointer text-sm font-semibold text-brand" style={{ color: 'var(--brand)' }}>
          + Nuovo evento
        </summary>
        <Card className="mt-2">
          <form action={createEvent} className="space-y-3">
            <SubmitSpinner />
            <input name="title" required className={inputCls} placeholder="Titolo evento" />
            <input type="datetime-local" name="starts_at" required className={inputCls} />
            <select name="project_id" className={inputCls} defaultValue="">
              <option value="">— Nessun progetto —</option>
              {projects2.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input name="description" className={inputCls} placeholder="Note (facoltative)" />
            <button className="press w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
              Aggiungi evento
            </button>
          </form>
        </Card>
      </details>
    </div>
  )
}
