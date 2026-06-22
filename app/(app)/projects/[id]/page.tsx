import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  ProjectStatusBadge,
  PriorityBadge,
  ProgressBar,
  EmptyState,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { type Project, type Task, type Profile } from '@/types/database'
import { deleteProject } from '@/app/(app)/actions'
import { CreateTaskButton } from '@/components/create-task'
import { AttachmentsPanel } from '@/components/attachments-panel'
import { SubmitButton } from '@/components/submit-button'
import { EditProject } from '@/components/edit-project'
import { ProjectTaskItem } from '@/components/project-task-item'
import { EmptyTasks } from '@/components/illustrations'
import { IconBack, IconTrash, IconClock } from '@/components/icons'

export const dynamic = 'force-dynamic'

type TaskRow = Task & { assignee: { username: string | null; color: string | null } | null }

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if (!project) notFound()
  const p = project as Project

  const [{ data: tasks }, { data: members }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, assignee:profiles!assignee_id(username, color)')
      .eq('project_id', id)
      .order('position'),
    supabase.from('profiles').select('id, username').eq('active', true).order('username'),
  ])
  const taskRows = (tasks as TaskRow[] | null) ?? []
  const memberList = (members as Pick<Profile, 'id' | 'username'>[] | null) ?? []

  return (
    <div className="space-y-5">
      {/* Header dettaglio colorato: indietro + titolo + ⋮ */}
      <header
        className="-mx-4 -mt-5 px-4 pb-4 text-white"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)', backgroundColor: p.color || '#0F4C81' }}
      >
        <div className="flex items-center gap-2">
          <Link href="/projects" className="press -ml-1 flex h-9 w-9 items-center justify-center rounded-[10px] text-white hover:bg-white/10" aria-label="Indietro">
            <IconBack size={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[19px] font-extrabold leading-tight tracking-tight text-white">{p.name}</h1>
            <p className="text-[11px] font-semibold text-white/75">
              {taskRows.length} task · {p.status.replace('_', ' ')}
            </p>
          </div>
          <ProjectStatusBadge status={p.status} />
          <EditProject project={p} triggerClassName="text-white hover:bg-white/10" />
        </div>
      </header>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3">
        <PriorityBadge level={p.priority_level} />
        {p.due_date && (
          <span className="flex items-center gap-1 text-xs font-semibold text-[#9CA5B3]">
            <IconClock size={14} /> scadenza {formatDate(p.due_date, 'd MMM yyyy')}
          </span>
        )}
      </div>
      {p.description && <p className="text-sm font-medium text-[#5A6473]">{p.description}</p>}

      {taskRows.length > 0 && (
        <Card className="p-3">
          <ProgressBar done={taskRows.filter((t) => t.status === 'completato').length} total={taskRows.length} />
        </Card>
      )}

      {/* Elimina progetto */}
      <form action={deleteProject}>
        <input type="hidden" name="id" value={p.id} />
        <SubmitButton pendingLabel="Eliminazione…" className="rounded-[10px] px-3 py-2 text-sm font-bold text-danger ring-1 ring-[#F2C7BD]">
          <IconTrash size={16} /> Elimina progetto
        </SubmitButton>
      </form>

      {/* Task del progetto */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display font-bold text-[#1A1F2B]">Task ({taskRows.length})</h2>
          <CreateTaskButton projects={[{ id: p.id, name: p.name }]} members={memberList} defaultProjectId={p.id} />
        </div>
        {taskRows.length === 0 ? (
          <EmptyState title="Nessun task" hint="Crea il primo task del progetto." illustration={<EmptyTasks />} />
        ) : (
          <div className="space-y-2">
            {taskRows.map((t) => (
              <ProjectTaskItem key={t.id} task={t} members={memberList} projectName={p.name} projectColor={p.color} />
            ))}
          </div>
        )}
        <p className="mt-2 text-center text-[11px] font-medium text-[#9CA5B3]">Trascina i task tra gli stati dalla pagina <strong>Task</strong>.</p>
      </section>

      {/* Allegati */}
      <AttachmentsPanel projectId={p.id} />
    </div>
  )
}
