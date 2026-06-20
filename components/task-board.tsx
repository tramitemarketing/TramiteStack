'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { moveTask, deleteTask, claimTask, releaseTask } from '@/app/(app)/actions'
import { CenterSpinner, SubmitSpinner } from '@/components/loading-overlay'
import { cn, formatDate } from '@/lib/utils'
import {
  TASK_STATUS_ORDER,
  TASK_STATUS_LABEL,
  priorityColor,
  type Task,
  type TaskStatus,
} from '@/types/database'
import { PriorityPips, Avatar } from '@/components/ui'
import { EditTask } from '@/components/edit-task'

export type BoardTask = Task & {
  projectName: string | null
  assigneeName: string | null
}

type Member = { id: string; username: string | null }

const COLUMN_BAR: Record<TaskStatus, string> = {
  da_fare: 'bg-slate-400',
  in_corso: 'bg-amber-400',
  in_revisione: 'bg-violet-400',
  completato: 'bg-emerald-400',
}

const stop = (e: React.PointerEvent) => e.stopPropagation()

function AssigneeControl({ task, meId }: { task: BoardTask; meId: string }) {
  if (!task.assignee_id) {
    return (
      <form action={claimTask} onPointerDown={stop}>
        <SubmitSpinner />
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="project_id" value={task.project_id} />
        <button
          type="submit"
          className="press rounded-md bg-violet-50 px-2 py-1 text-[11px] font-semibold"
          style={{ color: 'var(--brand)' }}
        >
          + Prendi in carico
        </button>
      </form>
    )
  }
  const mine = task.assignee_id === meId
  return (
    <form action={mine ? releaseTask : claimTask} onPointerDown={stop} className="flex items-center gap-1">
      <SubmitSpinner />
      <input type="hidden" name="id" value={task.id} />
      <input type="hidden" name="project_id" value={task.project_id} />
      <Avatar name={task.assigneeName} />
      <button type="submit" className="press text-[11px] font-medium text-slate-500" title={mine ? 'Lascia' : 'Prendi tu'}>
        {task.assigneeName}{mine ? ' ·  lascia' : ''}
      </button>
    </form>
  )
}

function TaskCard({
  task,
  meId,
  members,
  pending,
  overlay = false,
}: {
  task: BoardTask
  meId: string
  members: Member[]
  pending?: boolean
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={cn(
        'group relative rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 touch-none select-none',
        isDragging && !overlay && 'opacity-30',
        overlay && 'rotate-2 shadow-lg',
      )}
    >
      <div className={cn('absolute left-0 top-3 h-[calc(100%-1.5rem)] w-1 rounded-full', priorityColor(task.priority_level))} />
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">{task.title}</p>
          {pending ? (
            <span className="spinner shrink-0" />
          ) : !overlay ? (
            <div className="flex shrink-0 items-center">
              <EditTask task={task} members={members} />
              <form action={deleteTask} onPointerDown={stop}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="project_id" value={task.project_id} />
                <button type="submit" className="press p-1 text-slate-300 transition hover:text-red-500" aria-label="Elimina task">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                  </svg>
                </button>
              </form>
            </div>
          ) : null}
        </div>
        {task.projectName && (
          <span className="mt-1 inline-block rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium" style={{ color: 'var(--brand)' }}>
            {task.projectName}
          </span>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <PriorityPips level={task.priority_level} />
          {task.due_date && <span className="text-[11px] text-slate-400">{formatDate(task.due_date, 'd MMM')}</span>}
        </div>
        {!overlay && (
          <div className="mt-2 border-t border-slate-100 pt-2">
            <AssigneeControl task={task} meId={meId} />
          </div>
        )}
      </div>
    </div>
  )
}

function Column({
  status,
  tasks,
  meId,
  members,
  pendingId,
}: {
  status: TaskStatus
  tasks: BoardTask[]
  meId: string
  members: Member[]
  pendingId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div className="flex min-w-[248px] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', COLUMN_BAR[status])} />
          <span className="text-sm font-bold">{TASK_STATUS_LABEL[status]}</span>
        </div>
        <span className="text-xs font-medium text-slate-400">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-32 flex-1 space-y-2 rounded-xl p-1.5 transition',
          isOver ? 'bg-violet-100/60 ring-2 ring-violet-300' : 'bg-slate-100/60',
        )}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} meId={meId} members={members} pending={pendingId === t.id} />
        ))}
        {tasks.length === 0 && <p className="py-6 text-center text-xs text-slate-300">trascina qui</p>}
      </div>
    </div>
  )
}

export function TaskBoard({
  initialTasks,
  meId,
  members,
}: {
  initialTasks: BoardTask[]
  meId: string
  members: Member[]
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isMoving, startTransition] = useTransition()

  // Sincronizza con i dati aggiornati dal server (dopo crea/elimina/assegna).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks(initialTasks)
  }, [initialTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const taskId = String(e.active.id)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId) return
    const newStatus = overId as TaskStatus
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    const position = tasks.filter((t) => t.status === newStatus).length
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, position } : t)))
    setPendingId(taskId)
    startTransition(async () => {
      await moveTask(taskId, newStatus, position)
      setPendingId(null)
    })
  }

  const active = tasks.find((t) => t.id === activeId) ?? null

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {isMoving && <CenterSpinner />}
      <div className="no-scrollbar relative left-1/2 w-screen -translate-x-1/2 overflow-x-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
          {TASK_STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              meId={meId}
              members={members}
              pendingId={pendingId}
              tasks={tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)}
            />
          ))}
        </motion.div>
      </div>
      <DragOverlay>{active ? <TaskCard task={active} meId={meId} members={members} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}
