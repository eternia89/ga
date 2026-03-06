'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { JobStatusBadge } from './job-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { formatIDR, formatDateTime } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface JobPreviewData {
  id: string;
  display_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  estimated_cost: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  location: { name: string } | null;
  category: { name: string } | null;
  pic: { full_name: string } | null;
  job_requests: Array<{
    request: {
      id: string;
      display_id: string;
      title: string;
      status: string;
    };
  }>;
}

// ============================================================================
// Helpers
// ============================================================================

// ============================================================================
// Props
// ============================================================================

interface JobPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
}

// ============================================================================
// Component
// ============================================================================

export function JobPreviewDialog({ open, onOpenChange, jobId }: JobPreviewDialogProps) {
  const [job, setJob] = useState<JobPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !jobId) return;

    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      setJob(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('jobs')
          .select(`
            id,
            display_id,
            title,
            description,
            status,
            priority,
            estimated_cost,
            created_at,
            started_at,
            completed_at,
            location:locations(name),
            category:categories(name),
            pic:user_profiles!jobs_assigned_to_fkey(full_name),
            job_requests(
              request:requests(
                id,
                display_id,
                title,
                status
              )
            )
          `)
          .eq('id', jobId)
          .single();

        if (fetchError) {
          setError('Failed to load job details');
          return;
        }

        setJob(data as unknown as JobPreviewData);
      } catch {
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [open, jobId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        {loading && (
          <>
            <DialogHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4 mt-2" />
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {error && !loading && (
          <>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-destructive">{error}</p>
          </>
        )}

        {job && !loading && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold text-muted-foreground">
                  {job.display_id}
                </span>
                <JobStatusBadge status={job.status} />
                {job.priority && <PriorityBadge priority={job.priority} />}
              </div>
              <DialogTitle className="text-lg">{job.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Description */}
              {job.description && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Description
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">{job.description}</dd>
                </div>
              )}

              {/* Estimated Cost */}
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Estimated Cost
                </dt>
                <dd className="text-sm font-semibold">
                  {job.estimated_cost != null ? formatIDR(job.estimated_cost) : (
                    <span className="font-normal text-muted-foreground">Not set</span>
                  )}
                </dd>
              </div>

              {/* Info grid */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">PIC</dt>
                  <dd className="text-sm mt-0.5">{job.pic?.full_name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Location</dt>
                  <dd className="text-sm mt-0.5">{job.location?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm mt-0.5">{job.category?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                  <dd className="text-sm mt-0.5">{formatDateTime(job.created_at)}</dd>
                </div>
                {job.started_at && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Started</dt>
                    <dd className="text-sm mt-0.5">{formatDateTime(job.started_at)}</dd>
                  </div>
                )}
                {job.completed_at && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Completed</dt>
                    <dd className="text-sm mt-0.5">{formatDateTime(job.completed_at)}</dd>
                  </div>
                )}
              </dl>

              {/* Linked Requests */}
              {job.job_requests.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Linked Requests ({job.job_requests.length})
                  </dt>
                  <ul className="space-y-1">
                    {job.job_requests.map(({ request }) => (
                      <li key={request.id} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
                          {request.display_id}
                        </span>
                        <span className="truncate">{request.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View Full Detail link */}
              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/jobs/${job.id}`}>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    View Full Detail
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
