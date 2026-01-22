import { Skeleton } from "./skeleton"

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Header skeleton */}
      <div className="max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
