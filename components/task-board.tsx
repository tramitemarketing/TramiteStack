'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { reorderTasks } from '@/app/(app)/actions'
import { cn } from '@/lib/utils'
import {
  TASK_STATUS_ORDER,
  TASK_STATUS_LABEL,
  priorityColor,
  type Task,
  type TaskStatus,
} from '@/types/database'
import { PriorityBadge } from '@/components/ui'
import { Assignees, type MemberInfo } from '@/components/assignees'
import { TaskDetail } from '@/components/task-detail'
import { CreateTaskButton } from '@/components/create-task'
import { IconFilter, IconCheck } from '@/components/icons'

export type BoardTask = Task & {
  projectName: string | null
  projectColor: string | null
}

type Member = MemberInfo

const COLUMN_DOT: Record<TaskStatus, string> = {
  da_fare: 'bg-[#9CA5B3]',
  in_corso: 'bg-[#E5A93A]',
  in_revisione: 'bg-[#7C5CD6]',
  completato: 'bg-[#1F8A5B]',
}

function TaskCard({
  task,
  members,
  membersById,
  overlay = false,
}: {
  task: BoardTask
  members: Member[]
  membersById: Map<string, MemberInfo>
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  })
  const [detail, setDetail] = useState(false)
  const style = overlay ? undefined : { transform: CSS.Transform.toString(transform), transition }
  const tagColor = task.projectColor || '#2A78C2'
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={overlay ? undefined : () => setDetail(true)}
      className={cn(
        'group relative rounded-[10px] bg-white p-3 ring-1 ring-[#E0E4EB] shadow-[0_1px_2px_rgba(16,40,80,0.04)] touch-none select-none',
        isDragging && !overlay && 'opacity-30',
        overlay && 'rotate-2 shadow-lg',
      )}
    >
      <div className={cn('absolute left-0 top-3 h-[calc(100%-1.5rem)] w-1 rounded-full', priorityColor(task.priority_level))} />
      <div className="pl-2">
        <p className="truncate text-[13px] font-bold leading-snug text-[#1A1F2B]">{task.title}</p>
        {task.projectName && (
          <span className="mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${tagColor}22`, color: tagColor }}>
            {task.projectName}
          </span>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <PriorityBadge level={task.priority_level} />
          <Assignees ids={task.assignee_ids} membersById={membersById} withName />
        </div>
      </div>
      {!overlay && (
        <TaskDetail
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            project_id: task.project_id,
            projectName: task.projectName,
            projectColor: task.projectColor,
            priority_level: task.priority_level,
            status: task.status,
            due_date: task.due_date,
            assignee_ids: task.assignee_ids,
          }}
          members={members}
          open={detail}
          onClose={() => setDetail(false)}
        />
      )}
    </div>
  )
}

function Column({
  status,
  tasks,
  members,
  membersById,
}: {
  status: TaskStatus
  tasks: BoardTask[]
  members: Member[]
  membersById: Map<string, MemberInfo>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column', status } })
  return (
    <div className="flex min-w-[244px] flex-1 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn('h-2.5 w-2.5 rounded-[3px]', COLUMN_DOT[status])} />
        <span className="font-display text-[13px] font-bold text-[#3E4757]">{TASK_STATUS_LABEL[status]}</span>
        <span className="text-[11px] font-bold text-[#9CA5B3]">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[60vh] flex-1 space-y-2 rounded-xl p-1.5 transition',
          isOver ? 'bg-brand-50 ring-2 ring-[#B3D2F0]' : 'bg-[#EFF1F5]/70',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} members={members} membersById={membersById} />
          ))}
        </SortableContext>
        {tasks.length === 0 && <p className="py-6 text-center text-[11px] font-medium text-[#C4CBD6]">trascina qui</p>}
      </div>
    </div>
  )
}

