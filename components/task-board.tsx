'use client'

import { useState, useTransition } from 'react'
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
import { moveTask, deleteTask } from '@/app/(app)/actions'
import { cn, formatDate } from '@/lib/utils'
import {
  TASK_STATUS_ORDER,
  TASK_STATUS_LABEL,
  priorityColor,
  type Task,
  type TaskStatus,
} from '@/types/database'
import { PriorityPips, Avatar } from '@/components/ui'

export type BoardTask = Task & {
  projectName: string | null
  assigneeName: string | null
}

const COLUMN_BAR: Record<TaskStatus, string> = {
  da_fare: 'bg-slate-400',
  in_corso: 'bg-amber-400',
  in_revisione: 'bg-violet-400',
  completato: 'bg-emerald-400',
}

function TaskCard({
  task,
  pending,
  overlay = false,
}: {
  task: BoardTask
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
          ) : (
            <form action={deleteTask}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="project_id" value={task.project_id} />
              <button
                type="submit"
                onPointerDown={(e) => e.stopPropagation()}
                className="shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                aria-label="Elimina task"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                </svg>
              </button>
            </form>
          )}
        </div>
        {task.projectName && (
          <span className="mt-1 inline-block rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-brand"
            style={{ color: 'var(--brand)' }}>
            {task.projectName}
          </span>
        )}
        <div className="mt-2 flex items-center justify-between">
          <PriorityPips level={task.priority_level} />
          <div className="flex items-center gap-2">
            {task.due_date && <span className="text-[11px] text-slate-400">{formatDate(task.due_date, 'd MMM')}</span>}
            {task.assigneeName && <Avatar name={task.assigneeName} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Column({
  status,
  tasks,
  pendingId,
}: {
  status: TaskStatus
  tasks: BoardTask[]
  pendingId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div className="w-[78vw] max-w-72 shrink-0 sm:w-72">
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
          'min-h-32 space-y-2 rounded-xl p-1.5 transition',
          isOver ? 'bg-violet-100/60 ring-2 ring-violet-300' : 'bg-slate-100/60',
        )}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} pending={pendingId === t.id} />
        ))}
        {tasks.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-300">trascina qui</p>
        )}
      </div>
    </div>
  )
}

export function TaskBoard({ initialTasks }: { initialTasks: BoardTask[] }) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2"
      >
        {TASK_STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            pendingId={pendingId}
            tasks={tasks
              .filter((t) => t.status === status)
              .sort((a, b) => a.position - b.position)}
          />
        ))}
      </motion.div>
      <DragOverlay>{active ? <TaskCard task={active} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}
