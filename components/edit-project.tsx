'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProject } from '@/app/(app)/actions'
import { cn } from '@/lib/utils'
import { IconDots } from '@/components/icons'
import { ColorSwatches } from '@/components/color-swatches'
import { PROJECT_STATUS_LABEL, type Project } from '@/types/database'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { Field, inputCls } from '@/components/field'
import { useToast } from '@/components/toast'

export function EditProject({
  project,
  triggerClassName,
}: {
  project: Pick<Project, 'id' | 'name' | 'description' | 'status' | 'priority_level' | 'color' | 'due_date'>
  triggerClassName?: string
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
      const res = await updateProject(formData)
      if (res?.ok) {
        setOpen(false)
        toast.success('Progetto aggiornato.')
        router.refresh()
      } else {
        setError(res?.error ?? 'Operazione non riuscita.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('press flex h-11 w-11 items-center justify-center rounded-[10px]', triggerClassName || 'text-[#3E4757] hover:bg-[#EFF1F5]')}
        aria-label="Modifica progetto"
      >
        <IconDots size={20} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modifica progetto">
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="hidden" name="id" value={project.id} />
          <Field label="Titolo" htmlFor="ep-name" required error={error}>
            <input id="ep-name" name="name" required defaultValue={project.name} className={inputCls} placeholder="Titolo" />
          </Field>
          <Field label="Descrizione" htmlFor="ep-desc">
            <textarea id="ep-desc" name="description" rows={3} defaultValue={project.description ?? ''} className={inputCls} placeholder="Descrizione" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stato" htmlFor="ep-status">
              <select id="ep-status" name="status" className={inputCls} defaultValue={project.status}>
                {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Priorità" htmlFor="ep-priority">
              <select id="ep-priority" name="priority_level" className={inputCls} defaultValue={String(project.priority_level)}>
                <option value="1">P1 · Urgente</option>
                <option value="2">P2 · Alta</option>
                <option value="3">P3 · Media</option>
                <option value="4">P4 · Bassa</option>
                <option value="5">P5 · Molto bassa</option>
              </select>
            </Field>
          </div>
          <Field label="Scadenza" htmlFor="ep-due">
            <input id="ep-due" type="date" name="due_date" className={inputCls} defaultValue={project.due_date ?? ''} />
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-[#3E4757]">Colore</span>
            <ColorSwatches name="color" value={project.color} />
          </div>
          <Button type="submit" fullWidth loading={pending} loadingLabel="Salvataggio…">
            Salva modifiche
          </Button>
        </form>
      </Modal>
    </>
  )
}
