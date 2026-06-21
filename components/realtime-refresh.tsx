'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Aggiorna i dati della pagina quando cambia qualcosa di condiviso (task,
// movimenti, eventi, progetti) — anche per modifiche fatte da altri utenti.
export function RealtimeRefresh() {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => router.refresh(), 400)
    }
    const channel = supabase
      .channel('tstack-realtime')
      .on('postgres_changes', { event: '*', schema: 'tstack' }, refresh)
      .subscribe()
    return () => {
      if (timer.current) clearTimeout(timer.current)
      void supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
