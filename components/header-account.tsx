'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/login/actions'
import { Avatar } from '@/components/ui'
import { CenterSpinner } from '@/components/loading-overlay'

// Avatar con menu rapido (Impostazioni + Esci).
export function HeaderAccount({ username, color }: { username: string | null; color?: string | null }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  function go(path: string) {
    setOpen(false)
    startTransition(() => router.push(path))
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      {pending && <CenterSpinner />}
      <button
        onClick={() => setOpen((v) => !v)}
        className="press rounded-full"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={username} size={36} color={color} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-[#E0E4EB] bg-white shadow-lg">
          <div className="border-b border-[#EFF1F5] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-[#6B7280]">Accesso come</p>
            <p className="truncate text-sm font-bold text-[#1A1F2B]">{username || 'Utente'}</p>
          </div>
          <button onClick={() => go('/me')} className="block w-full px-3.5 py-2.5 text-left text-sm font-semibold text-[#3E4757] hover:bg-[#F7F8FA]">
            Area personale
          </button>
          <button onClick={() => go('/settings')} className="block w-full px-3.5 py-2.5 text-left text-sm font-semibold text-[#3E4757] hover:bg-[#F7F8FA]">
            Impostazioni
          </button>
          <form action={signOut}>
            <button type="submit" className="block w-full px-3.5 py-2.5 text-left text-sm font-semibold text-[#D8553F] hover:bg-[#FBEAE6]">
              Esci
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
