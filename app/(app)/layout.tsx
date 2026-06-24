import { BottomNav } from '@/components/bottom-nav'
import { InstallPrompt } from '@/components/install-prompt'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { ToastProvider } from '@/components/toast'
import { requireProfile } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireProfile()

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-col">
        <RealtimeRefresh />
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:font-bold focus:text-white"
        >
          Vai al contenuto
        </a>
        <main id="contenuto" className="with-bottom-nav mx-auto w-full max-w-2xl flex-1 px-4 pt-5">{children}</main>

        <InstallPrompt />
        <BottomNav />
      </div>
    </ToastProvider>
  )
}
