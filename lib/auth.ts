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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) return profile as Profile

  // Creazione lazy del profilo al primo accesso.
  const base =
    (user.user_metadata?.username as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'utente'

  // Prova con lo username scelto; in caso di collisione, aggiunge un suffisso.
  let created: Profile | null = null
  for (const candidate of [base, `${base}-${user.id.slice(0, 4)}`]) {
    const { data } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: candidate, full_name: candidate }, { onConflict: 'id' })
      .select('*')
      .maybeSingle()
    if (data) {
      created = data as Profile
      break
    }
  }

  if (!created) redirect('/login')
  return created
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
