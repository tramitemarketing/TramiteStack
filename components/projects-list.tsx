'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, ProjectStatusBadge, PriorityBadge, ProgressBar, EmptyState } from '@/components/ui'
import { IconSearch } from '@/components/icons'
import { EmptyProjects } from '@/components/illustrations'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/types/database'

export type ProjectRow = Project & { taskCount: number; done: number }

export function ProjectsList({ projects }: { projects: ProjectRow[] }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return projects
    return projects.filter(
      (p) => p.name.toLowerCase().includes(t) || (p.description ?? '').toLowerCase().includes(t),
    )
  }, [q, projects])

  return (
    <div className="space-y-3">
      {/* Ricerca */}
      <div className="flex items-center gap-2.5 rounded-[10px] border border-[#E0E4EB] bg-white px-3 py-2.5">
        <IconSearch size={17} className="text-[#6B7280]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca progetto…"
          className="w-full bg-transparent text-sm font-medium text-[#1A1F2B] outline-none placeholder:text-[#6B7280]"
        />
      </div>

      {filtered.length === 0 ? (
        q ? (
          <EmptyState title="Nessun risultato" hint={`Nessun progetto per “${q}”.`} />
        ) : (
          <EmptyState title="Ancora nessun progetto" hint="Crea il primo progetto del team." illustration={<EmptyProjects />} />
        )
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="press block">
              <Card className="relative space-y-2.5 overflow-hidden pl-5">
                <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: p.color || '#2A78C2' }} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display truncate text-[15px] font-bold text-[#1A1F2B]">{p.name}</p>
                    {p.description && <p className="mt-1 line-clamp-1 text-xs font-medium text-[#5A6473]">{p.description}</p>}
                  </div>
                  <PriorityBadge level={p.priority_level} />
                </div>
                <div className="flex items-center justify-between">
                  <ProjectStatusBadge status={p.status} />
                  {p.due_date && <span className="text-[11px] font-semibold text-[#6B7280]">{formatDate(p.due_date, 'd MMM')}</span>}
                </div>
                {p.taskCount > 0 && <ProgressBar done={p.done} total={p.taskCount} />}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
