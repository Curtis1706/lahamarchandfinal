import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="bg-indigo-600 text-white p-4 rounded-lg">
        <Skeleton className="h-8 w-48 bg-indigo-500" />
      </div>

      {/* Full-width section skeleton */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <Skeleton className="h-6 w-32 mb-4" />

        {/* Filters skeleton */}
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
