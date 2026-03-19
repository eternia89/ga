'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { deactivateSchedule, activateSchedule, deleteSchedule } from '@/app/actions/schedule-actions';
import { ScheduleDetail, PMJobRef } from './schedule-detail';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
import { InlineFeedback } from '@/components/inline-feedback';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScheduleStatusBadge } from './schedule-status-badge';
import {
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LEAD_ROLES } from '@/lib/constants/roles';
import { DisplayId } from '@/components/display-id';

const JOB_STATUS_LABELS: Record<string, string> = {
  created: 'Created', assigned: 'Assigned', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
};

function jobStatusColor(status: string): string {
  switch (status) {
    case 'created': return 'bg-gray-100 text-gray-700';
    case 'assigned': return 'bg-blue-100 text-blue-700';
    case 'in_progress': return 'bg-yellow-100 text-yellow-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// ============================================================================
// Types
// ============================================================================

interface ScheduleViewModalProps {
  scheduleId: string | null;
  onOpenChange: (open: boolean) => void;
  userRole: string;
  onActionSuccess?: () => void;
  /** Ordered list of schedule IDs for prev/next navigation */
  scheduleIds?: string[];
  /** Called when user navigates to a different schedule */
  onNavigate?: (scheduleId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ScheduleViewModal({
  scheduleId,
  onOpenChange,
  userRole,
  onActionSuccess,
  scheduleIds = [],
  onNavigate,
}: ScheduleViewModalProps) {
  const router = useRouter();

  // Data states
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null);
  const [pmJobs, setPmJobs] = useState<PMJobRef[]>([]);
  const [creatorName, setCreatorName] = useState<string>('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Navigation
  const currentIndex = scheduleId ? scheduleIds.indexOf(scheduleId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < scheduleIds.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      onNavigate?.(scheduleIds[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      onNavigate?.(scheduleIds[currentIndex + 1]);
    }
  };

  // URL sync
  useEffect(() => {
    if (scheduleId) {
      window.history.replaceState(null, '', '?view=' + scheduleId);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [scheduleId]);

  // Data fetching
  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch schedule with template and asset joins
      const [scheduleResult, pmJobsResult] = await Promise.all([
        supabase
          .from('maintenance_schedules')
          .select(`
            id, company_id, item_id, template_id, assigned_to,
            interval_days, interval_type, auto_create_days_before,
            last_completed_at, next_due_at,
            is_paused, paused_at, paused_reason, is_active,
            deleted_at, created_at, updated_at,
            template:maintenance_templates(name, checklist),
            asset:inventory_items(name, display_id),
            company:companies(name)
          `)
          .eq('id', id)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('jobs')
          .select('id, display_id, status, created_at')
          .eq('maintenance_schedule_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ]);

      if (scheduleResult.error || !scheduleResult.data) {
        setError('Schedule not found');
        setLoading(false);
        return;
      }

      const raw = scheduleResult.data;

      // Normalize FK arrays
      const templateRaw = Array.isArray(raw.template) ? raw.template[0] : raw.template;
      const assetRaw = Array.isArray(raw.asset) ? raw.asset[0] : raw.asset;
      const companyRaw = Array.isArray(raw.company) ? raw.company[0] : raw.company;

      const normalized: MaintenanceSchedule = {
        ...raw,
        template: templateRaw
          ? { name: templateRaw.name, checklist: (templateRaw.checklist ?? []) as MaintenanceSchedule['template'] extends object ? MaintenanceSchedule['template']['checklist'] : never }
          : null,
        asset: assetRaw
          ? { name: assetRaw.name, display_id: assetRaw.display_id }
          : null,
        company: companyRaw ? { name: companyRaw.name } : null,
      };

      setSchedule(normalized);
      setCreatorName('System');

      const jobs: PMJobRef[] = (pmJobsResult.data ?? []).map((j) => ({
        id: j.id,
        display_id: j.display_id,
        status: j.status,
        created_at: j.created_at,
      }));
      setPmJobs(jobs);
    } catch {
      setError('Failed to load schedule details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (scheduleId) {
      fetchData(scheduleId);
    } else {
      setSchedule(null);
      setPmJobs([]);
      setCreatorName('');
      setError(null);
    }
  }, [scheduleId, refreshKey, fetchData]);

  // Sticky bar action state
  const [actionPending, startActionTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const canManage = (LEAD_ROLES as readonly string[]).includes(userRole);

  // Action success handler
  const handleActionSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    router.refresh();
    onActionSuccess?.();
  }, [router, onActionSuccess]);

  const handlePause = () => {
    setActionFeedback(null);
    startActionTransition(async () => {
      if (!schedule) return;
      const result = await deactivateSchedule({ id: schedule.id });
      if (result?.serverError) {
        setActionFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setActionFeedback({ type: 'success', message: 'Schedule paused.' });
        handleActionSuccess();
      }
    });
  };

  const handleResume = () => {
    setActionFeedback(null);
    startActionTransition(async () => {
      if (!schedule) return;
      const result = await activateSchedule({ id: schedule.id });
      if (result?.serverError) {
        setActionFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setActionFeedback({ type: 'success', message: 'Schedule resumed.' });
        handleActionSuccess();
      }
    });
  };

  const handleDeactivate = () => {
    setActionFeedback(null);
    startActionTransition(async () => {
      if (!schedule) return;
      const result = await deleteSchedule({ id: schedule.id });
      if (result?.serverError) {
        setActionFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setActionFeedback({ type: 'success', message: 'Schedule deactivated.' });
        handleActionSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={!!scheduleId} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1000px] max-h-[90vh] flex flex-col p-0 gap-0 max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">Schedule Details</DialogTitle>
        {/* Loading state */}
        {loading && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              {scheduleId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(scheduleId)}
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
        {schedule && !loading && !error && (
          <>
            {/* Header (non-scrollable) */}
            <div className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
              <div className="flex flex-wrap items-center gap-3">
                {/* Prev/Next navigation */}
                {scheduleIds.length > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!hasPrev}
                      onClick={goToPrev}
                      aria-label="Previous schedule"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!hasNext}
                      onClick={goToNext}
                      aria-label="Next schedule"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-1">
                      {currentIndex + 1}/{scheduleIds.length}
                    </span>
                  </div>
                )}

                <h2 className="text-xl font-bold tracking-tight truncate max-w-[400px]">
                  {schedule.template?.name ?? 'Schedule'}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <ScheduleStatusBadge
                  schedule={{
                    is_active: schedule.is_active,
                    is_paused: schedule.is_paused,
                    paused_reason: schedule.paused_reason,
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(schedule.created_at), 'dd-MM-yyyy')} by {creatorName}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {schedule.asset?.name && (
                  <>
                    Asset: {schedule.asset.name}
                    {schedule.asset.display_id && ` (${schedule.asset.display_id})`}
                    {' \u00b7 '}
                  </>
                )}
                {schedule.interval_days} {schedule.interval_days === 1 ? 'day' : 'days'} ({schedule.interval_type})
                {schedule.auto_create_days_before > 0 && (
                  <>{' \u00b7 '}Auto-create {schedule.auto_create_days_before}d before due</>
                )}
              </p>
            </div>

            {/* Split layout: Details left, PM Jobs right */}
            <div className="flex-1 min-h-0 grid grid-cols-[600px_400px] max-lg:grid-cols-1">
              <div className="overflow-y-auto px-6 py-4 max-lg:border-b">
                <ScheduleDetail
                  schedule={schedule}
                  pmJobs={pmJobs}
                  userRole={userRole}
                />
              </div>
              <div className="overflow-y-auto border-l max-lg:border-l-0 px-6 py-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  PM Jobs ({pmJobs.length})
                </h3>
                {pmJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No PM jobs generated yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {pmJobs.map((job) => (
                      <li key={job.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <DisplayId className="text-sm font-medium">{job.display_id}</DisplayId>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${jobStatusColor(job.status)}`}>
                            {JOB_STATUS_LABELS[job.status] ?? job.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(job.created_at), 'dd-MM-yyyy')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Sticky action bar */}
            <div className="border-t px-6 py-3 flex items-center justify-between gap-2 shrink-0 bg-background">
              <div className="flex items-center gap-2">
                {actionFeedback && (
                  <InlineFeedback type={actionFeedback.type} message={actionFeedback.message} onDismiss={() => setActionFeedback(null)} />
                )}
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  {schedule.is_active ? (
                    <Button variant="outline" size="sm" onClick={handlePause} disabled={actionPending} className="text-destructive hover:text-destructive">
                      {actionPending ? 'Processing...' : 'Pause'}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleResume} disabled={actionPending}>
                      {actionPending ? 'Processing...' : 'Resume'}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleDeactivate} disabled={actionPending} className="text-destructive hover:text-destructive">
                    {actionPending ? 'Processing...' : 'Deactivate'}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
