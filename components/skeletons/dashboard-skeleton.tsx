import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        {/* Date range filter placeholder */}
        <Skeleton className="h-9 w-48 shrink-0" />
      </div>

      {/* KPI cards grid */}
      <div className="grid grid-cols-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Two-column charts + tables */}
      <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-6">
        {/* Left: charts */}
        <div className="space-y-6">
          <div className="rounded-lg border p-5">
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="rounded-lg border p-5">
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
        {/* Right: tables */}
        <div className="space-y-6">
          <div className="rounded-lg border p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-5">
            <Skeleton className="h-5 w-36 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Maintenance + Inventory */}
      <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-6">
        <div className="rounded-lg border p-5">
          <Skeleton className="h-5 w-44 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
