import { createClient } from '@/lib/supabase/server'
import { Card, PageHeader, EmptyState } from '@/components/ui'
import { formatEuro, formatDate } from '@/lib/utils'
import { createTransaction } from '@/app/(app)/actions'
import type { Transaction, ProjectFinancials, MonthlyIncome, Project } from '@/types/database'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

type TxRow = Transaction & { projects: { name: string } | null }

export default async function BudgetPage() {
  const supabase = await createClient()
  const monthStart = new Date().toISOString().slice(0, 8) + '01'

  const [{ data: month }, { data: txs }, { data: fin }, { data: projects }] = await Promise.all([
    supabase.from('monthly_income').select('*').eq('month', monthStart).maybeSingle(),
    supabase
      .from('transactions')
      .select('*, projects(name)')
      .order('occurred_on', { ascending: false })
      .limit(20),
    supabase.from('project_financials').select('*').order('margin', { ascending: false }),
    supabase.from('projects').select('id, name').order('name'),
  ])

  const m = (month as MonthlyIncome | null) ?? { income: 0, expense: 0, net: 0, month: monthStart }
  const txRows = (txs as TxRow[] | null) ?? []
  const finRows = (fin as ProjectFinancials[] | null) ?? []
  const projList = (projects as Pick<Project, 'id' | 'name'>[] | null) ?? []

  return (
    <div className="space-y-5">
      <PageHeader title="Bilancio" subtitle="Entrate, uscite e margini" />

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-slate-500">Entrate mese</p>
          <p className="mt-1 font-bold text-emerald-600">{formatEuro(Number(m.income))}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Uscite mese</p>
          <p className="mt-1 font-bold text-red-600">{formatEuro(Number(m.expense))}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Saldo</p>
          <p className="mt-1 font-bold">{formatEuro(Number(m.net))}</p>
        </Card>
      </div>

      <section>
        <details>
          <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Registra movimento</summary>
          <Card className="mt-2">
            <form action={createTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select name="type" className={inputCls} defaultValue="entrata">
                  <option value="entrata">Entrata</option>
                  <option value="uscita">Uscita</option>
                </select>
                <input type="number" step="0.01" min="0" name="amount" required className={inputCls} placeholder="Importo €" />
              </div>
              <input name="description" className={inputCls} placeholder="Descrizione" />
              <div className="grid grid-cols-2 gap-3">
                <select name="project_id" className={inputCls} defaultValue="">
                  <option value="">— Generale —</option>
                  {projList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input type="date" name="occurred_on" className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                Registra
              </button>
            </form>
          </Card>
        </details>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Margine per progetto</h2>
        {finRows.length === 0 ? (
          <EmptyState title="Nessun dato" />
        ) : (
          <div className="space-y-2">
            {finRows.map((f) => (
              <Card key={f.project_id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{f.project_name}</p>
                  <p className="text-xs text-slate-400">
                    +{formatEuro(Number(f.total_income))} · −{formatEuro(Number(f.total_expense))}
                  </p>
                </div>
                <span className={(f.margin ?? 0) >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                  {formatEuro(Number(f.margin))}
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Ultimi movimenti</h2>
        {txRows.length === 0 ? (
          <EmptyState title="Nessun movimento" />
        ) : (
          <div className="space-y-1.5">
            {txRows.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.description || t.category || 'Movimento'}</p>
                  <p className="text-xs text-slate-400">
                    {t.projects?.name ?? 'Generale'} · {formatDate(t.occurred_on)}
                  </p>
                </div>
                <span className={t.type === 'entrata' ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                  {t.type === 'entrata' ? '+' : '−'} {formatEuro(Number(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
