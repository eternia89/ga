import { Skeleton } from '@/components/ui/skeleton';

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Page title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6">
        {/* Left column: details */}
        <div className="space-y-6">
          <div className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-5 w-32 mb-2" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr] gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-5 w-28 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-24 w-24 rounded-md" />
              <Skeleton className="h-24 w-24 rounded-md" />
              <Skeleton className="h-24 w-24 rounded-md" />
            </div>
          </div>
        </div>

        {/* Right column: timeline */}
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
