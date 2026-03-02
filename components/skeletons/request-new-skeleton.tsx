import { Skeleton } from '@/components/ui/skeleton';

export function RequestNewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <Skeleton className="h-8 w-40" />

      {/* Form card */}
      <div className="rounded-lg border p-6 max-w-2xl space-y-6">
        {/* Description textarea */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Location dropdown */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Photo upload area */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
}
