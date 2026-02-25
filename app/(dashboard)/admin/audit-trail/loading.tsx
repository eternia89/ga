import { Skeleton } from '@/components/ui/skeleton';

export default function AuditTrailLoading() {
  return (
    <div className="space-y-6 py-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2 items-center">
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        {/* Header row */}
        <div className="border-b px-4 py-3">
          <div className="grid grid-cols-[165px_160px_120px_110px_120px] gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 last:border-0">
            <div className="grid grid-cols-[165px_160px_120px_110px_120px] gap-4 items-center">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
