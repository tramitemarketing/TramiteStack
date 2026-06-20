import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, PageHeader, PrimaryLink, ProjectStatusBadge, PriorityPips, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/types/database'

export const dynamic = 'force-dynamic'

type Row = Project & { tasks: { count: number }[] }

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, tasks(count)')
    .order('priority_level', { ascending: false })
    .order('created_at', { ascending: false })

  const rows = (data as Row[] | null) ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Progetti"
        subtitle={`${rows.length} progetti`}
        action={<PrimaryLink href="/projects/new">+ Nuovo</PrimaryLink>}
      />

      {rows.length === 0 ? (
        <EmptyState title="Nessun progetto" hint="Crea il primo progetto per iniziare." />
      ) : (
        <div className="space-y-2">
          {rows.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{p.name}</p>
                    {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.description}</p>}
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between">
                  <PriorityPips level={p.priority_level} />
                  <span className="text-xs text-slate-400">
                    {p.tasks?.[0]?.count ?? 0} task{p.due_date ? ` · ${formatDate(p.due_date, 'd MMM')}` : ''}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
