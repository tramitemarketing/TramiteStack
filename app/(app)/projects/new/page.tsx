'use client'

import { useActionState } from 'react'
import { createProject, type ActionResult } from '@/app/(app)/actions'
import { Card, PageHeader } from '@/components/ui'
import { ButtonLink, Button } from '@/components/button'
import { Field, inputCls, FormError } from '@/components/field'
import { ColorSwatches } from '@/components/color-swatches'
import { PROJECT_STATUS_LABEL } from '@/types/database'

const initialState: ActionResult | undefined = undefined

export default function NewProjectPage() {
  const [state, formAction, pending] = useActionState(createProject, initialState)
  const error = state && !state.ok ? state.error : null

  return (
    <div className="space-y-4">
      <PageHeader title="Nuovo progetto" />
      <Card>
        <form action={formAction} className="space-y-4">
          <FormError message={error} />
          <Field label="Titolo" htmlFor="np-name" required>
            <input id="np-name" name="name" required className={inputCls} placeholder="Es. Social media estate" />
          </Field>
          <Field label="Descrizione" htmlFor="np-desc">
            <textarea id="np-desc" name="description" rows={3} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stato" htmlFor="np-status">
              <select id="np-status" name="status" className={inputCls} defaultValue="attivo">
                {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Priorità" htmlFor="np-priority">
              <select id="np-priority" name="priority_level" className={inputCls} defaultValue="3">
                <option value="1">P1 · Urgente</option>
                <option value="2">P2 · Alta</option>
                <option value="3">P3 · Media</option>
                <option value="4">P4 · Bassa</option>
                <option value="5">P5 · Molto bassa</option>
              </select>
            </Field>
          </div>
          <Field label="Scadenza" htmlFor="np-due">
            <input id="np-due" type="date" name="due_date" className={inputCls} />
          </Field>
          <div>
            <span className="mb-2 block text-sm font-semibold text-[#3E4757]">Colore</span>
            <ColorSwatches name="color" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" fullWidth loading={pending} loadingLabel="Creazione…">
              Crea progetto
            </Button>
            <ButtonLink href="/projects" variant="secondary">
              Annulla
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  )
}
