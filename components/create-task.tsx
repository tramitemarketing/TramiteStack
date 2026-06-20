'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createTask } from '@/app/(app)/actions'
import { IconPlus } from '@/components/icons'

const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'

export function CreateTaskButton({
  projects,
  members,
  defaultProjectId,
}: {
  projects: { id: string; name: string }[]
  members: { id: string; username: string | null }[]
  defaultProjectId?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await createTask(formData)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="press inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-sm font-bold text-white shadow-sm"
        style={{ backgroundColor: 'var(--brand)' }}
      >
        <IconPlus size={16} strokeWidth={2.6} /> Nuovo
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl"
              initial={{ y: 40, opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-navy">Nuovo task</h2>
                <button onClick={() => setOpen(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={onSubmit} className="space-y-3">
                <input name="title" required className={inputCls} placeholder="Titolo del task" autoFocus />
                <select name="project_id" required className={inputCls} defaultValue={defaultProjectId ?? ''}>
                  <option value="" disabled>Progetto…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select name="priority_level" className={inputCls} defaultValue="3">
                    <option value="1">Priorità 1</option>
                    <option value="2">Priorità 2</option>
                    <option value="3">Priorità 3</option>
                    <option value="4">Priorità 4</option>
                    <option value="5">Priorità 5</option>
                  </select>
                  <input type="date" name="due_date" className={inputCls} />
                </div>
                <select name="assignee_id" className={inputCls} defaultValue="">
                  <option value="">In carico a… (nessuno)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.username || 'Utente'}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={pending}
                  className="press w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {pending ? 'Creazione…' : 'Crea task'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
