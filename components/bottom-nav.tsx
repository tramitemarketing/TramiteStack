'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { IconHome, IconTask, IconCalendar, IconBudget, IconProjects } from '@/components/icons'

const items = [
  { href: '/dashboard', label: 'Home', Icon: IconHome },
  { href: '/tasks', label: 'Task', Icon: IconTask },
  { href: '/calendar', label: 'Calendario', Icon: IconCalendar },
  { href: '/budget', label: 'Bilancio', Icon: IconBudget },
  { href: '/projects', label: 'Progetti', Icon: IconProjects },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E0E4EB] bg-white/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'press flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-bold transition',
                  active ? 'text-brand' : 'text-[#9CA5B3]',
                )}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition"
                  style={active ? { backgroundColor: 'var(--brand-50)' } : undefined}
                >
                  <Icon size={23} strokeWidth={active ? 2.1 : 2} />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
