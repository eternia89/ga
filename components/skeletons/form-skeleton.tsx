import { Skeleton } from '@/components/ui/skeleton';

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      {/* Form card */}
      <div className="rounded-lg border p-6 max-w-2xl space-y-6">
        {/* Form fields */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}

        {/* Textarea field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
}
