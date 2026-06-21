'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createTransaction } from '@/app/(app)/actions'
import { IconPlus } from '@/components/icons'

const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'
const labelCls = 'mb-1 block text-xs font-bold text-[#5A6473]'

export function AddTransaction({
  members,
  defaultOwner,
}: {
  members: { id: string; username: string | null }[]
  defaultOwner: string
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
      await createTransaction(formData)
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
              <h2 className="font-display text-lg font-bold text-navy">Nuovo movimento</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className={labelCls}>Dipendente <span className="text-danger">*</span></label>
                <select name="owner_id" required className={inputCls} defaultValue={defaultOwner}>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.username || 'Utente'}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipo</label>
                  <select name="type" className={inputCls} defaultValue="entrata">
                    <option value="entrata">Entrata</option>
                    <option value="uscita">Uscita</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Importo € <span className="text-danger">*</span></label>
                  <input type="number" step="0.01" min="0" name="amount" required className={inputCls} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Descrizione</label>
                <input name="description" className={inputCls} placeholder="Es. Pagamento cliente Rossi" />
              </div>
              <div>
                <label className={labelCls}>Data</label>
                <input type="date" name="occurred_on" className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <button type="submit" disabled={pending} className="press w-full rounded-[10px] px-4 py-3 font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand)' }}>
                {pending ? 'Registrazione…' : 'Registra movimento'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="press flex items-center gap-1 text-[11px] font-bold text-brand">
        <IconPlus size={14} strokeWidth={2.6} /> Aggiungi
      </button>
      {mounted ? createPortal(modal, document.body) : null}
    </>
  )
}
