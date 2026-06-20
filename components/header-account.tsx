'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/login/actions'
import { Avatar } from '@/components/ui'

// Avatar con menu rapido (Impostazioni + Esci).
export function HeaderAccount({ username }: { username: string | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="press rounded-full" aria-label="Account">
        <Avatar name={username} size={36} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-[#E0E4EB] bg-white shadow-lg">
          <div className="border-b border-[#EFF1F5] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold text-[#9CA5B3]">Accesso come</p>
            <p className="truncate text-sm font-bold text-[#1A1F2B]">{username || 'Utente'}</p>
          </div>
          <Link href="/settings" className="block px-3.5 py-2.5 text-sm font-semibold text-[#3E4757] hover:bg-[#F7F8FA]">
            Impostazioni
          </Link>
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
