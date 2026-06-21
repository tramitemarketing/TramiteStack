import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { Card, PageHeader, Avatar } from '@/components/ui'
import { updateRegistrationCode } from '@/app/(app)/actions'
import { SubmitButton } from '@/components/submit-button'
import { InstallButton } from '@/components/install-button'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'

export default async function SettingsPage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').order('username')
  const team = (data as Profile[] | null) ?? []

  let code: string | null = null
  if (profile.role === 'admin') {
    const { data: cfg } = await supabase.from('app_settings').select('registration_code').eq('id', true).maybeSingle()
    code = (cfg as { registration_code: string } | null)?.registration_code ?? null
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Impostazioni" />

      <Card>
        <h2 className="mb-2 font-bold">Il mio profilo</h2>
        <div className="flex items-center gap-2">
          <Avatar name={profile.username} color={profile.color} />
          <div>
            <p className="text-sm font-semibold">{profile.username || 'Username non impostato'}</p>
            <p className="text-xs text-slate-400">{profile.role === 'admin' ? 'Amministratore' : 'Membro'}</p>
          </div>
        </div>
      </Card>

      <InstallButton />

      <section>
        <h2 className="mb-2 font-bold">Team ({team.length})</h2>
        <div className="space-y-2">
          {team.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Avatar name={m.username} color={m.color} />
                <div>
                  <p className="text-sm font-semibold">{m.username || 'Utente'}</p>
                  <p className="text-xs text-slate-400">{m.role === 'admin' ? 'Amministratore' : 'Membro'}</p>
                </div>
              </div>
              {!m.active && <span className="text-xs text-red-500">disattivato</span>}
            </Card>
          ))}
        </div>
      </section>

      {profile.role === 'admin' && (
        <Card style={{ backgroundColor: 'var(--brand-50)' }}>
          <h2 className="mb-1 font-bold" style={{ color: 'var(--brand)' }}>Nome collaborazione</h2>
          <p className="mb-3 text-sm text-slate-600">
            Codice condiviso necessario per registrarsi. Cambialo quando vuoi: i nuovi iscritti dovranno usare quello aggiornato.
          </p>
          <form action={updateRegistrationCode} className="flex gap-2">
            <input name="registration_code" defaultValue={code ?? ''} required className={inputCls} />
            <SubmitButton pendingLabel="…" className="rounded-[10px] px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
              Salva
            </SubmitButton>
          </form>
        </Card>
      )}
    </div>
  )
}
