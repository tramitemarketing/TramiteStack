import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  PageHeader,
  ProjectStatusBadge,
  TaskStatusBadge,
  PriorityDot,
  EmptyState,
} from '@/components/ui'
import { formatEuro, formatDate } from '@/lib/utils'
import {
  PROJECT_STATUS_LABEL,
  TASK_STATUS_ORDER,
  TASK_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  type Project,
  type Task,
  type Transaction,
  type ProjectFinancials,
  type Profile,
} from '@/types/database'
import {
  setProjectStatus,
  createTask,
  setTaskStatus,
  createTransaction,
} from '@/app/(app)/actions'
import { AttachmentsPanel } from '@/components/attachments-panel'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('id', id)
    .maybeSingle()

  if (!project) notFound()
  const p = project as Project & { clients: { name: string } | null }

  const [{ data: tasks }, { data: txs }, { data: fin }, { data: team }] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', id).order('position'),
    supabase.from('transactions').select('*').eq('project_id', id).order('occurred_on', { ascending: false }),
    supabase.from('project_financials').select('*').eq('project_id', id).maybeSingle(),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
  ])

  const taskRows = (tasks as Task[] | null) ?? []
  const txRows = (txs as Transaction[] | null) ?? []
  const f = (fin as ProjectFinancials | null) ?? null
  const members = (team as Pick<Profile, 'id' | 'full_name'>[] | null) ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title={p.name}
        subtitle={p.clients?.name ?? 'Senza cliente'}
        action={<ProjectStatusBadge status={p.status} />}
      />

      {p.description && <p className="text-sm text-slate-600">{p.description}</p>}

      {/* Cambio stato progetto */}
      <Card className="flex items-center justify-between gap-3 p-3">
        <span className="text-sm text-slate-500">Stato del progetto</span>
        <form action={setProjectStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={p.id} />
          <select name="status" defaultValue={p.status} className={inputCls + ' w-auto'}>
            {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white">OK</button>
        </form>
      </Card>

      {/* Bilancio del progetto */}
      <section>
        <h2 className="mb-2 font-semibold">Bilancio del progetto</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3">
            <p className="text-xs text-slate-500">Entrate</p>
            <p className="mt-1 font-bold text-emerald-600">{formatEuro(Number(f?.total_income ?? 0))}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-slate-500">Uscite</p>
            <p className="mt-1 font-bold text-red-600">{formatEuro(Number(f?.total_expense ?? 0))}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-slate-500">Margine</p>
            <p className={'mt-1 font-bold ' + ((f?.margin ?? 0) >= 0 ? 'text-slate-900' : 'text-red-600')}>
              {formatEuro(Number(f?.margin ?? 0))}
            </p>
          </Card>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-indigo-600">
            + Aggiungi movimento
          </summary>
          <Card className="mt-2">
            <form action={createTransaction} className="space-y-3">
              <input type="hidden" name="project_id" value={p.id} />
              <div className="grid grid-cols-2 gap-3">
                <select name="type" className={inputCls} defaultValue="entrata">
                  <option value="entrata">Entrata</option>
                  <option value="uscita">Uscita</option>
                </select>
                <input type="number" step="0.01" min="0" name="amount" required className={inputCls} placeholder="Importo €" />
              </div>
              <input name="description" className={inputCls} placeholder="Descrizione" />
              <div className="grid grid-cols-2 gap-3">
                <input name="category" className={inputCls} placeholder="Categoria" />
                <input type="date" name="occurred_on" className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                Registra movimento
              </button>
            </form>
          </Card>
        </details>

        {txRows.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {txRows.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.description || t.category || 'Movimento'}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.occurred_on)}</p>
                </div>
                <span className={t.type === 'entrata' ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                  {t.type === 'entrata' ? '+' : '−'} {formatEuro(Number(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Task del progetto */}
      <section>
        <h2 className="mb-2 font-semibold">Task ({taskRows.length})</h2>

        <details className="mb-3">
          <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Aggiungi task</summary>
          <Card className="mt-2">
            <form action={createTask} className="space-y-3">
              <input type="hidden" name="project_id" value={p.id} />
              <input name="title" required className={inputCls} placeholder="Titolo del task" />
              <div className="grid grid-cols-2 gap-3">
                <select name="priority" className={inputCls} defaultValue="media">
                  {Object.entries(TASK_PRIORITY_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      Priorità {l}
                    </option>
                  ))}
                </select>
                <input type="date" name="due_date" className={inputCls} />
              </div>
              <select name="assignee_id" className={inputCls} defaultValue="">
                <option value="">— Non assegnato —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || 'Utente'}
                  </option>
                ))}
              </select>
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                Aggiungi task
              </button>
            </form>
          </Card>
        </details>

        {taskRows.length === 0 ? (
          <EmptyState title="Nessun task" />
        ) : (
          <div className="space-y-2">
            {taskRows.map((t) => (
              <Card key={t.id} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{t.title}</p>
                  <TaskStatusBadge status={t.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PriorityDot priority={t.priority} />
                    {t.due_date && <span className="text-xs text-slate-400">scade {formatDate(t.due_date)}</span>}
                  </div>
                  <form action={setTaskStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="project_id" value={p.id} />
                    <select name="status" defaultValue={t.status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                      {TASK_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {TASK_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md bg-slate-800 px-2 py-1 text-xs text-white">OK</button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Allegati */}
      <AttachmentsPanel projectId={p.id} />
    </div>
  )
}
