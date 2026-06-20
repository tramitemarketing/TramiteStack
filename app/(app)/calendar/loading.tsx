import { HeaderSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-72 w-full" />
        <div className="skeleton h-72 w-full" />
      </div>
    </div>
  )
}
