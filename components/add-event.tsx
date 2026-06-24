'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/app/(app)/actions'
import { IconPlus } from '@/components/icons'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { Field, inputCls } from '@/components/field'
import { useToast } from '@/components/toast'

export function AddEvent({
  projects,
  defaultDate,
}: {
  projects: { id: string; name: string }[]
  defaultDate: string | null
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
      const res = await createEvent(formData)
      if (res?.ok) {
        setOpen(false)
        toast.success('Evento aggiunto.')
        router.refresh()
      } else {
        setError(res?.error ?? 'Operazione non riuscita.')
      }
    })
  }

  const defaultStart = defaultDate ? `${defaultDate}T09:00` : ''

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="on-brand press flex h-9 w-9 items-center justify-center rounded-[10px] text-white"
        style={{ backgroundColor: 'var(--brand)' }}
        aria-label="Aggiungi evento"
      >
        <IconPlus size={18} strokeWidth={2.6} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo evento">
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Titolo" htmlFor="ev-title" required error={error}>
            <input id="ev-title" name="title" required className={inputCls} placeholder="Titolo evento" autoFocus />
          </Field>
          <Field label="Data e ora" htmlFor="ev-start" required>
            <input id="ev-start" type="datetime-local" name="starts_at" required className={inputCls} defaultValue={defaultStart} />
          </Field>
          <Field label="Progetto" htmlFor="ev-project">
            <select id="ev-project" name="project_id" className={inputCls} defaultValue="">
              <option value="">— Nessun progetto —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Note" htmlFor="ev-desc">
            <input id="ev-desc" name="description" className={inputCls} placeholder="Facoltative" />
          </Field>
          <Button type="submit" fullWidth loading={pending} loadingLabel="Aggiunta…">
            Aggiungi evento
          </Button>
        </form>
      </Modal>
    </>
  )
}
