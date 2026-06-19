import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { SignOutButton } from '@/components/sign-out-button'
import { requireProfile } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile()

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              T
            </span>
            <span className="font-semibold">T-Stack</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {profile.full_name || 'Utente'}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="with-bottom-nav mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
