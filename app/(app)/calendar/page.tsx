import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { Card, PageHeader } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { createEvent } from '@/app/(app)/actions'
import type { CalendarEvent, Task, Project } from '@/types/database'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export default async function CalendarPage() {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const [{ data: events }, { data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*')
      .gte('starts_at', gridStart.toISOString())
      .lte('starts_at', gridEnd.toISOString())
      .order('starts_at'),
    supabase
      .from('tasks')
      .select('id, title, due_date, status')
      .gte('due_date', format(gridStart, 'yyyy-MM-dd'))
      .lte('due_date', format(gridEnd, 'yyyy-MM-dd'))
      .neq('status', 'completato'),
    supabase.from('projects').select('id, name').order('name'),
  ])

  const evRows = (events as CalendarEvent[] | null) ?? []
  const taskRows = (tasks as Pick<Task, 'id' | 'title' | 'due_date' | 'status'>[] | null) ?? []
  const projList = (projects as Pick<Project, 'id' | 'name'>[] | null) ?? []

  // Conteggio elementi per giorno (eventi + scadenze)
  function countForDay(d: Date): number {
    const key = format(d, 'yyyy-MM-dd')
    const ev = evRows.filter((e) => e.starts_at.slice(0, 10) === key).length
    const tk = taskRows.filter((t) => t.due_date === key).length
    return ev + tk
  }

  const upcoming = evRows
    .filter((e) => new Date(e.starts_at) >= new Date(now.toDateString()))
    .slice(0, 6)

  return (
    <div className="space-y-5">
      <PageHeader title="Calendario" subtitle={format(now, 'MMMM yyyy', { locale: it })} />

      <Card className="p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const count = countForDay(d)
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-lg text-sm',
                  isSameMonth(d, now) ? 'text-slate-700' : 'text-slate-300',
                  isToday(d) && 'bg-indigo-600 font-bold text-white',
                )}
              >
                {format(d, 'd')}
                {count > 0 && (
                  <span className={cn('mt-0.5 h-1.5 w-1.5 rounded-full', isToday(d) ? 'bg-white' : 'bg-indigo-500')} />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <section>
        <h2 className="mb-2 font-semibold">Prossimi eventi</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Nessun evento in programma.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => (
              <Card key={e.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(e.starts_at, "d MMM yyyy, HH:mm")}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <details>
          <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Nuovo evento</summary>
          <Card className="mt-2">
            <form action={createEvent} className="space-y-3">
              <input name="title" required className={inputCls} placeholder="Titolo evento" />
              <input type="datetime-local" name="starts_at" required className={inputCls} />
              <select name="project_id" className={inputCls} defaultValue="">
                <option value="">— Nessun progetto —</option>
                {projList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input name="description" className={inputCls} placeholder="Note (facoltative)" />
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                Aggiungi evento
              </button>
            </form>
          </Card>
        </details>
      </section>
    </div>
  )
}
