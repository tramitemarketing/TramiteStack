'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, PriorityBadge } from '@/components/ui'
import { Assignees, type MemberInfo } from '@/components/assignees'
import { TaskDetail } from '@/components/task-detail'
import { changeTaskStatus } from '@/app/(app)/actions'
import { formatDate } from '@/lib/utils'
import { TASK_STATUS_ORDER, TASK_STATUS_LABEL, type Task, type TaskStatus } from '@/types/database'

const STATUS_BOX: Record<TaskStatus, string> = {
  da_fare: 'bg-[#EFF1F5] text-[#5A6473]',
  in_corso: 'bg-[#FDF4DD] text-[#C8932B]',
  in_revisione: 'bg-[#EFE8FB] text-[#7C5CD6]',
  completato: 'bg-[#E6F3EC] text-[#1F8A5B]',
}

export function ProjectTaskItem({
  task,
  members,
  projectName,
  projectColor,
}: {
  task: Task
  members: MemberInfo[]
  projectName: string | null
  projectColor: string | null
}) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const membersById = useMemo(() => new Map<string, MemberInfo>(members.map((m) => [m.id, m])), [members])

  function onStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as TaskStatus
    startTransition(async () => {
      await changeTaskStatus(task.id, status, task.project_id)
      router.refresh()
    })
  }

  return (
    <>
      <Card className="cursor-pointer p-3 transition hover:ring-[#B3D2F0]" onClick={() => setOpen(true)}>
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-bold text-[#1A1F2B]">{task.title}</p>
          {/* Box cambio stato (solo nei Progetti) */}
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onChange={onStatus}
            className={`shrink-0 cursor-pointer rounded-md px-2 py-1 text-[11px] font-bold outline-none ${STATUS_BOX[task.status]}`}
          >
            {TASK_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <PriorityBadge level={task.priority_level} />
          <div className="flex items-center gap-2.5">
            {task.due_date && <span className="text-[11px] font-semibold text-[#6B7280]">{formatDate(task.due_date, 'd MMM')}</span>}
            <Assignees ids={task.assignee_ids} membersById={membersById} withName size={20} />
          </div>
        </div>
      </Card>
      <TaskDetail
        task={{
          id: task.id,
          title: task.title,
          description: task.description,
          project_id: task.project_id,
          projectName,
          projectColor,
          priority_level: task.priority_level,
          status: task.status,
          due_date: task.due_date,
          assignee_ids: task.assignee_ids,
        }}
        members={members}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
