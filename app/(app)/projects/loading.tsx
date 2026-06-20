import { HeaderSkeleton, ListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <ListSkeleton rows={5} />
    </div>
  )
}
