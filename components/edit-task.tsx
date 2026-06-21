'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { updateTask } from '@/app/(app)/actions'
import { IconDots } from '@/components/icons'
import type { Task } from '@/types/database'

const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'
const labelCls = 'mb-1 block text-xs font-bold text-[#5A6473]'
const PRIORITY_OPTS = [
  { v: '1', l: 'P1 · Urgente' },
  { v: '2', l: 'P2 · Alta' },
  { v: '3', l: 'P3 · Media' },
  { v: '4', l: 'P4 · Bassa' },
  { v: '5', l: 'P5 · Molto bassa' },
]

export function EditTask({
  task,
  members,
}: {
  task: Pick<Task, 'id' | 'title' | 'priority_level' | 'due_date' | 'assignee_id' | 'project_id'>
  members: { id: string; username: string | null }[]
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateTask(formData)
      setOpen(false)
      router.refresh()
    })
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/40 sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="my-auto w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl"
            initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy">Modifica task</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="project_id" value={task.project_id} />
              <div>
                <label className={labelCls}>Titolo <span className="text-danger">*</span></label>
                <input name="title" required defaultValue={task.title} className={inputCls} placeholder="Titolo del task" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Priorità</label>
                  <select name="priority_level" className={inputCls} defaultValue={String(task.priority_level)}>
                    {PRIORITY_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Scadenza</label>
                  <input type="date" name="due_date" className={inputCls} defaultValue={task.due_date ?? ''} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Assegnatario</label>
                <select name="assignee_id" className={inputCls} defaultValue={task.assignee_id ?? ''}>
                  <option value="">Nessuno</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.username || 'Utente'}</option>)}
                </select>
              </div>
              <button type="submit" disabled={pending} className="press w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand)' }}>
                {pending ? 'Salvataggio…' : 'Salva modifiche'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen(true)}
        className="press shrink-0 rounded-md p-1 text-[#C4CBD6] hover:text-[#3E4757]"
        aria-label="Modifica task"
      >
        <IconDots size={16} />
      </button>

      {mounted ? createPortal(modal, document.body) : null}
    </>
  )
}
