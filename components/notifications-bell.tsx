'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { IconBell, IconCheck, IconEuro, IconClock } from '@/components/icons'

type Notif = { id: string; type: string; title: string; body: string | null; created_at: string; read_at: string | null }
type Due = { id: string; title: string; due_date: string }

export function NotificationsBell({ meId }: { meId: string }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [due, setDue] = useState<Due[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const [{ data: n }, { data: d }] = await Promise.all([
      supabase.from('notifications').select('id, type, title, body, created_at, read_at').eq('user_id', meId).order('created_at', { ascending: false }).limit(20),
      supabase.from('tasks').select('id, title, due_date').eq('assignee_id', meId).neq('status', 'completato').in('due_date', [today, tomorrow]),
    ])
    setNotifs((n as Notif[]) ?? [])
    setDue((d as Due[]) ?? [])
  }, [meId])

  useEffect(() => {
    // Caricamento iniziale (lo stato si aggiorna dopo l'await, non in modo sincrono).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    const onVis = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', onVis)
    function onDocClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', onDocClick)
    return () => { document.removeEventListener('visibilitychange', onVis); document.removeEventListener('click', onDocClick) }
  }, [load])

  const unread = notifs.filter((n) => !n.read_at).length + due.length

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && notifs.some((n) => !n.read_at)) {
      // Segna come lette le notifiche aperte
      const supabase = createClient()
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', meId).is('read_at', null)
      setNotifs((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })))
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="press relative flex h-9 w-9 items-center justify-center rounded-full text-[#3E4757] hover:bg-[#EFF1F5]" aria-label="Notifiche">
        <IconBell size={21} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-white" style={{ backgroundColor: 'var(--danger)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 max-h-[70vh] w-72 overflow-y-auto rounded-xl border border-[#E0E4EB] bg-white shadow-lg">
          <div className="border-b border-[#EFF1F5] px-3.5 py-2.5">
            <p className="font-display text-sm font-bold text-[#1A1F2B]">Notifiche</p>
          </div>

          {due.length === 0 && notifs.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-sm font-medium text-[#9CA5B3]">Nessuna notifica.</p>
          ) : (
            <ul className="divide-y divide-[#EFF1F5]">
              {due.map((d) => (
                <li key={'due' + d.id} className="flex items-start gap-2.5 px-3.5 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#FDF4DD] text-[#C8932B]"><IconClock size={15} /></span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1A1F2B]">Scade {d.due_date === today ? 'oggi' : 'domani'}</p>
                    <p className="truncate text-[12px] font-medium text-[#5A6473]">{d.title}</p>
                  </div>
                </li>
              ))}
              {notifs.map((n) => (
                <li key={n.id} className="flex items-start gap-2.5 px-3.5 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#EEF5FC] text-brand">
                    {n.type === 'movimento' ? <IconEuro size={15} /> : <IconCheck size={15} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1A1F2B]">{n.title}</p>
                    {n.body && <p className="truncate text-[12px] font-medium text-[#5A6473]">{n.body}</p>}
                    <p className="text-[10px] font-semibold text-[#9CA5B3]">{formatDate(n.created_at, 'd MMM')}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
