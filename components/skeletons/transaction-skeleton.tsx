import { Skeleton } from "@/components/ui/skeleton"

interface TransactionSkeletonProps {
  rows?: number
}

export function TransactionSkeleton({ rows = 10 }: TransactionSkeletonProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-muted/50 rounded-lg">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-9" />
        ))}
      </div>
    </div>
  )
}

