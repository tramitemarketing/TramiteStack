export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton h-9 w-9" />
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-9 w-9" />
      </div>
      <div className="skeleton h-72 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  )
}
