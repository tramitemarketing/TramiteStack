import { HeaderSkeleton, ListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <div className="skeleton h-11 w-full" />
      <ListSkeleton rows={5} />
    </div>
  )
}
