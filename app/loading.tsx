import { Skeleton } from "@/app/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="border-b border-muted">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge Skeleton */}
          <div className="flex justify-center">
            <Skeleton className="h-8 w-56 rounded-full" />
          </div>

          {/* Headline Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-16 w-full max-w-3xl mx-auto" />
            <Skeleton className="h-16 w-5/6 mx-auto" />
          </div>

          {/* Subheadline Skeleton */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5 mx-auto" />
          </div>

          {/* CTA Button Skeleton */}
          <div className="flex justify-center pt-4">
            <Skeleton className="h-14 w-48 rounded-md" />
          </div>

          {/* Trust Indicators Skeleton */}
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border border-muted">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
