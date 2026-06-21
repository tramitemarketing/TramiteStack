'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUp } from '@/app/login/actions'
import { LogoMark } from '@/components/logo'

const initialState: { error?: string } = {}
const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'

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
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-semibold text-slate-700">Username <span className="text-danger">*</span></label>
            <input id="username" name="username" required minLength={3} autoCapitalize="none" className={inputCls} placeholder="es. mario.rossi" />
            <p className="mt-1 text-xs text-slate-400">Con questo nome ti vedranno i colleghi nell’app.</p>
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">Email <span className="text-danger">*</span></label>
            <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} placeholder="nome@tramitemarketing.it" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">Password <span className="text-danger">*</span></label>
            <input id="password" name="password" type="password" autoComplete="new-password" required className={inputCls} placeholder="almeno 6 caratteri" />
          </div>
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-semibold text-slate-700">Nome collaborazione <span className="text-danger">*</span></label>
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
