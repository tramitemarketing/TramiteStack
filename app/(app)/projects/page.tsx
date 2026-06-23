import { createClient } from '@/lib/supabase/server'
import { PageHeader, PrimaryLink } from '@/components/ui'
import { IconPlus } from '@/components/icons'
import { ProjectsList, type ProjectRow } from '@/components/projects-list'
import type { Project } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()
  await supabase.rpc('archive_completed_projects')
  const [{ data }, { data: taskStatus }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .is('archived_at', null)
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase.from('tasks').select('project_id, status').is('archived_at', null),
  ])

  const rows = (data as Project[] | null) ?? []
  const counts = new Map<string, { total: number; done: number }>()
  for (const t of (taskStatus as { project_id: string; status: string }[] | null) ?? []) {
    const c = counts.get(t.project_id) ?? { total: 0, done: 0 }
    c.total++
    if (t.status === 'completato') c.done++
    counts.set(t.project_id, c)
  }
  const projects: ProjectRow[] = rows.map((p) => ({
    ...p,
    taskCount: counts.get(p.id)?.total ?? 0,
    done: counts.get(p.id)?.done ?? 0,
  }))

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
