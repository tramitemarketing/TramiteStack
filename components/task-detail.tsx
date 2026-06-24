'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTask, deleteTask } from '@/app/(app)/actions'
import { PriorityBadge, TaskStatusBadge } from '@/components/ui'
import { Assignees, type MemberInfo } from '@/components/assignees'
import { AssigneeCheckboxes } from '@/components/assignee-checkboxes'
import { IconTrash, IconEdit, IconClock } from '@/components/icons'
import { TaskComments } from '@/components/task-comments'
import { TaskChecklist } from '@/components/task-checklist'
import { formatDate } from '@/lib/utils'
import type { TaskStatus } from '@/types/database'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { Field, inputCls, labelCls } from '@/components/field'
import { useToast } from '@/components/toast'

export type DetailTask = {
  id: string
  title: string
  description: string | null
  project_id: string
  projectName: string | null
  projectColor: string | null
  priority_level: number
  status: TaskStatus
  due_date: string | null
  assignee_ids: string[]
}

const PRIORITY_OPTS = [
  { v: '1', l: 'P1 · Urgente' }, { v: '2', l: 'P2 · Alta' }, { v: '3', l: 'P3 · Media' },
  { v: '4', l: 'P4 · Bassa' }, { v: '5', l: 'P5 · Molto bassa' },
]

export function TaskDetail({
  task,
  members,
  open,
  onClose,
}: {
  task: DetailTask
  members: MemberInfo[]
  open: boolean
  onClose: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  const close = () => {
    setEditing(false)
    setError(null)
    onClose()
  }

  const tagColor = task.projectColor || 'var(--brand)'
  const membersById = new Map<string, MemberInfo>(members.map((m) => [m.id, m]))

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateTask(fd)
      if (res?.ok) {
        setEditing(false)
        toast.success('Task aggiornato.')
        router.refresh()
      } else {
        setError(res?.error ?? 'Operazione non riuscita.')
      }
    })
  }

  function onDelete() {
    if (!confirm(`Eliminare la task “${task.title}”?`)) return
    const fd = new FormData()
    fd.set('id', task.id)
    fd.set('project_id', task.project_id)
    startTransition(async () => {
      await deleteTask(fd)
      toast.success('Task eliminato.')
      onClose()
      router.refresh()
    })
  }

  const header = (
    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${tagColor}22`, color: tagColor }}>
      {task.projectName ?? 'Senza progetto'}
    </span>
  )

  return (
    <Modal open={open} onClose={close} title={task.title} header={header}>
      {editing ? (
        <form onSubmit={onSave} className="space-y-3">
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="project_id" value={task.project_id} />
          <Field label="Titolo" htmlFor="td-title" required error={error}>
            <input id="td-title" name="title" required defaultValue={task.title} className={inputCls} />
          </Field>
          <Field label="Descrizione" htmlFor="td-desc">
            <textarea id="td-desc" name="description" rows={4} defaultValue={task.description ?? ''} className={inputCls} placeholder="Dettagli, note, link…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priorità" htmlFor="td-priority">
              <select id="td-priority" name="priority_level" className={inputCls} defaultValue={String(task.priority_level)}>
                {PRIORITY_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
            <Field label="Scadenza" htmlFor="td-due">
              <input id="td-due" type="date" name="due_date" className={inputCls} defaultValue={task.due_date ?? ''} />
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-[#3E4757]">Assegnatari</span>
            <AssigneeCheckboxes members={members} selected={task.assignee_ids} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Annulla</Button>
            <Button type="submit" fullWidth loading={pending} loadingLabel="Salvataggio…">Salva</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-extrabold leading-tight text-navy">{task.title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge level={task.priority_level} />
            {task.due_date && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#6B7280]">
                <IconClock size={14} /> {formatDate(task.due_date, 'd MMM yyyy')}
              </span>
            )}
          </div>
          <div>
            <p className={labelCls}>Assegnatari</p>
            <Assignees ids={task.assignee_ids} membersById={membersById} size={26} />
          </div>
          <div>
            <p className={labelCls}>Descrizione</p>
            {task.description ? (
              <p className="whitespace-pre-wrap text-sm font-medium text-[#3E4757]">{task.description}</p>
            ) : (
              <p className="text-sm font-medium text-[#6B7280]">Nessuna descrizione.</p>
            )}
          </div>
          <div className="border-t border-[#EFF1F5] pt-3">
            <TaskChecklist taskId={task.id} />
          </div>
          <div className="border-t border-[#EFF1F5] pt-3">
            <TaskComments taskId={task.id} members={members} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={onDelete} disabled={pending} className="text-danger ring-[#F2C7BD]">
              <IconTrash size={16} /> Elimina
            </Button>
            <Button fullWidth onClick={() => setEditing(true)}>
              <IconEdit size={16} /> Modifica
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