export function TaskBoard({
  initialTasks,
  meId,
  members,
  projects: projectOptions,
}: {
  initialTasks: BoardTask[]
  meId: string
  members: Member[]
  projects: { id: string; name: string }[]
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Filtri
  const [showFilters, setShowFilters] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)
  const [projectFilter, setProjectFilter] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks(initialTasks)
  }, [initialTasks])

  const membersById = useMemo(() => new Map<string, MemberInfo>(members.map((m) => [m.id, m])), [members])

  const projects = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of tasks) if (t.project_id && t.projectName) map.set(t.project_id, t.projectName)
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks])

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) => (!mineOnly || t.assignee_ids.includes(meId)) && (!projectFilter || t.project_id === projectFilter),
      ),
    [tasks, mineOnly, projectFilter, meId],
  )

  const filtersActive = mineOnly || projectFilter !== ''

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function orderedIds(list: BoardTask[], status: TaskStatus) {
    return list.filter((t) => t.status === status).sort((a, b) => a.position - b.position).map((t) => t.id)
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const id = String(e.active.id)
    const over = e.over
    if (!over) return
    const overId = String(over.id)
    const activeTask = tasks.find((t) => t.id === id)
    if (!activeTask) return

    const isColumn = (TASK_STATUS_ORDER as string[]).includes(overId)
    const overTask = isColumn ? null : tasks.find((t) => t.id === overId)
    const targetStatus = (isColumn ? overId : overTask?.status) as TaskStatus
    if (!targetStatus) return

    const sourceStatus = activeTask.status

    // Lista target senza l'elemento attivo, poi inserimento all'indice giusto.
    const targetIds = orderedIds(tasks, targetStatus).filter((x) => x !== id)
    let insertIndex = isColumn ? targetIds.length : targetIds.indexOf(overId)
    if (insertIndex < 0) insertIndex = targetIds.length
    targetIds.splice(insertIndex, 0, id)

    // Nessun cambiamento reale → esci.
    if (sourceStatus === targetStatus) {
      const before = orderedIds(tasks, targetStatus)
      if (before.join() === targetIds.join()) return
    }

    const updates: { id: string; status: TaskStatus; position: number }[] = []
    targetIds.forEach((tid, i) => updates.push({ id: tid, status: targetStatus, position: i }))
    if (sourceStatus !== targetStatus) {
      orderedIds(tasks, sourceStatus)
        .filter((x) => x !== id)
        .forEach((tid, i) => updates.push({ id: tid, status: sourceStatus, position: i }))
    }

    // Update ottimistico (niente spinner: lo spostamento è istantaneo).
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates.find((x) => x.id === t.id)
        return u ? { ...t, status: u.status, position: u.position } : t
      }),
    )
    startTransition(async () => {
      await reorderTasks(updates)
    })
  }

  const active = tasks.find((t) => t.id === activeId) ?? null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {/* Header: Task · filtro · Nuovo */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-[26px] font-extrabold leading-none tracking-tight text-navy">Task</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Filtra"
            className={cn(
              'press relative flex h-9 w-9 items-center justify-center rounded-[10px] border transition',
              filtersActive ? 'border-transparent bg-brand-50 text-brand' : 'border-[#E0E4EB] bg-white text-[#3E4757]',
            )}
          >
            <IconFilter size={18} />
            {filtersActive && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: 'var(--accent)' }} />}
          </button>
          <CreateTaskButton projects={projectOptions} members={members} />
        </div>
      </div>

      {showFilters && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#E0E4EB] bg-white p-3">
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            className={cn(
              'press flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition',
              mineOnly ? 'bg-brand text-white' : 'bg-[#EFF1F5] text-[#3E4757]',
            )}
          >
            {mineOnly && <IconCheck size={14} />} Solo le mie
          </button>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-[#E0E4EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3E4757] outline-none"
          >
            <option value="">Tutti i progetti</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {filtersActive && (
            <button type="button" onClick={() => { setMineOnly(false); setProjectFilter('') }} className="press ml-auto text-[12px] font-semibold text-[#9CA5B3]">
              Azzera
            </button>
          )}
        </div>
      )}
      <div data-no-swipe className="no-scrollbar relative left-1/2 w-screen -translate-x-1/2 overflow-x-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
          {TASK_STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              members={members}
              membersById={membersById}
              tasks={filtered.filter((t) => t.status === status).sort((a, b) => a.position - b.position)}
            />
          ))}
        </motion.div>
      </div>
      <DragOverlay>{active ? <TaskCard task={active} members={members} membersById={membersById} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}
