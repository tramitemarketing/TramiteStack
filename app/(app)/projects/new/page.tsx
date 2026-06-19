import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createProject } from '@/app/(app)/actions'
import { Card, PageHeader } from '@/components/ui'
import { PROJECT_STATUS_LABEL, type Client } from '@/types/database'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase.from('clients').select('id, name').order('name')
  const list = (clients as Pick<Client, 'id' | 'name'>[] | null) ?? []

  return (
    <div className="space-y-4">
      <PageHeader title="Nuovo progetto" />
      <Card>
        <form action={createProject} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome *</label>
            <input name="name" required className={inputCls} placeholder="Es. Social media estate" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cliente</label>
            <select name="client_id" className={inputCls} defaultValue="">
              <option value="">— Nessun cliente —</option>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Stato</label>
              <select name="status" className={inputCls} defaultValue="attivo">
                {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Scadenza</label>
              <input type="date" name="due_date" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Budget previsto (€)</label>
            <input type="number" step="0.01" min="0" name="budget_amount" className={inputCls} placeholder="0,00" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descrizione</label>
            <textarea name="description" rows={3} className={inputCls} />
          </div>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white active:scale-[0.99]">
              Crea progetto
            </button>
            <Link
              href="/projects"
              className="rounded-lg px-4 py-2.5 font-medium text-slate-500 ring-1 ring-slate-300"
            >
              Annulla
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
