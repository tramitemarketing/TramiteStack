'use client'

import { useMemo, useState } from 'react'
import { Card, TaskStatusBadge, PriorityBadge } from '@/components/ui'
import { Assignees, type MemberInfo } from '@/components/assignees'
import { TaskDetail } from '@/components/task-detail'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/types/database'

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
  const membersById = useMemo(() => new Map<string, MemberInfo>(members.map((m) => [m.id, m])), [members])
  return (
    <>
      <Card className="cursor-pointer p-3 transition hover:ring-[#B3D2F0]" onClick={() => setOpen(true)}>
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-bold text-[#1A1F2B]">{task.title}</p>
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <PriorityBadge level={task.priority_level} />
          <div className="flex items-center gap-2.5">
            {task.due_date && <span className="text-[11px] font-semibold text-[#9CA5B3]">{formatDate(task.due_date, 'd MMM')}</span>}
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
