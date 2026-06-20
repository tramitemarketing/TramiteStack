import { GridSkeleton, ListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-28 w-full" />
      <GridSkeleton cells={4} />
      <ListSkeleton rows={3} />
    </div>
  )
}
