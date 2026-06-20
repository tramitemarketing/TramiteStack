import { HeaderSkeleton, ListSkeleton } from '@/components/skeletons'
import { CenterSpinner } from '@/components/loading-overlay'

export default function Loading() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <div className="skeleton h-16 w-full" />
      <ListSkeleton rows={3} />
      <CenterSpinner />
    </div>
  )
}
