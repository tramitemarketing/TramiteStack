// Scheletri di caricamento animati (mostrati mentre il DB risponde).

export function HeaderSkeleton() {
  return (
    <div className="mb-4 space-y-2">
      <div className="skeleton h-7 w-40" />
      <div className="skeleton h-4 w-24" />
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-20 w-full" />
      ))}
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4">
      {Array.from({ length: 4 }).map((_, c) => (
        <div key={c} className="w-72 shrink-0 space-y-2">
          <div className="skeleton h-9 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function GridSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="skeleton h-24 w-full" />
      ))}
    </div>
  )
}
