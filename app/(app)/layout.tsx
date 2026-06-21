import { BottomNav } from '@/components/bottom-nav'
import { InstallPrompt } from '@/components/install-prompt'
import { SwipeNav } from '@/components/swipe-nav'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { requireProfile } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireProfile()

  return (
    <div className="flex min-h-full flex-col">
      <RealtimeRefresh />
      <main className="with-bottom-nav mx-auto w-full max-w-2xl flex-1 px-4 pt-5">
        <SwipeNav>{children}</SwipeNav>
      </main>

      <InstallPrompt />
      <BottomNav />
    </div>
  )
}
