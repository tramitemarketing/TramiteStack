import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { PageHeader, EmptyState } from '@/components/ui'
import { TaskBoard, type BoardTask } from '@/components/task-board'
import { EmptyProjects } from '@/components/illustrations'
import type { Task, Project, Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

type Row = Task & {
  projects: { name: string; color: string | null } | null
}

export default async function TasksPage() {
  const me = await requireProfile()
  const supabase = await createClient()
  await supabase.rpc('archive_completed_tasks')
  const [{ data }, { data: projects }, { data: members }, { data: checklist }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, projects(name, color)')
      .is('archived_at', null)
      .order('position', { ascending: true }),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('profiles').select('id, username, color').eq('active', true).order('username'),
    supabase.from('task_checklist').select('task_id, done'),
  ])

  const clCounts = new Map<string, { total: number; done: number }>()
  for (const c of (checklist as { task_id: string; done: boolean }[] | null) ?? []) {
    const e = clCounts.get(c.task_id) ?? { total: 0, done: 0 }
    e.total++
    if (c.done) e.done++
    clCounts.set(c.task_id, e)
  }

  const rows = (data as Row[] | null) ?? []
  const tasks: BoardTask[] = rows.map((t) => ({
    ...t,
    projectName: t.projects?.name ?? null,
    projectColor: t.projects?.color ?? null,
    checklistTotal: clCounts.get(t.id)?.total ?? 0,
    checklistDone: clCounts.get(t.id)?.done ?? 0,
  }))
  const projList = (projects as Pick<Project, 'id' | 'name'>[] | null) ?? []
  const memberList = (members as Pick<Profile, 'id' | 'username' | 'color'>[] | null) ?? []

  // Senza progetti non si possono creare task: mostra lo stato vuoto dedicato.
  if (projList.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Task" />
        <EmptyState title="Nessun progetto" hint="Crea prima un progetto, poi le task." illustration={<EmptyProjects />} />
      </div>
    )
  }

  return <TaskBoard initialTasks={tasks} meId={me.id} members={memberList} projects={projList} />
}
