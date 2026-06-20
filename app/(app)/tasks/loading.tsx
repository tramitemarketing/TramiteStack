import { HeaderSkeleton, BoardSkeleton } from '@/components/skeletons'
import { CenterSpinner } from '@/components/loading-overlay'

export default function Loading() {
  return (
    <div>
      <HeaderSkeleton />
      <BoardSkeleton />
      <CenterSpinner />
    </div>
  )
}
