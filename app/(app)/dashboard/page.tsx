import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, PageHeader, TaskStatusBadge, EmptyState } from '@/components/ui'
import { formatEuro, formatDate } from '@/lib/utils'
import type { Task, MonthlyIncome } from '@/types/database'

export const dynamic = 'force-dynamic'

type TaskWithProject = Task & { projects: { name: string } | null }

export default async function DashboardPage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 8) + '01'

  const [{ data: dueTasks }, { count: inProgressCount }, { data: income }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, projects(name)')
      .neq('status', 'completato')
      .lte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'in_corso'),
    supabase.from('monthly_income').select('*').eq('month', monthStart).maybeSingle(),
  ])

  const m = (income as MonthlyIncome | null) ?? { income: 0, expense: 0, net: 0, month: monthStart }
  const tasks = (dueTasks as TaskWithProject[] | null) ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Ciao ${profile.full_name?.split(' ')[0] || ''} 👋`}
        subtitle="Ecco la situazione di oggi"
      />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-slate-500">Entrate del mese</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{formatEuro(Number(m.income))}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Uscite del mese</p>
          <p className="mt-1 text-lg font-bold text-red-600">{formatEuro(Number(m.expense))}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Saldo del mese</p>
          <p className="mt-1 text-lg font-bold">{formatEuro(Number(m.net))}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Task in corso</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{inProgressCount ?? 0}</p>
        </Card>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Scadenze di oggi</h2>
          <Link href="/tasks" className="text-sm font-medium text-indigo-600">
            Tutti i task
          </Link>
        </div>
        {tasks.length === 0 ? (
          <EmptyState title="Nessuna scadenza in arrivo" hint="Goditi la giornata 🎉" />
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <Card key={t.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {t.projects?.name ?? 'Senza progetto'} · scade {formatDate(t.due_date)}
                  </p>
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
