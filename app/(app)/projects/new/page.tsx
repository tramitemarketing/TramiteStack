import Link from 'next/link'
import { createProject } from '@/app/(app)/actions'
import { Card, PageHeader } from '@/components/ui'
import { SubmitSpinner } from '@/components/loading-overlay'
import { PROJECT_STATUS_LABEL } from '@/types/database'

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-violet-200'

export default function NewProjectPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Nuovo progetto" />
      <Card>
        <form action={createProject} className="space-y-4">
          <SubmitSpinner />
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
            <button className="press flex-1 rounded-xl px-4 py-3 font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>
              Crea progetto
            </button>
            <Link href="/projects" className="rounded-xl px-4 py-3 font-semibold text-slate-500 ring-1 ring-slate-300">
              Annulla
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
