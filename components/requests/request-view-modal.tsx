'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { getRequestPhotos } from '@/app/actions/request-actions';
import { RequestWithRelations } from '@/lib/types/database';
import type { TimelineEvent } from './request-timeline';
import { RequestTimeline } from './request-timeline';
import { RequestDetailInfo } from './request-detail-info';
import { RequestRejectDialog } from './request-reject-dialog';
import { RequestCancelDialog } from './request-cancel-dialog';
import { RequestAcceptanceDialog } from './request-acceptance-dialog';
import { RequestFeedbackDialog } from './request-feedback-dialog';
import { RequestStatusBadge } from './request-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { completeRequest } from '@/app/actions/request-actions';
import {
  XCircle,
  Ban,
  CheckCircle,
  CheckSquare,
  Star,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

interface LinkedJob {
  id: string;
  display_id: string;
  title: string;
  status: string;
}

interface RequestViewModalProps {
  requestId: string | null;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  onActionSuccess?: () => void;
  /** Ordered list of request IDs for prev/next navigation */
  requestIds?: string[];
  /** Called when user navigates to a different request */
  onNavigate?: (requestId: string) => void;
}

// ============================================================================
// Internal fields to filter from timeline
// ============================================================================

const INTERNAL_FIELDS = new Set([
  'updated_at', 'created_at', 'deleted_at',
  'feedback_submitted_at', 'feedback_rating',
  'accepted_at', 'auto_accepted',
]);

// ============================================================================
// Component
// ============================================================================

export function RequestViewModal({
  requestId,
  onOpenChange,
  categories,
  users,
  currentUserId,
  currentUserRole,
  onActionSuccess,
  requestIds = [],
  onNavigate,
}: RequestViewModalProps) {
  const router = useRouter();

  // Data states
  const [request, setRequest] = useState<RequestWithRelations | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [linkedJobs, setLinkedJobs] = useState<LinkedJob[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sub-dialog states
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [acceptanceOpen, setAcceptanceOpen] = useState(false);
  const [acceptanceMode, setAcceptanceMode] = useState<'accept' | 'reject'>('accept');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Form state (tracked from child form components)
  const [formDirty, setFormDirty] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Timeline scroll ref
  const timelineRef = useRef<HTMLDivElement>(null);

  // Navigation
  const currentIndex = requestId ? requestIds.indexOf(requestId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < requestIds.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      onNavigate?.(requestIds[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      onNavigate?.(requestIds[currentIndex + 1]);
    }
  };

  // URL sync
  useEffect(() => {
    if (requestId) {
      window.history.replaceState(null, '', '?view=' + requestId);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [requestId]);

  // Data fetching
  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Parallel fetches
      const [requestResult, locationsResult, linkedJobsResult] = await Promise.all([
        supabase
          .from('requests')
          .select(
            '*, location:locations(name), category:categories(name), requester:user_profiles!requester_id(name:full_name, email), assigned_user:user_profiles!assigned_to(name:full_name, email), division:divisions(name)'
          )
          .eq('id', id)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('locations')
          .select('id, name')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('job_requests')
          .select('job:jobs(id, display_id, title, status)')
          .eq('request_id', id),
      ]);

      if (requestResult.error || !requestResult.data) {
        setError('Request not found');
        setLoading(false);
        return;
      }

      const req = requestResult.data as unknown as RequestWithRelations;
      setRequest(req);
      setLocations(locationsResult.data ?? []);

      // Extract linked jobs
      type LinkedJobItem = { id: string; display_id: string; title: string; status: string };
      type LinkedJobRow = { job: LinkedJobItem | LinkedJobItem[] | null };
      const jobs = (linkedJobsResult.data ?? [])
        .map((row) => {
          const job = (row as unknown as LinkedJobRow).job;
          if (!job) return null;
          return Array.isArray(job) ? job[0] ?? null : job;
        })
        .filter((job): job is LinkedJobItem => job !== null);
      setLinkedJobs(jobs);

      // Fetch photos via server action
      try {
        const photosResult = await getRequestPhotos({ requestId: id });
        if (photosResult?.data?.success && photosResult.data.photos) {
          setPhotos(
            photosResult.data.photos.map((p) => ({
              id: p.id,
              url: p.url,
              fileName: p.fileName,
            }))
          );
        } else {
          setPhotos([]);
        }
      } catch {
        setPhotos([]);
      }

      // Fetch audit logs for timeline
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'requests')
        .eq('record_id', id)
        .order('performed_at', { ascending: true });

      // Build timeline events
      const logs = auditLogs ?? [];

      // Batch-fetch user names for performers
      const performedByIds = [...new Set(logs.map((log) => log.user_id).filter(Boolean))];
      let userMap: Record<string, string> = {};

      if (performedByIds.length > 0) {
        const { data: performers } = await supabase
          .from('user_profiles')
          .select('id, name:full_name, email')
          .in('id', performedByIds);

        if (performers) {
          userMap = Object.fromEntries(
            performers.map((p) => [p.id, p.name ?? p.email ?? p.id])
          );
        }
      }

      const events: TimelineEvent[] = [];

      for (const log of logs) {
        const byUser = userMap[log.user_id] ?? log.user_email ?? 'System';
        const newData = log.new_data as Record<string, unknown> | null;
        const oldData = log.old_data as Record<string, unknown> | null;
        const changedFields = log.changed_fields as string[] | null;

        if (log.operation === 'INSERT') {
          events.push({ type: 'created', at: log.performed_at, by: byUser });
          continue;
        }

        if (log.operation !== 'UPDATE' || !changedFields) continue;

        // Check for rejection
        if (changedFields.includes('rejection_reason') && newData?.rejection_reason) {
          events.push({
            type: 'rejection',
            at: log.performed_at,
            by: byUser,
            details: { reason: newData.rejection_reason as string },
          });
          continue;
        }

        // Check for cancellation
        if (changedFields.includes('status') && newData?.status === 'cancelled') {
          events.push({ type: 'cancellation', at: log.performed_at, by: byUser });
          continue;
        }

        // Check for acceptance
        if (
          changedFields.includes('status') &&
          newData?.status === 'accepted' &&
          changedFields.includes('accepted_at')
        ) {
          if (newData?.auto_accepted === true) {
            events.push({ type: 'auto_acceptance', at: log.performed_at, by: 'System' });
          } else {
            events.push({ type: 'acceptance', at: log.performed_at, by: byUser });
          }
          continue;
        }

        // Check for acceptance rejection
        if (changedFields.includes('acceptance_rejected_reason') && newData?.acceptance_rejected_reason) {
          events.push({
            type: 'acceptance_rejection',
            at: log.performed_at,
            by: byUser,
            details: { reason: newData.acceptance_rejected_reason as string },
          });
          continue;
        }

        // Check for feedback
        if (changedFields.includes('feedback_rating') && newData?.feedback_rating != null) {
          events.push({
            type: 'feedback',
            at: log.performed_at,
            by: byUser,
            details: {
              rating: newData.feedback_rating as number,
              comment: newData.feedback_comment as string | undefined,
            },
          });
          continue;
        }

        // Check for triage
        const triageFields = ['category_id', 'priority', 'assigned_to'];
        const isTriageEvent = triageFields.some((f) => changedFields.includes(f));
        if (isTriageEvent) {
          let categoryName: string | undefined;
          let priorityLabel: string | undefined;
          let picName: string | undefined;

          if (changedFields.includes('category_id') && newData?.category_id) {
            const { data: cat } = await supabase
              .from('categories')
              .select('name')
              .eq('id', newData.category_id as string)
              .single();
            categoryName = cat?.name;
          }

          if (changedFields.includes('priority') && newData?.priority) {
            priorityLabel = newData.priority as string;
          }

          if (changedFields.includes('assigned_to') && newData?.assigned_to) {
            const picData = userMap[newData.assigned_to as string];
            if (picData) {
              picName = picData;
            } else {
              const { data: pic } = await supabase
                .from('user_profiles')
                .select('name:full_name')
                .eq('id', newData.assigned_to as string)
                .single();
              picName = pic?.name;
            }
          }

          events.push({
            type: 'triage',
            at: log.performed_at,
            by: byUser,
            details: { category: categoryName, priority: priorityLabel, pic: picName },
          });
          continue;
        }

        // Check for status change
        if (changedFields.includes('status')) {
          events.push({
            type: 'status_change',
            at: log.performed_at,
            by: byUser,
            details: { old_status: oldData?.status, new_status: newData?.status },
          });
          continue;
        }

        // Generic field update
        const meaningfulFields = changedFields.filter((f) => !INTERNAL_FIELDS.has(f));
        if (meaningfulFields.length === 0) continue;
        const updatedField = meaningfulFields[0];
        events.push({
          type: 'field_update',
          at: log.performed_at,
          by: byUser,
          details: {
            field: updatedField,
            old_value: oldData?.[updatedField] as string | undefined,
            new_value: newData?.[updatedField] as string | undefined,
          },
        });
      }

      setTimelineEvents(events);
    } catch {
      setError('Failed to load request details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (requestId) {
      fetchData(requestId);
    } else {
      // Reset state when modal closes
      setRequest(null);
      setPhotos([]);
      setTimelineEvents([]);
      setLocations([]);
      setLinkedJobs([]);
      setError(null);
      setFormDirty(false);
      setFormSubmitting(false);
    }
  }, [requestId, refreshKey, fetchData]);

  // Scroll timeline to bottom when events load
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timelineEvents]);

  // Action success handler
  const handleActionSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    router.refresh();
    onActionSuccess?.();
  }, [router, onActionSuccess]);

  const handleAccepted = useCallback(() => {
    setAcceptanceOpen(false);
    // Open feedback dialog after acceptance
    setTimeout(() => {
      setFeedbackOpen(true);
    }, 300);
    handleActionSuccess();
  }, [handleActionSuccess]);

  // Completing state
  const [completing, setCompleting] = useState(false);

  // Role/permission derivations
  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isRequester = request?.requester_id === currentUserId;
  const isPic = request?.assigned_to === currentUserId;

  const canReject = isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request?.status ?? '');
  const canCancel = isRequester && request?.status === 'submitted';
  const canComplete = (isPic || isGaLeadOrAdmin) && ['triaged', 'in_progress'].includes(request?.status ?? '');
  const canAcceptOrReject = isRequester && request?.status === 'pending_acceptance';
  const canGiveFeedback = isRequester && request?.status === 'accepted' && !request?.feedback_rating;

  const handleComplete = async () => {
    if (!request) return;
    if (!window.confirm('Complete this request? It will be sent to the requester for acceptance.')) return;
    setCompleting(true);
    try {
      const result = await completeRequest({ id: request.id });
      if (result?.data?.success) {
        handleActionSuccess();
      } else {
        const errorMsg = (result as { serverError?: string })?.serverError ?? 'Failed to complete request.';
        alert(errorMsg);
      }
    } catch {
      alert('Failed to complete request.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <>
      <Dialog open={!!requestId} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[1000px] max-h-[90vh] flex flex-col p-0 gap-0 max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0"
          showCloseButton={true}
        >
          <DialogTitle className="sr-only">Request Details</DialogTitle>
          {/* Loading state */}
          {loading && (
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-[600px_400px] max-lg:grid-cols-1 gap-6 mt-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex gap-2">
                {requestId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(requestId)}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Retry
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {request && !loading && !error && (
            <>
              {/* Header (non-scrollable) */}
              <div className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Prev/Next navigation */}
                  {requestIds.length > 1 && (
                    <div className="flex items-center gap-1 mr-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!hasPrev}
                        onClick={goToPrev}
                        aria-label="Previous request"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!hasNext}
                        onClick={goToNext}
                        aria-label="Next request"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">
                        {currentIndex + 1}/{requestIds.length}
                      </span>
                    </div>
                  )}

                  <h2 className="text-xl font-bold tracking-tight font-mono">
                    {request.display_id}
                  </h2>
                  <RequestStatusBadge status={request.status} />
                  {request.priority && <PriorityBadge priority={request.priority} />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {request.requester?.name ?? 'Unknown'}
                  {request.division?.name && ` · ${request.division.name}`}
                  {' · '}Created {format(new Date(request.created_at), 'dd-MM-yyyy')}
                </p>

                {/* Rejection reason callout */}
                {request.status === 'rejected' && request.rejection_reason && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 mt-3">
                    <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                    <p className="text-sm text-red-600 mt-1">{request.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Split layout: Details left, Timeline right */}
              <div className="flex-1 min-h-0 grid grid-cols-[600px_400px] max-lg:grid-cols-1">
                {/* Left: Details (scrollable) */}
                <div className="overflow-y-auto px-6 py-4 max-lg:border-b">
                  <RequestDetailInfo
                    request={request}
                    photoUrls={photos}
                    categories={categories}
                    users={users}
                    locations={locations}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onEditSuccess={handleActionSuccess}
                    onTriageSuccess={handleActionSuccess}
                    linkedJobs={linkedJobs}
                    formId="request-update-form"
                    onDirtyChange={setFormDirty}
                    onSubmittingChange={setFormSubmitting}
                  />
                </div>

                {/* Right: Timeline (scrollable) */}
                <div
                  ref={timelineRef}
                  className="overflow-y-auto border-l max-lg:border-l-0 px-6 py-4"
                >
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    Timeline
                  </h3>
                  <RequestTimeline events={timelineEvents} />
                </div>
              </div>

              {/* Sticky action bar */}
              <div className="border-t px-6 py-3 flex items-center justify-between gap-2 shrink-0 bg-background">
                {/* Left: Primary actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    form="request-update-form"
                    size="sm"
                    disabled={!formDirty || formSubmitting}
                  >
                    {formSubmitting ? 'Updating...' : 'Update Request'}
                  </Button>

                  {canComplete && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={completing}
                      onClick={handleComplete}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      {completing ? 'Completing...' : 'Complete Request'}
                    </Button>
                  )}

                  {canAcceptOrReject && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setAcceptanceMode('accept');
                        setAcceptanceOpen(true);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Work
                    </Button>
                  )}

                  {canGiveFeedback && (
                    <Button size="sm" onClick={() => setFeedbackOpen(true)}>
                      <Star className="mr-2 h-4 w-4" />
                      Give Feedback
                    </Button>
                  )}
                </div>

                {/* Right: Secondary/destructive */}
                <div className="flex flex-wrap items-center gap-2">
                  {canAcceptOrReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAcceptanceMode('reject');
                        setAcceptanceOpen(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-destructive">Reject Work</span>
                    </Button>
                  )}

                  {canReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectOpen(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-destructive">Reject</span>
                    </Button>
                  )}

                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelOpen(true)}
                    >
                      <Ban className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-destructive">Cancel Request</span>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs (render outside modal for z-index stacking) */}
      {request && (
        <>
          <RequestRejectDialog
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            requestId={request.id}
            requestDisplayId={request.display_id}
            onSuccess={handleActionSuccess}
          />

          <RequestCancelDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            requestId={request.id}
            requestDisplayId={request.display_id}
            onSuccess={handleActionSuccess}
          />

          <RequestAcceptanceDialog
            open={acceptanceOpen}
            onOpenChange={setAcceptanceOpen}
            mode={acceptanceMode}
            requestId={request.id}
            requestDisplayId={request.display_id}
            onAccepted={handleAccepted}
            onSuccess={handleActionSuccess}
          />

          <RequestFeedbackDialog
            open={feedbackOpen}
            onOpenChange={setFeedbackOpen}
            requestId={request.id}
            requestDisplayId={request.display_id}
            onSuccess={handleActionSuccess}
          />
        </>
      )}
    </>
  );
}
