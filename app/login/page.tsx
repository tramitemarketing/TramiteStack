'use client'

import { useActionState } from 'react'
import { signIn } from './actions'

const initialState: { error?: string } = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
            T
          </div>
          <h1 className="text-2xl font-bold tracking-tight">T-Stack</h1>
          <p className="mt-1 text-sm text-slate-500">TramiteMarketing — area riservata</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="nome@tramitemarketing.it"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? 'Accesso…' : 'Accedi'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Accesso solo su invito. Gli account sono creati dall’amministratore.
        </p>
      </div>
    </main>
  )
}
