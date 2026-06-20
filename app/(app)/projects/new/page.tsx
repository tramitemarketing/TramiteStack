import Link from 'next/link'
import { createProject } from '@/app/(app)/actions'
import { Card, PageHeader } from '@/components/ui'
import { SubmitButton } from '@/components/submit-button'
import { PROJECT_STATUS_LABEL } from '@/types/database'

const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'

export default function NewProjectPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Nuovo progetto" />
      <Card>
        <form action={createProject} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Titolo *</label>
            <input name="name" required className={inputCls} placeholder="Es. Social media estate" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Descrizione</label>
            <textarea name="description" rows={3} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold">Stato</label>
              <select name="status" className={inputCls} defaultValue="attivo">
                {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Priorità</label>
              <select name="priority_level" className={inputCls} defaultValue="3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Scadenza</label>
            <input type="date" name="due_date" className={inputCls} />
          </div>
          <div className="flex gap-2 pt-2">
            <SubmitButton pendingLabel="Creazione…" className="flex-1 rounded-[10px] px-4 py-3 font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
              Crea progetto
            </SubmitButton>
            <Link href="/projects" className="rounded-[10px] px-4 py-3 font-bold text-[#5A6473] ring-1 ring-[#E0E4EB]">
              Annulla
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
