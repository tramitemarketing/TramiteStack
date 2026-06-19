import { createClient } from '@/lib/supabase/server'
import { Card, PageHeader, PrimaryLink, EmptyState } from '@/components/ui'
import type { Client } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('*').order('name')
  const clients = (data as Client[] | null) ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clienti"
        subtitle={`${clients.length} clienti`}
        action={<PrimaryLink href="/clients/new">+ Nuovo</PrimaryLink>}
      />
      {clients.length === 0 ? (
        <EmptyState title="Nessun cliente" hint="Aggiungi il primo cliente" />
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <Card key={c.id} className="p-3">
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-slate-500">
                {[c.contact_email, c.phone].filter(Boolean).join(' · ') || 'Nessun contatto'}
              </p>
              {c.notes && <p className="mt-1 text-sm text-slate-600">{c.notes}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
