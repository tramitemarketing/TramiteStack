'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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

  // Propaga la nuova sessione (cookie) prima di navigare (pattern Supabase).
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(_prev: unknown, formData: FormData) {
  const username = String(formData.get('username') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const code = String(formData.get('code') ?? '').trim()

  if (!username || !email || !password || !code) {
    return { error: 'Compila tutti i campi.' }
  }
  if (username.length < 3) {
    return { error: 'Lo username deve avere almeno 3 caratteri.' }
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

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    // `display_name` collega lo username al Display Name di Supabase.
    options: { data: { username, display_name: username, full_name: username } },
  })
  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Esiste già un account con questa email.' }
    }
    return { error: 'Registrazione non riuscita: ' + error.message }
  }

  // Crea subito la riga profilo, così l'utente compare nel team senza attendere
  // il primo caricamento (fallback: creazione lazy in requireProfile).
  const newUserId = signUpData.user?.id
  if (newUserId) {
    await supabase
      .from('profiles')
      .upsert({ id: newUserId, username, full_name: username }, { onConflict: 'id' })
  }

  // Con la conferma email disattivata, signUp stabilisce già la sessione.
  // Propaga la sessione (cookie) prima di navigare (pattern Supabase).
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
