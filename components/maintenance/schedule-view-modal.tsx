'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { ScheduleDetail, PMJobRef } from './schedule-detail';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
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
            interval_days, interval_type, last_completed_at, next_due_at,
            is_paused, paused_at, paused_reason, is_active,
            deleted_at, created_at, updated_at,
            template:maintenance_templates(name, checklist),
            asset:inventory_items(name, display_id)
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

      const normalized: MaintenanceSchedule = {
        ...raw,
        template: templateRaw
          ? { name: templateRaw.name, checklist: (templateRaw.checklist ?? []) as MaintenanceSchedule['template'] extends object ? MaintenanceSchedule['template']['checklist'] : never }
          : null,
        asset: assetRaw
          ? { name: assetRaw.name, display_id: assetRaw.display_id }
          : null,
      };

      setSchedule(normalized);

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
      setError(null);
    }
  }, [scheduleId, refreshKey, fetchData]);

  // Action success handler
  const handleActionSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    router.refresh();
    onActionSuccess?.();
  }, [router, onActionSuccess]);

  return (
    <Dialog open={!!scheduleId} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0"
        showCloseButton={true}
      >
        {/* Loading state */}
        {loading && (
          <div className="p-6 space-y-4">
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
              <DialogTitle className="sr-only">
                Schedule: {schedule.template?.name ?? 'Schedule'}
              </DialogTitle>
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
                <ScheduleStatusBadge
                  schedule={{
                    is_active: schedule.is_active,
                    is_paused: schedule.is_paused,
                    paused_reason: schedule.paused_reason,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {schedule.asset?.name && (
                  <>
                    Asset: {schedule.asset.name}
                    {schedule.asset.display_id && ` (${schedule.asset.display_id})`}
                    {' \u00b7 '}
                  </>
                )}
                {schedule.interval_days} {schedule.interval_days === 1 ? 'day' : 'days'} ({schedule.interval_type})
                {' \u00b7 '}Created {format(new Date(schedule.created_at), 'dd-MM-yyyy')}
              </p>
            </div>

            {/* Body: ScheduleDetail component (scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
              <ScheduleDetail
                schedule={schedule}
                pmJobs={pmJobs}
                userRole={userRole}
              />
            </div>

            {/* Sticky action bar */}
            <div className="border-t px-6 py-3 flex items-center justify-end gap-2 shrink-0 bg-background">
              <span className="text-xs text-muted-foreground">
                {schedule.template?.name ?? 'Schedule'}
                {schedule.asset?.name && ` \u00b7 ${schedule.asset.name}`}
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
