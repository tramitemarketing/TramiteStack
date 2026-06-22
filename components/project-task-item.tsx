'use client'

import { useState } from 'react'
import { Card, TaskStatusBadge, PriorityBadge, Avatar } from '@/components/ui'
import { TaskDetail } from '@/components/task-detail'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/types/database'

type ItemTask = Task & { assignee: { username: string | null; color: string | null } | null }

export function ProjectTaskItem({
  task,
  members,
  projectName,
  projectColor,
}: {
  task: ItemTask
  members: { id: string; username: string | null }[]
  projectName: string | null
  projectColor: string | null
}) {
  const [open, setOpen] = useState(false)
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
            {task.assignee?.username && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5A6473]">
                <Avatar name={task.assignee.username} size={20} color={task.assignee.color} /> {task.assignee.username}
              </span>
            )}
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
          assignee_id: task.assignee_id,
          assigneeName: task.assignee?.username ?? null,
          assigneeColor: task.assignee?.color ?? null,
        }}
        members={members}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
