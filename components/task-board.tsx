'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
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
  checklistTotal?: number
  checklistDone?: number
}

type Member = MemberInfo
type Indicator = { status: TaskStatus; index: number }

const COLUMN_DOT: Record<TaskStatus, string> = {
  da_fare: 'bg-[#9CA5B3]',
  in_corso: 'bg-[#E5A93A]',
  in_revisione: 'bg-[#7C5CD6]',
  completato: 'bg-[#1F8A5B]',
}

// Contenuto visivo della card (condiviso tra card e overlay)
function CardBody({ task, membersById }: { task: BoardTask; membersById: Map<string, MemberInfo> }) {
  const tagColor = task.projectColor || '#2A78C2'
  const hasChecklist = (task.checklistTotal ?? 0) > 0
  const pct = hasChecklist ? Math.round(((task.checklistDone ?? 0) / (task.checklistTotal as number)) * 100) : 0
  return (
    <>
      <div className={cn('absolute left-0 top-3 h-[calc(100%-1.5rem)] w-1 rounded-full', priorityColor(task.priority_level))} />
      <div className="pl-2">
        <p className="truncate text-[13px] font-bold leading-snug text-[#1A1F2B]">{task.title}</p>
        {task.projectName && (
          <span className="mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${tagColor}22`, color: tagColor }}>
            {task.projectName}
          </span>
        )}
        {hasChecklist && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFF1F5]">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? 'var(--ok)' : 'var(--brand)' }} />
            </div>
            <span className="text-[10px] font-bold text-[#9CA5B3] tnum">{task.checklistDone}/{task.checklistTotal}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <PriorityBadge level={task.priority_level} />
          <Assignees ids={task.assignee_ids} membersById={membersById} withName />
        </div>
      </div>
    </>
  )
}

function DraggableCard({
  task,
  membersById,
  disabled,
  onOpen,
}: {
  task: BoardTask
  membersById: Map<string, MemberInfo>
  disabled: boolean
  onOpen: () => void
}) {
  const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({ id: task.id, data: { status: task.status }, disabled })
  const { setNodeRef: setDropRef } = useDroppable({ id: task.id, data: { status: task.status } })
  const setRef = useCallback(
    (n: HTMLElement | null) => { setDragRef(n); setDropRef(n) },
    [setDragRef, setDropRef],
  )
  return (
    <div
      ref={setRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className="group relative cursor-pointer touch-none select-none rounded-[10px] bg-white p-3 ring-1 ring-[#E0E4EB] shadow-[0_1px_2px_rgba(16,40,80,0.04)]"
    >
      <CardBody task={task} membersById={membersById} />
    </div>
  )
}

function DropLine() {
  return <div className="my-1 h-[3px] rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
}

function Column({
  status,
  tasks,
  membersById,
  indicator,
  dragDisabled,
  onOpen,
}: {
  status: TaskStatus
  tasks: BoardTask[]
  membersById: Map<string, MemberInfo>
  indicator: Indicator | null
  dragDisabled: boolean
  onOpen: (t: BoardTask) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column', status } })
  const lineAt = (i: number) => indicator && indicator.status === status && indicator.index === i
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
        {tasks.map((t, i) => (
          <div key={t.id}>
            {lineAt(i) && <DropLine />}
            <DraggableCard task={t} membersById={membersById} disabled={dragDisabled} onOpen={() => onOpen(t)} />
          </div>
        ))}
        {lineAt(tasks.length) && <DropLine />}
        {tasks.length === 0 && !lineAt(0) && <p className="py-6 text-center text-[11px] font-medium text-[#C4CBD6]">trascina qui</p>}
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
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  const indicatorRef = useRef<Indicator | null>(null)
  const [detailTask, setDetailTask] = useState<BoardTask | null>(null)
  const [, startTransition] = useTransition()

  // Filtri
  const [showFilters, setShowFilters] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)
  const [projectFilter, setProjectFilter] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks(initialTasks)
  }, [initialTasks])

  // Tiene aperto il dettaglio sincronizzato coi dati aggiornati (realtime/refresh)
  const detailLive = detailTask ? tasks.find((t) => t.id === detailTask.id) ?? null : null

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
  const detailOpen = detailTask !== null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  // Ids di una colonna (ordinati per posizione), escludendo un id.
  const colIds = useCallback(
    (status: TaskStatus, exclude: string) =>
      filtered.filter((t) => t.status === status && t.id !== exclude).sort((a, b) => a.position - b.position).map((t) => t.id),
    [filtered],
  )

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) { setIndicator(null); indicatorRef.current = null; return }
    const aid = String(active.id)
    const overId = String(over.id)
    let next: Indicator
    if ((TASK_STATUS_ORDER as string[]).includes(overId)) {
      const ids = colIds(overId as TaskStatus, aid)
      next = { status: overId as TaskStatus, index: ids.length }
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (!overTask) return
      const ids = colIds(overTask.status, aid)
      const overIndex = ids.indexOf(overId)
      if (overIndex < 0) {
        next = { status: overTask.status, index: ids.length }
      } else {
        const ar = active.rect.current.translated
        const orct = over.rect
        const after = ar ? ar.top + ar.height / 2 > orct.top + orct.height / 2 : false
        next = { status: overTask.status, index: after ? overIndex + 1 : overIndex }
      }
    }
    indicatorRef.current = next
    setIndicator(next)
  }

  function clearDrag() {
    setActiveId(null)
    setIndicator(null)
    indicatorRef.current = null
  }

  function onDragEnd(e: DragEndEvent) {
    const aid = String(e.active.id)
    const ind = indicatorRef.current
    clearDrag()
    if (!ind) return
    const activeTask = tasks.find((t) => t.id === aid)
    if (!activeTask) return
    const targetStatus = ind.status
    const sourceStatus = activeTask.status

    const targetIds = colIds(targetStatus, aid)
    const idx = Math.max(0, Math.min(ind.index, targetIds.length))
    targetIds.splice(idx, 0, aid)

    // Nessun cambiamento reale
    if (sourceStatus === targetStatus) {
      const before = colIds(targetStatus, '')
      if (before.join() === targetIds.join()) return
    }

    const updates: { id: string; status: TaskStatus; position: number }[] = []
    targetIds.forEach((tid, i) => updates.push({ id: tid, status: targetStatus, position: i }))
    if (sourceStatus !== targetStatus) {
      colIds(sourceStatus, aid).forEach((tid, i) => updates.push({ id: tid, status: sourceStatus, position: i }))
    }

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={clearDrag}
    >
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
              membersById={membersById}
              indicator={indicator}
              dragDisabled={detailOpen}
              onOpen={(t) => setDetailTask(t)}
              tasks={filtered.filter((t) => t.status === status && t.id !== activeId).sort((a, b) => a.position - b.position)}
            />
          ))}
        </motion.div>
      </div>

      <DragOverlay>
        {active ? (
          <div className="relative rounded-[10px] bg-white p-3 shadow-lg ring-1 ring-[#E0E4EB]">
            <CardBody task={active} membersById={membersById} />
          </div>
        ) : null}
      </DragOverlay>

      {detailLive && (
        <TaskDetail
          task={{
            id: detailLive.id,
            title: detailLive.title,
            description: detailLive.description,
            project_id: detailLive.project_id,
            projectName: detailLive.projectName,
            projectColor: detailLive.projectColor,
            priority_level: detailLive.priority_level,
            status: detailLive.status,
            due_date: detailLive.due_date,
            assignee_ids: detailLive.assignee_ids,
          }}
          members={members}
          open={detailOpen}
          onClose={() => setDetailTask(null)}
        />
      )}
    </DndContext>
  )
}
