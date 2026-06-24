import { Avatar } from '@/components/ui'

export type MemberInfo = { id: string; username: string | null; color: string | null }

// Visualizzazione assegnatari.
// - 0 → "Non assegnata"
// - 1 con withName → avatar + nome
// - più di uno (o withName=false) → solo avatar in fila
export function Assignees({
  ids,
  membersById,
  withName = false,
  size = 22,
}: {
  ids: string[]
  membersById: Map<string, MemberInfo>
  withName?: boolean
  size?: number
}) {
  if (!ids || ids.length === 0) {
    return <span className="text-[11px] font-semibold text-[#6B7280]">Non assegnata</span>
  }
  if (ids.length === 1 && withName) {
    const m = membersById.get(ids[0])
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar name={m?.username} size={size} color={m?.color} />
        <span className="truncate text-[11px] font-semibold text-[#5A6473]">{m?.username || 'Utente'}</span>
      </span>
    )
  }
  return (
    <span className="flex flex-wrap items-center gap-1">
      {ids.map((id) => {
        const m = membersById.get(id)
        return <Avatar key={id} name={m?.username} size={size} color={m?.color} />
      })}
    </span>
  )
}
