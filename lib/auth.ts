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

  // Creazione lazy del profilo al primo accesso (riuso utenti esistenti).
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Utente'

  const { data: created } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: fullName }, { onConflict: 'id' })
    .select('*')
    .single()

  if (!created) redirect('/login')
  return created as Profile
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
