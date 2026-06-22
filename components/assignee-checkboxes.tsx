'use client'

import { Avatar } from '@/components/ui'
import type { MemberInfo } from '@/components/assignees'

// Selezione multipla di assegnatari (checkbox). Invia più valori `assignee_ids`.
export function AssigneeCheckboxes({
  members,
  selected,
}: {
  members: MemberInfo[]
  selected?: string[]
}) {
  const set = new Set(selected ?? [])
  return (
    <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-[10px] border border-[#E0E4EB] p-1.5">
      {members.length === 0 && <p className="px-2 py-1.5 text-sm text-[#9CA5B3]">Nessun membro disponibile.</p>}
      {members.map((m) => (
        <label key={m.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#F7F8FA]">
          <input
            type="checkbox"
            name="assignee_ids"
            value={m.id}
            defaultChecked={set.has(m.id)}
            className="h-4 w-4 accent-[#0F4C81]"
          />
          <Avatar name={m.username} size={22} color={m.color} />
          <span className="text-sm font-semibold text-[#3E4757]">{m.username || 'Utente'}</span>
        </label>
      ))}
    </div>
  )
}
