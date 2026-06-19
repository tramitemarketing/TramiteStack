import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, PageHeader } from '@/components/ui'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').order('full_name')
  const team = (data as Profile[] | null) ?? []

  return (
    <div className="space-y-5">
      <PageHeader title="Impostazioni" />

      <Card>
        <h2 className="mb-2 font-semibold">Il mio profilo</h2>
        <p className="text-sm text-slate-600">{profile.full_name || 'Nome non impostato'}</p>
        <p className="text-xs text-slate-400">
          Ruolo: {profile.role === 'admin' ? 'Amministratore' : 'Membro'}
        </p>
      </Card>

      <section>
        <h2 className="mb-2 font-semibold">Team ({team.length})</h2>
        <div className="space-y-2">
          {team.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{m.full_name || 'Utente'}</p>
                <p className="text-xs text-slate-400">{m.role === 'admin' ? 'Amministratore' : 'Membro'}</p>
              </div>
              {!m.active && <span className="text-xs text-red-500">disattivato</span>}
            </Card>
          ))}
        </div>
      </section>

      {profile.role === 'admin' && (
        <Card className="bg-indigo-50 ring-indigo-100">
          <h2 className="mb-1 font-semibold text-indigo-900">Gestione utenti</h2>
          <p className="text-sm text-indigo-800">
            Gli account si creano dalla dashboard Supabase (Authentication → Users → Add user) o via
            invito email. Vedi <span className="font-medium">docs/ISTRUZIONI.md</span> per i passaggi.
          </p>
        </Card>
      )}
    </div>
  )
}
