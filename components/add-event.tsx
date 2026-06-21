'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createEvent } from '@/app/(app)/actions'
import { IconPlus } from '@/components/icons'

const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'
const labelCls = 'mb-1 block text-xs font-bold text-[#5A6473]'

export function AddEvent({
  projects,
  defaultDate,
}: {
  projects: { id: string; name: string }[]
  defaultDate: string | null
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
      await createEvent(formData)
      setOpen(false)
      router.refresh()
    })
  }

  const defaultStart = defaultDate ? `${defaultDate}T09:00` : ''

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
              <h2 className="font-display text-lg font-bold text-navy">Nuovo evento</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className={labelCls}>Titolo <span className="text-danger">*</span></label>
                <input name="title" required className={inputCls} placeholder="Titolo evento" autoFocus />
              </div>
              <div>
                <label className={labelCls}>Data e ora <span className="text-danger">*</span></label>
                <input type="datetime-local" name="starts_at" required className={inputCls} defaultValue={defaultStart} />
              </div>
              <div>
                <label className={labelCls}>Progetto</label>
                <select name="project_id" className={inputCls} defaultValue="">
                  <option value="">— Nessun progetto —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Note</label>
                <input name="description" className={inputCls} placeholder="Facoltative" />
              </div>
              <button type="submit" disabled={pending} className="press w-full rounded-[10px] px-4 py-3 font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand)' }}>
                {pending ? 'Aggiunta…' : 'Aggiungi evento'}
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
        onClick={() => setOpen(true)}
        className="press flex h-8 w-8 items-center justify-center rounded-[9px] text-white"
        style={{ backgroundColor: 'var(--brand)' }}
        aria-label="Aggiungi evento"
      >
        <IconPlus size={18} strokeWidth={2.6} />
      </button>
      {mounted ? createPortal(modal, document.body) : null}
    </>
  )
}
