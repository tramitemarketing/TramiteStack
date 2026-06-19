'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Home', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { href: '/tasks', label: 'Task', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { href: '/calendar', label: 'Calendario', icon: 'M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
  { href: '/budget', label: 'Bilancio', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { href: '/projects', label: 'Progetti', icon: 'M3 7h18M3 7l2-3h14l2 3M3 7v12a1 1 0 001 1h16a1 1 0 001-1V7' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition',
                  active ? 'text-indigo-600' : 'text-slate-400',
                )}
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
