import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, PageHeader, EmptyState, Avatar } from '@/components/ui'
import { formatEuro, formatDate } from '@/lib/utils'
import { createTransaction, deleteTransaction } from '@/app/(app)/actions'
import type { Transaction, TeamBalance, Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-violet-200'

type TxRow = Transaction & { owner: { full_name: string } | null }

export default async function BudgetPage() {
  const me = await requireProfile()
  const supabase = await createClient()

  const [{ data: balances }, { data: txs }, { data: members }] = await Promise.all([
    supabase.from('team_balances').select('*').order('full_name'),
    supabase
      .from('transactions')
      .select('*, owner:profiles!owner_id(full_name)')
      .order('occurred_on', { ascending: false })
      .limit(30),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
  ])

  const team = (balances as TeamBalance[] | null) ?? []
  const txRows = (txs as TxRow[] | null) ?? []
  const memberList = (members as Pick<Profile, 'id' | 'full_name'>[] | null) ?? []
  const totale = team.reduce((s, t) => s + Number(t.balance), 0)

  return (
    <div className="space-y-5">
      <PageHeader title="Bilancio" subtitle="Saldo personale di ogni dipendente" />

      {/* Saldi per dipendente */}
      <div className="grid grid-cols-2 gap-3">
        {team.length === 0 ? (
          <div className="col-span-2"><EmptyState title="Nessun dipendente registrato" /></div>
        ) : (
          team.map((t) => (
            <Card key={t.user_id} className="p-3">
              <div className="flex items-center gap-2">
                <Avatar name={t.full_name} />
                <p className="truncate text-sm font-semibold">{t.full_name || 'Utente'}</p>
              </div>
              <p className={'mt-2 text-xl font-extrabold ' + (Number(t.balance) >= 0 ? 'text-slate-900' : 'text-red-600')}>
                {formatEuro(Number(t.balance))}
              </p>
              <p className="text-[11px] text-slate-400">
                +{formatEuro(Number(t.total_income))} · −{formatEuro(Number(t.total_expense))}
              </p>
            </Card>
          ))
        )}
      </div>

      {team.length > 0 && (
        <p className="text-center text-sm text-slate-500">
          Totale team: <span className="font-bold text-slate-700">{formatEuro(totale)}</span>
        </p>
      )}

      {/* Aggiungi movimento per persona */}
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-brand" style={{ color: 'var(--brand)' }}>
          + Aggiungi entrata / uscita
        </summary>
        <Card className="mt-2">
          <form action={createTransaction} className="space-y-3">
            <select name="owner_id" required className={inputCls} defaultValue={me.id}>
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name || 'Utente'}</option>
              ))}
            </select>
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
            <button className="press w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
              Registra movimento
            </button>
          </form>
        </Card>
      </details>

      {/* Ultimi movimenti */}
      <section>
        <h2 className="mb-2 font-bold">Ultimi movimenti</h2>
        {txRows.length === 0 ? (
          <EmptyState title="Nessun movimento" />
        ) : (
          <div className="space-y-1.5">
            {txRows.map((t) => (
              <div key={t.id} className="group flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.description || t.category || 'Movimento'}</p>
                  <p className="text-xs text-slate-400">{t.owner?.full_name ?? '—'} · {formatDate(t.occurred_on)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={t.type === 'entrata' ? 'font-bold text-emerald-600' : 'font-bold text-red-600'}>
                    {t.type === 'entrata' ? '+' : '−'} {formatEuro(Number(t.amount))}
                  </span>
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500" aria-label="Elimina">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
