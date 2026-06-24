'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, format, isSameMonth, isToday,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { deleteEvent } from '@/app/(app)/actions'
import { SubmitIcon } from '@/components/submit-button'
import { IconChevronLeft, IconChevronRight, IconTrash } from '@/components/icons'
import { EmptyCalendar } from '@/components/illustrations'
import { AddEvent } from '@/components/add-event'

export type CalItem = {
  key: string
  date: string // yyyy-MM-dd
  title: string
  kind: 'evento' | 'task' | 'progetto'
  eventId?: string
}

const KIND_COLOR: Record<CalItem['kind'], string> = {
  evento: '#7C5CD6',
  task: '#E5A93A',
  progetto: '#2A78C2',
}
const KIND_LABEL: Record<CalItem['kind'], string> = {
  evento: 'Evento',
  task: 'Scadenza task',
  progetto: 'Consegna progetto',
}

export function CalendarView({
  items,
  off,
  projects,
}: {
  items: CalItem[]
  off: number
  projects: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const month = addMonths(new Date(), off)
  const [selected, setSelected] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'))

  const goTo = (n: number) => startTransition(() => router.push(`/calendar?off=${n}`))

  // Swipe orizzontale per cambiare mese
  const touchX = useRef(0)
  function onTouchStart(e: React.TouchEvent) { touchX.current = e.changedTouches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 60) goTo(dx < 0 ? off + 1 : off - 1)
  }

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const selectedItems = selected ? items.filter((it) => it.date === selected) : []

  return (
    <div className="space-y-4">
      {/* Header mese */}
      <div className="flex items-center justify-between">
        <button onClick={() => goTo(off - 1)} className="press flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E0E4EB] bg-white text-[#3E4757]" aria-label="Mese precedente">
          <IconChevronLeft size={18} />
        </button>
        <p className="font-display text-lg font-extrabold capitalize text-navy">{format(month, 'MMMM yyyy', { locale: it })}</p>
        <button onClick={() => goTo(off + 1)} className="press flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E0E4EB] bg-white text-[#3E4757]" aria-label="Mese successivo">
          <IconChevronRight size={18} />
        </button>
      </div>

      {/* Griglia mese (swipe per cambiare mese) — skeleton durante il cambio mese */}
      {pending ? (
        <MonthGridSkeleton />
      ) : (
      <div data-no-swipe className="rounded-2xl bg-white p-3 ring-1 ring-[#E0E4EB]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#6B7280]">
          {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const dayItems = items.filter((it) => it.date === key)
            const isSel = selected === key
            const out = !isSameMonth(d, month)
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  'press flex aspect-square flex-col items-center justify-center rounded-[9px] text-[13px] font-semibold transition',
                  out ? 'text-[#6B7280]' : 'text-[#3E4757]',
                  isToday(d) && !isSel && 'text-brand font-extrabold',
                  isSel && 'font-extrabold text-white',
                )}
                style={isSel ? { backgroundColor: 'var(--brand)' } : undefined}
              >
                {format(d, 'd')}
                <span className="mt-0.5 flex h-1 gap-0.5">
                  {dayItems.slice(0, 3).map((it) => (
                    <span key={it.key} className="h-1 w-1 rounded-full" style={{ background: isSel ? '#fff' : KIND_COLOR[it.kind] }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      )}

      {/* Dettaglio giorno */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-4 ring-1 ring-[#E0E4EB]">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="font-display text-sm font-bold capitalize text-[#1A1F2B]">
            {selected ? format(new Date(selected), 'EEEE d MMMM', { locale: it }) : 'Seleziona un giorno'}
          </p>
          <AddEvent projects={projects} defaultDate={selected} />
        </div>
        {selectedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2">
            {selectedItems.map((it) => (
              <li key={it.key} className="flex items-center gap-3 rounded-[10px] border border-[#E0E4EB] p-2.5">
                <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: KIND_COLOR[it.kind] }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#1A1F2B]">{it.title}</p>
                  <p className="text-[11px] font-semibold text-[#6B7280]">{KIND_LABEL[it.kind]}</p>
                </div>
                {it.eventId && (
                  <form action={deleteEvent}>
                    <input type="hidden" name="id" value={it.eventId} />
                    <SubmitIcon label="Elimina evento" className="p-1 text-[#6B7280] hover:text-danger">
                      <IconTrash size={16} />
                    </SubmitIcon>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-3 text-center">
      <EmptyCalendar />
      <p className="text-sm font-semibold text-[#6B7280]">Niente in programma.</p>
    </div>
  )
}

// Skeleton della griglia mese (mostrato durante il cambio mese)
function MonthGridSkeleton() {
  return (
    <div data-no-swipe className="rounded-2xl bg-white p-3 ring-1 ring-[#E0E4EB]">
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#6B7280]">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square rounded-[9px]" />
        ))}
      </div>
    </div>
  )
}
