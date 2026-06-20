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

export type CalItem = {
  id: string
  date: string // yyyy-MM-dd
  title: string
  kind: 'evento' | 'task' | 'progetto'
}

const KIND_DOT: Record<CalItem['kind'], string> = {
  evento: 'bg-violet-500',
  task: 'bg-amber-500',
  progetto: 'bg-cyan-500',
}

function MonthGrid({
  month,
  items,
  selected,
  onSelect,
}: {
  month: Date
  items: CalItem[]
  selected: string | null
  onSelect: (d: string) => void
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <p className="mb-2 text-center text-sm font-bold capitalize">{format(month, 'MMMM yyyy', { locale: it })}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const dayItems = items.filter((it) => it.date === key)
          const isSel = selected === key
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
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
                  <span key={it.id} className={cn('h-1.5 w-1.5 rounded-full', isSel ? 'bg-white' : KIND_DOT[it.kind])} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarView({ items, off }: { items: CalItem[]; off: number }) {
  const router = useRouter()
  const base = addMonths(new Date(), off)
  const [selected, setSelected] = useState<string | null>(null)
  const selectedItems = selected ? items.filter((it) => it.date === selected) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/calendar?off=${off - 1}`)} className="press rounded-lg bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-200">←</button>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" />Eventi</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Task</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500" />Progetti</span>
        </div>
        <button onClick={() => router.push(`/calendar?off=${off + 1}`)} className="press rounded-lg bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-200">→</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MonthGrid month={base} items={items} selected={selected} onSelect={setSelected} />
        <MonthGrid month={addMonths(base, 1)} items={items} selected={selected} onSelect={setSelected} />
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="mb-2 text-sm font-bold capitalize">
            {format(new Date(selected), 'EEEE d MMMM', { locale: it })}
          </p>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-slate-400">Niente in programma.</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedItems.map((it) => (
                <li key={it.id} className="flex items-center gap-2 text-sm">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', KIND_DOT[it.kind])} />
                  <span className="truncate">{it.title}</span>
                  <span className="ml-auto text-[11px] capitalize text-slate-400">{it.kind}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  )
}
