import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { PageHeader, EmptyState } from '@/components/ui'
import { TaskBoard, type BoardTask } from '@/components/task-board'
import { CreateTaskButton } from '@/components/create-task'
import { EmptyTasks, EmptyProjects } from '@/components/illustrations'
import type { Task, Project, Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

type Row = Task & {
  projects: { name: string } | null
  assignee: { username: string | null } | null
}

export default async function TasksPage() {
  const me = await requireProfile()
  const supabase = await createClient()
  const [{ data }, { data: projects }, { data: members }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, projects(name), assignee:profiles!assignee_id(username)')
      .order('position', { ascending: true }),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('profiles').select('id, username').eq('active', true).order('username'),
  ])

  const rows = (data as Row[] | null) ?? []
  const tasks: BoardTask[] = rows.map((t) => ({
    ...t,
    projectName: t.projects?.name ?? null,
    assigneeName: t.assignee?.username ?? null,
  }))
  const projList = (projects as Pick<Project, 'id' | 'name'>[] | null) ?? []
  const memberList = (members as Pick<Profile, 'id' | 'username'>[] | null) ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Task"
        subtitle={`${tasks.length} totali`}
        action={<CreateTaskButton projects={projList} members={memberList} />}
      />
      {projList.length === 0 ? (
        <EmptyState title="Nessun progetto" hint="Crea prima un progetto, poi i task." illustration={<EmptyProjects />} />
      ) : tasks.length === 0 ? (
        <EmptyState title="Nessun task" hint="Tocca “Nuovo” per iniziare." illustration={<EmptyTasks />} />
      ) : (
        <TaskBoard initialTasks={tasks} meId={me.id} members={memberList} />
      )}
    </div>
  )
}
