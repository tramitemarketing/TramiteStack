import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { CalendarView, type CalItem } from '@/components/calendar-view'
import type { CalendarEvent, Task, Project } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ off?: string }>
}) {
  const { off: offParam } = await searchParams
  const off = Number(offParam) || 0

  const base = addMonths(new Date(), off)
  const rangeStart = startOfWeek(startOfMonth(base), { weekStartsOn: 1 })
  const rangeEnd = endOfWeek(endOfMonth(base), { weekStartsOn: 1 })
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
      key: 'e' + e.id, eventId: e.id, date: e.starts_at.slice(0, 10), title: e.title, kind: 'evento' as const,
    })),
    ...((tasks as Pick<Task, 'id' | 'title' | 'due_date'>[] | null) ?? []).map((t) => ({
      key: 't' + t.id, date: t.due_date as string, title: 'Task: ' + t.title, kind: 'task' as const,
    })),
    ...((projects as Pick<Project, 'id' | 'name' | 'due_date'>[] | null) ?? []).map((p) => ({
      key: 'p' + p.id, date: p.due_date as string, title: 'Consegna: ' + p.name, kind: 'progetto' as const,
    })),
  ]

  const projects2 = (projList as Pick<Project, 'id' | 'name'>[] | null) ?? []

  return (
    <div className="space-y-5">
      <CalendarView items={items} off={off} projects={projects2} />
    </div>
  )
}
