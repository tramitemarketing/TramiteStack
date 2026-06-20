'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, format, isSameMonth, isToday,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { deleteEvent } from '@/app/(app)/actions'
import { SubmitSpinner } from '@/components/loading-overlay'

export type CalItem = {
  key: string
  date: string // yyyy-MM-dd
  title: string
  kind: 'evento' | 'task' | 'progetto'
  eventId?: string
}

const KIND_DOT: Record<CalItem['kind'], string> = {
  evento: 'bg-violet-500',
  task: 'bg-amber-500',
  progetto: 'bg-cyan-500',
}

export function CalendarView({ items, off }: { items: CalItem[]; off: number }) {
  const router = useRouter()
  const month = addMonths(new Date(), off)
  const [selected, setSelected] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'))

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const selectedItems = selected ? items.filter((it) => it.date === selected) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/calendar?off=${off - 1}`)} className="press rounded-lg bg-white px-3 py-1.5 text-lg font-bold ring-1 ring-slate-200">←</button>
        <p className="text-base font-bold capitalize">{format(month, 'MMMM yyyy', { locale: it })}</p>
        <button onClick={() => router.push(`/calendar?off=${off + 1}`)} className="press rounded-lg bg-white px-3 py-1.5 text-lg font-bold ring-1 ring-slate-200">→</button>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const dayItems = items.filter((it) => it.date === key)
            const isSel = selected === key
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  'press flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition',
                  isSameMonth(d, month) ? 'text-slate-700' : 'text-slate-300',
                  isToday(d) && !isSel && 'font-bold text-brand',
                  isSel && 'font-bold text-white',
                )}
                style={isSel ? { backgroundColor: 'var(--brand)' } : undefined}
              >
                {format(d, 'd')}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {dayItems.slice(0, 3).map((it) => (
                    <span key={it.key} className={cn('h-1.5 w-1.5 rounded-full', isSel ? 'bg-white' : KIND_DOT[it.kind])} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dettaglio del giorno selezionato */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="mb-2 text-sm font-bold capitalize">
          {selected ? format(new Date(selected), 'EEEE d MMMM', { locale: it }) : 'Seleziona un giorno'}
        </p>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-slate-400">Niente in programma.</p>
        ) : (
          <ul className="space-y-1.5">
            {selectedItems.map((it) => (
              <li key={it.key} className="flex items-center gap-2 text-sm">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', KIND_DOT[it.kind])} />
                <span className="truncate">{it.title}</span>
                <span className="ml-auto text-[11px] capitalize text-slate-400">{it.kind}</span>
                {it.eventId && (
                  <form action={deleteEvent}>
                    <SubmitSpinner />
                    <input type="hidden" name="id" value={it.eventId} />
                    <button className="press p-1 text-slate-300 hover:text-red-500" aria-label="Elimina evento">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                      </svg>
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
