import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { SignOutButton } from '@/components/sign-out-button'
import { LogoWordmark } from '@/components/logo'
import { InstallPrompt } from '@/components/install-prompt'
import { requireProfile } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireProfile()

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/dashboard"><LogoWordmark size={30} /></Link>
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="press rounded-lg p-2 text-slate-500 hover:text-slate-700"
              aria-label="Impostazioni"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="with-bottom-nav mx-auto w-full max-w-2xl flex-1 px-4 py-4">{children}</main>

      <InstallPrompt />
      <BottomNav />
    </div>
  )
}
