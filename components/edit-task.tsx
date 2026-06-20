'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { updateTask } from '@/app/(app)/actions'
import { CenterSpinner } from '@/components/loading-overlay'
import type { Task } from '@/types/database'

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-violet-200'

export function EditTask({
  task,
  members,
}: {
  task: Pick<Task, 'id' | 'title' | 'priority_level' | 'due_date' | 'assignee_id' | 'project_id'>
  members: { id: string; username: string | null }[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateTask(formData)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      {pending && <CenterSpinner />}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen(true)}
        className="press shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700"
        aria-label="Modifica task"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl"
              initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Modifica task</h2>
                <button onClick={() => setOpen(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={onSubmit} className="space-y-3">
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="project_id" value={task.project_id} />
                <input name="title" required defaultValue={task.title} className={inputCls} placeholder="Titolo del task" />
                <div className="grid grid-cols-2 gap-3">
                  <select name="priority_level" className={inputCls} defaultValue={String(task.priority_level)}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Priorità {n}</option>)}
                  </select>
                  <input type="date" name="due_date" className={inputCls} defaultValue={task.due_date ?? ''} />
                </div>
                <select name="assignee_id" className={inputCls} defaultValue={task.assignee_id ?? ''}>
                  <option value="">In carico a… (nessuno)</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.username || 'Utente'}</option>)}
                </select>
                <button type="submit" disabled={pending} className="press w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand)' }}>
                  {pending ? 'Salvataggio…' : 'Salva modifiche'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
