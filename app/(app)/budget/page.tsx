import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, EmptyState, Avatar } from '@/components/ui'
import { SubmitIcon } from '@/components/submit-button'
import { AddTransaction } from '@/components/add-transaction'
import { IconUp, IconDown, IconTrash } from '@/components/icons'
import { EmptyBudget } from '@/components/illustrations'
import { formatEuro, formatDate, cn } from '@/lib/utils'
import { deleteTransaction } from '@/app/(app)/actions'
import type { Transaction, TeamBalance, Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

type TxRow = Transaction & { owner: { username: string | null } | null }

export default async function BudgetPage() {
  const me = await requireProfile()
  const supabase = await createClient()

  const [{ data: balances }, { data: txs }, { data: members }] = await Promise.all([
    supabase.from('team_balances').select('*').order('username'),
    supabase
      .from('transactions')
      .select('*, owner:profiles!owner_id(username)')
      .order('occurred_on', { ascending: false })
      .limit(30),
    supabase.from('profiles').select('id, username').eq('active', true).order('username'),
  ])

  const team = (balances as TeamBalance[] | null) ?? []
  const txRows = (txs as TxRow[] | null) ?? []
  const memberList = (members as Pick<Profile, 'id' | 'username'>[] | null) ?? []
  const totale = team.reduce((s, t) => s + Number(t.balance), 0)

  return (
    <div className="space-y-5">
      {/* Header navy a tutta larghezza, attaccato in alto */}
      <div
        className="-mx-4 -mt-5 px-4 pb-5 text-white"
        style={{
          background: 'linear-gradient(150deg, #1660A3, #0A2E4D)',
          paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)',
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[22px] font-extrabold tracking-tight">Bilancio</h1>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-[#9DC2EC]">Team</span>
        </div>
        <p className="mt-3 text-[11px] font-semibold text-[#9DC2EC]">Saldo totale team</p>
        <p className="font-display text-3xl font-extrabold tnum text-accent">{formatEuro(totale)}</p>
      </div>

      {/* Saldi per dipendente */}
      <div className="grid grid-cols-2 gap-3">
        {team.length === 0 ? (
          <div className="col-span-2"><EmptyState title="Nessun dipendente registrato" /></div>
        ) : (
          team.map((t) => (
            <Card key={t.user_id} className="p-3">
              <div className="flex items-center gap-2">
                <Avatar name={t.username} size={24} color={t.color} />
                <p className="truncate text-sm font-bold text-[#1A1F2B]">{t.username || 'Utente'}</p>
              </div>
              <p className={cn('mt-2 font-display text-lg font-extrabold tnum', Number(t.balance) >= 0 ? 'text-ok' : 'text-danger')}>
                {formatEuro(Number(t.balance))}
              </p>
              <p className="text-[11px] font-semibold text-[#6B7280]">
                +{formatEuro(Number(t.total_income))} · −{formatEuro(Number(t.total_expense))}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* Ultimi movimenti */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display font-bold text-[#1A1F2B]">Ultimi movimenti</h2>
          <AddTransaction members={memberList} defaultOwner={me.id} />
        </div>
        {txRows.length === 0 ? (
          <EmptyState title="Nessun movimento" hint="Registra entrate e uscite." illustration={<EmptyBudget />} />
        ) : (
          <div className="space-y-1.5">
            {txRows.map((t) => {
              const entrata = t.type === 'entrata'
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#E0E4EB]">
                  <span
                    className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]', entrata ? 'bg-[#E6F3EC] text-ok' : 'bg-[#FBEAE6] text-danger')}
                  >
                    {entrata ? <IconUp size={16} strokeWidth={2.4} /> : <IconDown size={16} strokeWidth={2.4} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1A1F2B]">{t.description || t.category || 'Movimento'}</p>
                    <p className="truncate text-[11px] font-semibold text-[#6B7280]">{t.owner?.username ?? '—'} · {formatDate(t.occurred_on, 'd MMM')}</p>
                  </div>
                  <span className={cn('shrink-0 whitespace-nowrap font-display text-sm font-extrabold tnum', entrata ? 'text-ok' : 'text-danger')}>
                    {entrata ? '+' : '−'} {formatEuro(Number(t.amount))}
                  </span>
                  <form action={deleteTransaction} className="shrink-0">
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitIcon label="Elimina movimento" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#FBEAE6] hover:text-danger">
                      <IconTrash size={16} />
                    </SubmitIcon>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
