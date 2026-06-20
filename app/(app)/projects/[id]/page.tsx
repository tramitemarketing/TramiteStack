import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  PageHeader,
  ProjectStatusBadge,
  TaskStatusBadge,
  PriorityPips,
  EmptyState,
  Avatar,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { PROJECT_STATUS_LABEL, type Project, type Task, type Profile } from '@/types/database'
import { setProjectStatus, deleteProject } from '@/app/(app)/actions'
import { CreateTaskButton } from '@/components/create-task'
import { AttachmentsPanel } from '@/components/attachments-panel'
import { SubmitSpinner } from '@/components/loading-overlay'
import { EditProject } from '@/components/edit-project'
import { EditTask } from '@/components/edit-task'

export const dynamic = 'force-dynamic'

const inputCls =
  'rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-brand'

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
      <PageHeader
        title={p.name}
        action={
          <div className="flex items-center gap-1">
            <ProjectStatusBadge status={p.status} />
            <EditProject project={p} />
          </div>
        }
      />
      <div className="flex items-center gap-3">
        <PriorityPips level={p.priority_level} />
        {p.due_date && <span className="text-xs text-slate-400">scadenza {formatDate(p.due_date)}</span>}
      </div>
      {p.description && <p className="text-sm text-slate-600">{p.description}</p>}

      {/* Stato + elimina */}
      <Card className="flex items-center justify-between gap-3 p-3">
        <form action={setProjectStatus} className="flex items-center gap-2">
          <SubmitSpinner />
          <input type="hidden" name="id" value={p.id} />
          <select name="status" defaultValue={p.status} className={inputCls}>
            {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button className="press rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white">Aggiorna</button>
        </form>
        <form action={deleteProject}>
          <SubmitSpinner />
          <input type="hidden" name="id" value={p.id} />
          <button className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-red-200" aria-label="Elimina progetto">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
            </svg>
            Elimina
          </button>
        </form>
      </Card>

      {/* Task del progetto */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Task ({taskRows.length})</h2>
          <CreateTaskButton projects={[{ id: p.id, name: p.name }]} members={memberList} defaultProjectId={p.id} />
        </div>
        {taskRows.length === 0 ? (
          <EmptyState title="Nessun task" />
        ) : (
          <div className="space-y-2">
            {taskRows.map((t) => (
              <Card key={t.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{t.title}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <TaskStatusBadge status={t.status} />
                    <EditTask task={t} members={memberList} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <PriorityPips level={t.priority_level} />
                  <div className="flex items-center gap-2">
                    {t.due_date && <span className="text-xs text-slate-400">{formatDate(t.due_date, 'd MMM')}</span>}
                    {t.assignee?.username && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Avatar name={t.assignee.username} /> {t.assignee.username}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        <p className="mt-2 text-center text-xs text-slate-400">Trascina i task tra gli stati dalla pagina <strong>Task</strong>.</p>
      </section>

      {/* Allegati */}
      <AttachmentsPanel projectId={p.id} />
    </div>
  )
}
