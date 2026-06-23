import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

type DbClient = Awaited<ReturnType<typeof createClient>>

// Palette identità dei membri (un colore distinto per persona).
export const MEMBER_PALETTE = ['#0F4C81', '#7C5CD6', '#1F8A5B', '#2A78C2', '#C8932B', '#D8553F', '#0E7C86', '#B4458E']

// Sceglie un colore non ancora usato (se possibile) tra i membri.
export async function pickMemberColor(supabase: DbClient): Promise<string> {
  const { data } = await supabase.from('profiles').select('color')
  const used = new Set(((data as { color: string | null }[] | null) ?? []).map((r) => r.color).filter(Boolean))
  const free = MEMBER_PALETTE.filter((c) => !used.has(c))
  const pool = free.length ? free : MEMBER_PALETTE
  return pool[Math.floor(Math.random() * pool.length)]
}

// Ritorna il profilo dell'utente corrente o reindirizza al login.
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Username preferito dai metadati dell'utente.
  const desiredUsername =
    (user.user_metadata?.username as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'utente'

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    const p = profile as Profile
    const patch: Partial<Profile> = {}
    // Auto-riparazione: username e colore mancanti.
    if (!p.username) patch.username = desiredUsername
    if (!p.color) patch.color = await pickMemberColor(supabase)
    if (Object.keys(patch).length) {
      await supabase.from('profiles').update(patch).eq('id', user.id)
      return { ...p, ...patch }
    }
    return p
  }

  // Creazione lazy del profilo al primo accesso.
  const base = desiredUsername
  const color = await pickMemberColor(supabase)

  // Prova con lo username scelto; in caso di collisione, aggiunge un suffisso.
  for (const candidate of [base, `${base}-${user.id.slice(0, 4)}`]) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: candidate, full_name: candidate, color }, { onConflict: 'id' })
    if (!error) break
  }

  // Rileggi il profilo (statement separato: la RLS sul RETURNING dell'upsert
  // può non vedere subito la riga appena creata).
  const { data: fresh } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (fresh) return fresh as Profile

  // Utente autenticato ma profilo non leggibile: NON rimbalzare al login,
  // ritorna un profilo minimo così l'app si carica comunque.
  return {
    id: user.id,
    username: base,
    full_name: base,
    role: 'member',
    avatar_url: null,
    color: null,
    completed_tasks_count: 0,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Profile
}

// Ritorna il profilo o null senza reindirizzare.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return (data as Profile) ?? null
}
