import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, Avatar, EmptyState } from '@/components/ui'
import { IconBack, IconCheck, IconUp, IconDown, IconCalendar } from '@/components/icons'
import { formatEuro, formatDate, cn } from '@/lib/utils'
import type { Task, Transaction, CalendarEvent, TaskStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

type MyTask = Pick<Task, 'id' | 'title' | 'status' | 'updated_at' | 'project_id'> & { projects: { name: string } | null }

const STAT_STYLE: Record<TaskStatus, string> = {
  da_fare: 'text-[#5A6473]',
  in_corso: 'text-[#C8932B]',
  in_revisione: 'text-[#7C5CD6]',
  completato: 'text-[#1F8A5B]',
}
const STAT_LABEL: Record<TaskStatus, string> = {
  da_fare: 'Da fare',
  in_corso: 'In corso',
  in_revisione: 'In revisione',
  completato: 'Completate',
}

type Activity = { id: string; date: string; kind: 'task' | 'entrata' | 'uscita' | 'evento'; text: string; amount?: number }

export default async function PersonalAreaPage() {
  const me = await requireProfile()
  const supabase = await createClient()

  const [{ data: tasksData }, { data: txData }, { data: evData }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, updated_at, project_id, projects(name)')
      .eq('assignee_id', me.id),
    supabase
      .from('transactions')
      .select('id, type, amount, description, occurred_on, created_at')
      .eq('owner_id', me.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('calendar_events')
      .select('id, title, starts_at, created_at')
      .eq('created_by', me.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const myTasks = (tasksData as MyTask[] | null) ?? []
  const myTx = (txData as Pick<Transaction, 'id' | 'type' | 'amount' | 'description' | 'occurred_on' | 'created_at'>[] | null) ?? []
  const myEv = (evData as Pick<CalendarEvent, 'id' | 'title' | 'starts_at' | 'created_at'>[] | null) ?? []

  // Statistiche task per stato
  const counts: Record<TaskStatus, number> = { da_fare: 0, in_corso: 0, in_revisione: 0, completato: 0 }
  for (const t of myTasks) counts[t.status]++

  // Progetti coinvolti
  const projMap = new Map<string, string>()
  for (const t of myTasks) if (t.project_id && t.projects?.name) projMap.set(t.project_id, t.projects.name)
  const projects = [...projMap.entries()].map(([id, name]) => ({ id, name }))

  // Timeline attività (task completate + movimenti + eventi)
  const activity: Activity[] = [
    ...myTasks
      .filter((t) => t.status === 'completato')
      .map((t) => ({ id: 'task' + t.id, date: t.updated_at, kind: 'task' as const, text: `Completata: ${t.title}` })),
    ...myTx.map((t) => ({
      id: 'tx' + t.id,
      date: t.created_at,
      kind: (t.type === 'entrata' ? 'entrata' : 'uscita') as 'entrata' | 'uscita',
      text: t.description || (t.type === 'entrata' ? 'Entrata' : 'Uscita'),
      amount: Number(t.amount),
    })),
    ...myEv.map((e) => ({ id: 'ev' + e.id, date: e.created_at, kind: 'evento' as const, text: `Evento: ${e.title}` })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 15)

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Link href="/dashboard" className="press -ml-1 flex h-9 w-9 items-center justify-center rounded-[10px] text-[#3E4757] hover:bg-[#EFF1F5]" aria-label="Indietro">
          <IconBack size={22} />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold tracking-tight text-navy">Area personale</h1>
      </header>

      {/* Profilo */}
      <Card className="flex items-center gap-3">
        <Avatar name={me.username} size={48} colorKey={me.id} />
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-[#1A1F2B]">{me.username || 'Utente'}</p>
          <p className="text-xs font-semibold text-[#9CA5B3]">
            {me.role === 'admin' ? 'Amministratore' : 'Membro'} · iscritto il {formatDate(me.created_at, 'd MMM yyyy')}
          </p>
        </div>
      </Card>

      {/* Statistiche task */}
      <section>
        <h2 className="mb-2 font-display font-bold text-[#1A1F2B]">Le tue task</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(counts) as TaskStatus[]).map((s) => (
            <Card key={s} className="p-3">
              <p className={cn('font-display text-2xl font-extrabold tnum', STAT_STYLE[s])}>{counts[s]}</p>
              <p className="text-[11px] font-bold text-[#9CA5B3]">{STAT_LABEL[s]}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Progetti coinvolti */}
      <section>
        <h2 className="mb-2 font-display font-bold text-[#1A1F2B]">Progetti coinvolti ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="text-sm font-medium text-[#9CA5B3]">Non sei ancora coinvolto in progetti.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="press rounded-full bg-brand-50 px-3 py-1.5 text-[12px] font-bold text-brand">
                {p.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Cronologia attività */}
      <section>
        <h2 className="mb-2 font-display font-bold text-[#1A1F2B]">Percorso svolto</h2>
        {activity.length === 0 ? (
          <EmptyState title="Nessuna attività" hint="Completa task o registra movimenti per costruire il tuo percorso." />
        ) : (
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#E0E4EB]">
                <ActivityIcon kind={a.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#1A1F2B]">{a.text}</p>
                  <p className="text-[11px] font-semibold text-[#9CA5B3]">{formatDate(a.date, 'd MMM yyyy')}</p>
                </div>
                {a.amount != null && (
                  <span className={cn('shrink-0 whitespace-nowrap font-display text-sm font-extrabold tnum', a.kind === 'entrata' ? 'text-ok' : 'text-danger')}>
                    {a.kind === 'entrata' ? '+' : '−'} {formatEuro(a.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ActivityIcon({ kind }: { kind: Activity['kind'] }) {
  if (kind === 'task')
    return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#E6F3EC] text-ok"><IconCheck size={16} strokeWidth={2.4} /></span>
  if (kind === 'entrata')
    return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#E6F3EC] text-ok"><IconUp size={16} strokeWidth={2.4} /></span>
  if (kind === 'uscita')
    return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#FBEAE6] text-danger"><IconDown size={16} strokeWidth={2.4} /></span>
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#EFE8FB] text-[#7C5CD6]"><IconCalendar size={16} /></span>
}
