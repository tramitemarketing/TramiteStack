'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Inserisci email e password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenziali non valide. Riprova o registrati.' }
  }

  redirect('/dashboard')
}

export async function signUp(_prev: unknown, formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const code = String(formData.get('code') ?? '').trim()

  if (!fullName || !email || !password || !code) {
    return { error: 'Compila tutti i campi.' }
  }
  if (password.length < 6) {
    return { error: 'La password deve avere almeno 6 caratteri.' }
  }

  const supabase = await createClient()

  // Verifica il "nome collaborazione" (codice condiviso nel DB) senza esporlo.
  const { data: ok, error: rpcError } = await supabase.rpc('check_registration_code', {
    p_code: code,
  })
  if (rpcError || ok !== true) {
    return { error: 'Nome collaborazione non valido. Contatta un collega.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) {
    return { error: 'Registrazione non riuscita: ' + error.message }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
