import { HeaderSkeleton, GridSkeleton, ListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="space-y-5">
      <HeaderSkeleton />
      <GridSkeleton cells={4} />
      <ListSkeleton rows={3} />
    </div>
  )
}
