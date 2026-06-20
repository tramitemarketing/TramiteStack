'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUp } from '@/app/login/actions'
import { LogoMark } from '@/components/logo'

const initialState: { error?: string } = {}
const inputCls =
  'w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-violet-200'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={56} />
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Crea il tuo account</h1>
          <p className="mt-1 text-sm text-slate-500">Riservato ai collaboratori di TramiteMarketing</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <label htmlFor="full_name" className="mb-1 block text-sm font-semibold text-slate-700">Nome e cognome</label>
            <input id="full_name" name="full_name" required className={inputCls} placeholder="Mario Rossi" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} placeholder="nome@tramitemarketing.it" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required className={inputCls} placeholder="almeno 6 caratteri" />
          </div>
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-semibold text-slate-700">Nome collaborazione</label>
            <input id="code" name="code" required className={inputCls} placeholder="codice condiviso del team" />
            <p className="mt-1 text-xs text-slate-400">Il codice riservato che identifica il team. Chiedilo a un collega.</p>
          </div>

          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="press flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {pending && <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} />}
            {pending ? 'Creazione…' : 'Registrati'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Hai già un account?{' '}
          <Link href="/login" className="font-semibold text-brand">Accedi</Link>
        </p>
      </div>
    </main>
  )
}
