import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

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
    // Auto-riparazione: se manca lo username, lo reimposta dai metadati.
    if (!(profile as Profile).username) {
      await supabase.from('profiles').update({ username: desiredUsername }).eq('id', user.id)
      return { ...(profile as Profile), username: desiredUsername }
    }
    return profile as Profile
  }

  // Creazione lazy del profilo al primo accesso.
  const base = desiredUsername

  // Prova con lo username scelto; in caso di collisione, aggiunge un suffisso.
  for (const candidate of [base, `${base}-${user.id.slice(0, 4)}`]) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: candidate, full_name: candidate }, { onConflict: 'id' })
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
