import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, PageHeader, PrimaryLink, ProjectStatusBadge, EmptyState } from '@/components/ui'
import { formatEuro, formatDate } from '@/lib/utils'
import type { Project, ProjectFinancials } from '@/types/database'

export const dynamic = 'force-dynamic'

type ProjectRow = Project & { clients: { name: string } | null }

export default async function ProjectsPage() {
  const supabase = await createClient()
  const [{ data: projects }, { data: fin }] = await Promise.all([
    supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
    supabase.from('project_financials').select('*'),
  ])

  const rows = (projects as ProjectRow[] | null) ?? []
  const finById = new Map((fin as ProjectFinancials[] | null)?.map((f) => [f.project_id, f]) ?? [])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Progetti"
        subtitle={`${rows.length} progetti`}
        action={<PrimaryLink href="/projects/new">+ Nuovo</PrimaryLink>}
      />

      {rows.length === 0 ? (
        <EmptyState title="Nessun progetto" hint="Crea il primo progetto per iniziare" />
      ) : (
        <div className="space-y-2">
          {rows.map((p) => {
            const f = finById.get(p.id)
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p.clients?.name ?? 'Senza cliente'}
                        {p.due_date ? ` · scadenza ${formatDate(p.due_date)}` : ''}
                      </p>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Margine:{' '}
                      <span className={(f?.margin ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {formatEuro(Number(f?.margin ?? 0))}
                      </span>
                    </span>
                    <span className="text-slate-400">Budget {formatEuro(Number(p.budget_amount))}</span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
