'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/app/(app)/actions'
import { IconPlus } from '@/components/icons'
import { AssigneeCheckboxes } from '@/components/assignee-checkboxes'
import type { MemberInfo } from '@/components/assignees'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { Field, inputCls } from '@/components/field'
import { useToast } from '@/components/toast'

export function CreateTaskButton({
  projects,
  members,
  defaultProjectId,
}: {
  projects: { id: string; name: string }[]
  members: MemberInfo[]
  defaultProjectId?: string
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
      const res = await createTask(formData)
      if (res?.ok) {
        setOpen(false)
        toast.success('Task creato.')
        router.refresh()
      } else {
        setError(res?.error ?? 'Operazione non riuscita.')
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <IconPlus size={16} strokeWidth={2.6} /> Nuovo
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo task">
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Titolo" htmlFor="task-title" required error={error}>
            <input id="task-title" name="title" required className={inputCls} placeholder="Titolo del task" autoFocus />
          </Field>
          <Field label="Descrizione" htmlFor="task-desc">
            <textarea id="task-desc" name="description" rows={3} className={inputCls} placeholder="Dettagli, note, link…" />
          </Field>
          <Field label="Progetto" htmlFor="task-project" required>
            <select id="task-project" name="project_id" required className={inputCls} defaultValue={defaultProjectId ?? ''}>
              <option value="" disabled>Seleziona progetto…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priorità" htmlFor="task-priority">
              <select id="task-priority" name="priority_level" className={inputCls} defaultValue="3">
                <option value="1">P1 · Urgente</option>
                <option value="2">P2 · Alta</option>
                <option value="3">P3 · Media</option>
                <option value="4">P4 · Bassa</option>
                <option value="5">P5 · Molto bassa</option>
              </select>
            </Field>
            <Field label="Scadenza" htmlFor="task-due">
              <input id="task-due" type="date" name="due_date" className={inputCls} />
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-[#3E4757]">Assegnatari</span>
            <AssigneeCheckboxes members={members} />
          </div>
          <Button type="submit" fullWidth loading={pending} loadingLabel="Creazione…">
            Crea task
          </Button>
        </form>
      </Modal>
    </>
  )
}
