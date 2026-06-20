import { createClient } from '@/lib/supabase/server'
import { PageHeader, PrimaryLink } from '@/components/ui'
import { IconPlus } from '@/components/icons'
import { ProjectsList, type ProjectRow } from '@/components/projects-list'
import type { Project } from '@/types/database'

export const dynamic = 'force-dynamic'

type Row = Project & { tasks: { count: number }[] }

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*, tasks(count)')
    .order('priority_level', { ascending: true })
    .order('created_at', { ascending: false })

  const rows = (data as Row[] | null) ?? []
  const projects: ProjectRow[] = rows.map((p) => ({ ...p, taskCount: p.tasks?.[0]?.count ?? 0 }))

  return (
    <div className="space-y-4">
      <PageHeader
        title="Progetti"
        subtitle={`${projects.length} progetti`}
        action={<PrimaryLink href="/projects/new"><IconPlus size={16} strokeWidth={2.6} /> Nuovo</PrimaryLink>}
      />
      <ProjectsList projects={projects} />
    </div>
  )
}
