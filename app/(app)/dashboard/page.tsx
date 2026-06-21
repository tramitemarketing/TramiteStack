import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, TaskStatusBadge, EmptyState } from '@/components/ui'
import { HeaderAccount } from '@/components/header-account'
import { DbStatus } from '@/components/db-status'
import { NotificationsBell } from '@/components/notifications-bell'
import { IconEuro } from '@/components/icons'
import { EmptyTasks } from '@/components/illustrations'
import { formatEuro, formatDate, cn } from '@/lib/utils'
import { priorityColor, type Task, type TeamBalance } from '@/types/database'

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
      .eq('assignee_id', profile.id)
      .neq('status', 'completato')
      .order('priority_level', { ascending: true }),
  ])

  const myBalance = (balance as TeamBalance | null)?.balance ?? 0
  const tasks = (dueToday as TaskRow[] | null) ?? []

  return (
    <div className="space-y-5">
      {/* Header: data + saluto + account */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold capitalize text-[#9CA5B3]">{formatDate(today, 'EEEE d MMMM')}</p>
          <h1 className="font-display text-[23px] font-extrabold tracking-tight text-navy">
            Ciao {profile.username || ''} 👋
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <DbStatus />
          <NotificationsBell meId={profile.id} />
          <HeaderAccount username={profile.username} color={profile.color} />
        </div>
      </header>

      {/* Saldo personale (pannello navy) */}
      <Link href="/budget" className="press block">
        <div className="rounded-2xl p-[18px] text-white" style={{ background: 'linear-gradient(150deg, #1660A3, #0A2E4D)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-[#9DC2EC]">SALDO PERSONALE</span>
            <IconEuro size={18} className="text-[#9DC2EC]" />
          </div>
          <div className="mt-1.5 font-display text-3xl font-extrabold tnum">{formatEuro(Number(myBalance))}</div>
          <div className="mt-3.5 text-right text-xs font-bold text-accent">Bilancio →</div>
        </div>
      </Link>

      {/* Task di oggi (assegnate a me) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#1A1F2B]">Task di oggi</h2>
          {tasks.length > 0 && (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand">
              {tasks.length} {tasks.length === 1 ? 'attiva' : 'attive'}
            </span>
          )}
        </div>
        {tasks.length === 0 ? (
          <EmptyState
            title="Niente in scadenza oggi 🎉"
            hint="Goditi la giornata."
            illustration={<EmptyTasks />}
          />
        ) : (
          <div className="space-y-2.5">
            {tasks.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-3.5">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', priorityColor(t.priority_level))} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#1A1F2B]">{t.title}</p>
                  <p className="truncate text-[11px] font-semibold text-[#9CA5B3]">{t.projects?.name ?? 'Senza progetto'}</p>
                </div>
                <TaskStatusBadge status={t.status} />
              </Card>
            ))}
          </div>
        )}
        <Link href="/tasks" className="block text-center text-sm font-bold text-brand">
          Vai a tutte le task →
        </Link>
      </section>
    </div>
  )
}
