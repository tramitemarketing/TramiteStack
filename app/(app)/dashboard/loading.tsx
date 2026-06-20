import { HeaderSkeleton, ListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="space-y-5">
      <HeaderSkeleton />
      <div className="skeleton h-28 w-full" />
      <ListSkeleton rows={3} />
    </div>
  )
}
