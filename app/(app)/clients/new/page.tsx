import Link from 'next/link'
import { createClientRecord } from '@/app/(app)/actions'
import { Card, PageHeader } from '@/components/ui'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export default function NewClientPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Nuovo cliente" />
      <Card>
        <form action={createClientRecord} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome *</label>
            <input name="name" required className={inputCls} placeholder="Nome cliente o azienda" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input type="email" name="contact_email" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefono</label>
              <input name="phone" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Note</label>
            <textarea name="notes" rows={3} className={inputCls} />
          </div>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white">
              Salva cliente
            </button>
            <Link href="/clients" className="rounded-lg px-4 py-2.5 font-medium text-slate-500 ring-1 ring-slate-300">
              Annulla
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
