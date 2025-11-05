import { Skeleton } from "@/components/ui/skeleton"

interface NFTGridSkeletonProps {
  count?: number
}

export function NFTGridSkeleton({ count = 12 }: NFTGridSkeletonProps) {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="space-y-3">
            {/* Image Skeleton */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              <Skeleton className="w-full h-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-5 w-3/4" />

            {/* Artist */}
            <Skeleton className="h-4 w-1/2" />

            {/* Price Section */}
            <div className="flex justify-between items-end pt-2">
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

