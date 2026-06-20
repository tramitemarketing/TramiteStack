import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, PageHeader, TaskStatusBadge, PriorityPips, EmptyState } from '@/components/ui'
import { formatEuro } from '@/lib/utils'
import type { Task, TeamBalance } from '@/types/database'

export const dynamic = 'force-dynamic'

type TaskRow = Task & { projects: { name: string } | null }

export default async function DashboardPage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: balance }, { data: dueToday }] = await Promise.all([
    supabase.from('team_balances').select('*').eq('user_id', profile.id).maybeSingle(),
    supabase
      .from('tasks')
      .select('*, projects(name)')
      .eq('due_date', today)
      .neq('status', 'completato')
      .order('priority_level', { ascending: false }),
  ])

  const myBalance = (balance as TeamBalance | null)?.balance ?? 0
  const tasks = (dueToday as TaskRow[] | null) ?? []

  return (
    <div className="space-y-5">
      <PageHeader title={`Ciao ${profile.username || ''} 👋`} subtitle="La tua giornata" />

      {/* Bilancio personale: solo saldo attuale */}
      <Card className="bg-gradient-to-br from-violet-600 to-cyan-500 text-white ring-0">
        <p className="text-sm/5 opacity-90">Il tuo saldo personale</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatEuro(Number(myBalance))}</p>
        <Link href="/budget" className="mt-2 inline-block text-sm font-semibold underline opacity-90">
          Vai al bilancio
        </Link>
      </Card>

      {/* Task da fare con scadenza odierna */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Task di oggi</h2>
          <Link href="/tasks" className="text-sm font-semibold text-brand" style={{ color: 'var(--brand)' }}>
            Tutti i task
          </Link>
        </div>
        {tasks.length === 0 ? (
          <EmptyState title="Niente in scadenza oggi" hint="Goditi la giornata 🎉" />
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <Card key={t.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.title}</p>
                  <p className="truncate text-xs text-slate-500">{t.projects?.name ?? 'Senza progetto'}</p>
                  <div className="mt-1"><PriorityPips level={t.priority_level} /></div>
                </div>
                <TaskStatusBadge status={t.status} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
