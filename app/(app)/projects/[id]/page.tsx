import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  ProjectStatusBadge,
  TaskStatusBadge,
  PriorityBadge,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { type Project, type Task, type Profile } from '@/types/database'
import { deleteProject } from '@/app/(app)/actions'
import { CreateTaskButton } from '@/components/create-task'
import { AttachmentsPanel } from '@/components/attachments-panel'
import { SubmitButton } from '@/components/submit-button'
import { EditProject } from '@/components/edit-project'
import { EditTask } from '@/components/edit-task'
import { EmptyTasks } from '@/components/illustrations'
import { IconBack, IconTrash, IconClock } from '@/components/icons'

export const dynamic = 'force-dynamic'

type TaskRow = Task & { assignee: { username: string | null } | null }

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if (!project) notFound()
  const p = project as Project

  const [{ data: tasks }, { data: members }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, assignee:profiles!assignee_id(username)')
      .eq('project_id', id)
      .order('position'),
    supabase.from('profiles').select('id, username').eq('active', true).order('username'),
  ])
  const taskRows = (tasks as TaskRow[] | null) ?? []
  const memberList = (members as Pick<Profile, 'id' | 'username'>[] | null) ?? []

  return (
    <div className="space-y-5">
      {/* Header dettaglio: indietro + titolo + ⋮ */}
      <header className="flex items-center gap-2">
        <Link href="/projects" className="press -ml-1 flex h-9 w-9 items-center justify-center rounded-[10px] text-[#3E4757] hover:bg-[#EFF1F5]" aria-label="Indietro">
          <IconBack size={22} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-[19px] font-extrabold tracking-tight text-navy">{p.name}</h1>
          <p className="text-[11px] font-semibold text-[#9CA5B3]">
            {taskRows.length} task · {p.status.replace('_', ' ')}
          </p>
        </div>
        <ProjectStatusBadge status={p.status} />
        <EditProject project={p} />
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
              <Card key={t.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-[#1A1F2B]">{t.title}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <TaskStatusBadge status={t.status} />
                    <EditTask task={t} members={memberList} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <PriorityBadge level={t.priority_level} />
                  <div className="flex items-center gap-2.5">
                    {t.due_date && <span className="text-[11px] font-semibold text-[#9CA5B3]">{formatDate(t.due_date, 'd MMM')}</span>}
                    {t.assignee?.username && (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5A6473]">
                        <Avatar name={t.assignee.username} size={20} /> {t.assignee.username}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
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
