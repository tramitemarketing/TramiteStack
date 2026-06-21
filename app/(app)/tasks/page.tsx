import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { PageHeader, EmptyState } from '@/components/ui'
import { TaskBoard, type BoardTask } from '@/components/task-board'
import { EmptyProjects } from '@/components/illustrations'
import type { Task, Project, Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

type Row = Task & {
  projects: { name: string } | null
  assignee: { username: string | null; color: string | null } | null
}

export default async function TasksPage() {
  const me = await requireProfile()
  const supabase = await createClient()
  const [{ data }, { data: projects }, { data: members }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, projects(name), assignee:profiles!assignee_id(username, color)')
      .order('position', { ascending: true }),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('profiles').select('id, username').eq('active', true).order('username'),
  ])

  const rows = (data as Row[] | null) ?? []
  const tasks: BoardTask[] = rows.map((t) => ({
    ...t,
    projectName: t.projects?.name ?? null,
    assigneeName: t.assignee?.username ?? null,
    assigneeColor: t.assignee?.color ?? null,
  }))
  const projList = (projects as Pick<Project, 'id' | 'name'>[] | null) ?? []
  const memberList = (members as Pick<Profile, 'id' | 'username'>[] | null) ?? []

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
