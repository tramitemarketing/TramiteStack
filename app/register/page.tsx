'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUp } from '@/app/login/actions'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/button'
import { Field, inputCls, FormError } from '@/components/field'

const initialState: { error?: string } = {}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={64} boxed />
          <h1 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-navy">Crea il tuo account</h1>
          <p className="mt-1 text-sm font-medium text-[#5A6473]">Riservato ai collaboratori di TramiteMarketing</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <Field label="Username" htmlFor="username" required hint="Con questo nome ti vedranno i colleghi nell’app.">
            <input id="username" name="username" required minLength={3} autoCapitalize="none" className={inputCls} placeholder="es. mario.rossi" />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} placeholder="nome@tramitemarketing.it" />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <input id="password" name="password" type="password" autoComplete="new-password" required className={inputCls} placeholder="almeno 6 caratteri" />
          </Field>
          <Field label="Nome collaborazione" htmlFor="code" required hint="Il codice riservato che identifica il team. Chiedilo a un collega.">
            <input id="code" name="code" required className={inputCls} placeholder="codice condiviso del team" />
          </Field>

          <FormError message={state?.error} />

          <Button type="submit" fullWidth loading={pending} loadingLabel="Creazione…">
            Registrati
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Hai già un account?{' '}
          <Link href="/login" className="font-semibold text-brand">Accedi</Link>
        </p>
      </div>
    </main>
  )
}
