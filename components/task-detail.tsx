'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { updateTask, deleteTask } from '@/app/(app)/actions'
import { PriorityBadge, TaskStatusBadge } from '@/components/ui'
import { Assignees, type MemberInfo } from '@/components/assignees'
import { AssigneeCheckboxes } from '@/components/assignee-checkboxes'
import { IconTrash, IconEdit, IconClock } from '@/components/icons'
import { TaskComments } from '@/components/task-comments'
import { formatDate } from '@/lib/utils'
import type { TaskStatus } from '@/types/database'

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

const inputCls =
  'w-full rounded-[10px] border border-[#E0E4EB] px-3.5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]'
const labelCls = 'mb-1 block text-xs font-bold text-[#5A6473]'
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
  const [mounted, setMounted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const close = () => {
    setEditing(false)
    onClose()
  }

  const tagColor = task.projectColor || 'var(--brand)'
  const membersById = new Map<string, MemberInfo>(members.map((m) => [m.id, m]))

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateTask(fd)
      setEditing(false)
      router.refresh()
    })
  }

  function onDelete() {
    if (!confirm(`Eliminare la task “${task.title}”?`)) return
    const fd = new FormData()
    fd.set('id', task.id)
    fd.set('project_id', task.project_id)
    startTransition(async () => {
      await deleteTask(fd)
      onClose()
      router.refresh()
    })
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/40 sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="my-auto w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl"
            initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${tagColor}22`, color: tagColor }}>
                {task.projectName ?? 'Senza progetto'}
              </span>
              <button onClick={close} className="text-slate-400">✕</button>
            </div>

            {editing ? (
              <form onSubmit={onSave} className="space-y-3">
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="project_id" value={task.project_id} />
                <div>
                  <label className={labelCls}>Titolo <span className="text-danger">*</span></label>
                  <input name="title" required defaultValue={task.title} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Descrizione</label>
                  <textarea name="description" rows={4} defaultValue={task.description ?? ''} className={inputCls} placeholder="Dettagli, note, link…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Priorità</label>
                    <select name="priority_level" className={inputCls} defaultValue={String(task.priority_level)}>
                      {PRIORITY_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Scadenza</label>
                    <input type="date" name="due_date" className={inputCls} defaultValue={task.due_date ?? ''} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Assegnatari</label>
                  <AssigneeCheckboxes members={members} selected={task.assignee_ids} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setEditing(false)} className="press rounded-[10px] px-4 py-3 font-bold text-[#5A6473] ring-1 ring-[#E0E4EB]">Annulla</button>
                  <button type="submit" disabled={pending} className="press flex-1 rounded-[10px] px-4 py-3 font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand)' }}>
                    {pending ? 'Salvataggio…' : 'Salva'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-extrabold leading-tight text-navy">{task.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge level={task.priority_level} />
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#9CA5B3]">
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
                    <p className="text-sm font-medium text-[#9CA5B3]">Nessuna descrizione.</p>
                  )}
                </div>
                <div className="border-t border-[#EFF1F5] pt-3">
                  <TaskComments taskId={task.id} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={onDelete} disabled={pending} className="press flex items-center gap-1.5 rounded-[10px] px-4 py-3 font-bold text-danger ring-1 ring-[#F2C7BD] disabled:opacity-60">
                    <IconTrash size={16} /> Elimina
                  </button>
                  <button onClick={() => setEditing(true)} className="press flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-4 py-3 font-bold text-white" style={{ backgroundColor: 'var(--brand)' }}>
                    <IconEdit size={16} /> Modifica
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return mounted ? createPortal(modal, document.body) : null
}
