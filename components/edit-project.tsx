'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { updateProject } from '@/app/(app)/actions'
import { CenterSpinner } from '@/components/loading-overlay'
import { PROJECT_STATUS_LABEL, type Project } from '@/types/database'

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-violet-200'

export function EditProject({
  project,
}: {
  project: Pick<Project, 'id' | 'name' | 'description' | 'status' | 'priority_level' | 'due_date'>
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
      await updateProject(formData)
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
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="my-auto w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl"
            initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Modifica progetto</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <input type="hidden" name="id" value={project.id} />
              <input name="name" required defaultValue={project.name} className={inputCls} placeholder="Titolo" />
              <textarea name="description" rows={3} defaultValue={project.description ?? ''} className={inputCls} placeholder="Descrizione" />
              <div className="grid grid-cols-2 gap-3">
                <select name="status" className={inputCls} defaultValue={project.status}>
                  {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select name="priority_level" className={inputCls} defaultValue={String(project.priority_level)}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Priorità {n}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Scadenza</label>
                <input type="date" name="due_date" className={inputCls} defaultValue={project.due_date ?? ''} />
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
      {pending && <CenterSpinner />}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press rounded-md p-1.5 text-slate-400 hover:text-slate-700"
        aria-label="Modifica progetto"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {mounted ? createPortal(modal, document.body) : null}
    </>
  )
}
