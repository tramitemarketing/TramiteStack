import { HeaderSkeleton, GridSkeleton, ListSkeleton } from '@/components/skeletons'
import { CenterSpinner } from '@/components/loading-overlay'

export default function Loading() {
  return (
    <div className="space-y-5">
      <HeaderSkeleton />
      <GridSkeleton cells={4} />
      <ListSkeleton rows={3} />
      <CenterSpinner />
    </div>
  )
}
