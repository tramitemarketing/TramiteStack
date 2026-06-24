'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/app/(app)/actions'
import { IconPlus } from '@/components/icons'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { Field, inputCls } from '@/components/field'
import { useToast } from '@/components/toast'

export function AddTransaction({
  members,
  defaultOwner,
}: {
  members: { id: string; username: string | null }[]
  defaultOwner: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createTransaction(formData)
      if (res?.ok) {
        setOpen(false)
        toast.success('Movimento registrato.')
        router.refresh()
      } else {
        setError(res?.error ?? 'Operazione non riuscita.')
      }
    })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="press flex items-center gap-1 text-[13px] font-bold text-brand">
        <IconPlus size={14} strokeWidth={2.6} /> Aggiungi
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo movimento">
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Dipendente" htmlFor="tx-owner" required>
            <select id="tx-owner" name="owner_id" required className={inputCls} defaultValue={defaultOwner}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.username || 'Utente'}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo" htmlFor="tx-type">
              <select id="tx-type" name="type" className={inputCls} defaultValue="entrata">
                <option value="entrata">Entrata</option>
                <option value="uscita">Uscita</option>
              </select>
            </Field>
            <Field label="Importo €" htmlFor="tx-amount" required error={error}>
              <input id="tx-amount" type="text" inputMode="decimal" name="amount" required className={inputCls} placeholder="0,00" />
            </Field>
          </div>
          <Field label="Descrizione" htmlFor="tx-desc">
            <input id="tx-desc" name="description" className={inputCls} placeholder="Es. Pagamento cliente Rossi" />
          </Field>
          <Field label="Data" htmlFor="tx-date">
            <input id="tx-date" type="date" name="occurred_on" className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Button type="submit" fullWidth loading={pending} loadingLabel="Registrazione…">
            Registra movimento
          </Button>
        </form>
      </Modal>
    </>
  )
}
