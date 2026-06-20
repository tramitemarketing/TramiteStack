'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Home', icon: 'M3 11.5 12 4l9 7.5M5 10v10h14V10' },
  { href: '/tasks', label: 'Task', icon: 'M4 6h16M4 12h16M4 18h10' },
  { href: '/calendar', label: 'Calendario', icon: 'M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z' },
  { href: '/budget', label: 'Bilancio', icon: 'M3 6h18v12H3zM3 10h18M7 15h3' },
  { href: '/projects', label: 'Progetti', icon: 'M3 7h6l2 2h10v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'press flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition',
                  active ? 'text-brand' : 'text-slate-400',
                )}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition"
                  style={active ? { backgroundColor: 'var(--brand-50)' } : undefined}
                >
                  <svg
                    className="h-[22px] w-[22px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
