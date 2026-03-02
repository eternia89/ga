'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { deactivateSchedule, activateSchedule, deleteSchedule } from '@/app/actions/schedule-actions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { InlineFeedback } from '@/components/inline-feedback';
import { ScheduleStatusBadge } from './schedule-status-badge';
import { ScheduleForm } from './schedule-form';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';

// ============================================================================
// PM Job reference type for the linked jobs section
// ============================================================================

export interface PMJobRef {
  id: string;
  display_id: string;
  status: string;
  created_at: string;
}

// ============================================================================
// Status label map for PM job status display
// ============================================================================

const JOB_STATUS_LABELS: Record<string, string> = {
  created:     'Created',
  assigned:    'Assigned',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

function jobStatusColor(status: string): string {
  switch (status) {
    case 'created':     return 'bg-gray-100 text-gray-700';
    case 'assigned':    return 'bg-blue-100 text-blue-700';
    case 'in_progress': return 'bg-yellow-100 text-yellow-700';
    case 'completed':   return 'bg-green-100 text-green-700';
    case 'cancelled':   return 'bg-red-100 text-red-700';
    default:            return 'bg-gray-100 text-gray-700';
  }
}

// ============================================================================
// ScheduleDetail props
// ============================================================================

interface ScheduleDetailProps {
  schedule: MaintenanceSchedule;
  pmJobs: PMJobRef[];
  userRole: string;
}

export function ScheduleDetail({ schedule, pmJobs, userRole }: ScheduleDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canManage = ['ga_lead', 'admin'].includes(userRole);

  const isAutoPaused = schedule.is_paused && schedule.paused_reason?.startsWith('auto:');

  // Friendly message for auto-pause reason
  function getAutoPauseMessage(): string {
    const reason = schedule.paused_reason ?? '';
    if (reason.includes('broken'))      return 'This schedule was automatically paused because the asset is broken.';
    if (reason.includes('under_repair')) return 'This schedule was automatically paused because the asset is under repair.';
    return 'This schedule was automatically paused due to an asset status change.';
  }

  function handleDeactivate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await deactivateSchedule({ id: schedule.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Schedule deactivated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to deactivate schedule.' });
      }
    });
  }

  function handleActivate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await activateSchedule({ id: schedule.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'Schedule activated.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: 'Failed to activate schedule.' });
      }
    });
  }

  function handleDelete() {
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteSchedule({ id: schedule.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        setShowDeleteConfirm(false);
      } else if (result?.data?.success) {
        router.push('/maintenance');
      } else {
        setFeedback({ type: 'error', message: 'Failed to delete schedule.' });
        setShowDeleteConfirm(false);
      }
    });
  }

  const nextDue = schedule.next_due_at ? new Date(schedule.next_due_at) : null;
  const isOverdue = nextDue && schedule.is_active && !schedule.is_paused && nextDue < new Date();

  return (
    <div className="space-y-6">

      {/* Status bar + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ScheduleStatusBadge
            schedule={{
              is_active: schedule.is_active,
              is_paused: schedule.is_paused,
              paused_reason: schedule.paused_reason,
            }}
          />
          <span className="text-sm text-muted-foreground">
            Created {format(new Date(schedule.created_at), 'dd-MM-yyyy')}
          </span>
        </div>

        {canManage && !showDeleteConfirm && (
          <div className="flex items-center gap-2">
            {schedule.is_active ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                Deactivate
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleActivate}
                disabled={isPending}
              >
                Activate
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          </div>
        )}

      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm font-medium text-destructive">Delete this schedule?</p>
          <p className="text-sm text-muted-foreground">
            This will soft-delete the schedule. Historical PM jobs from this schedule will remain.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Confirm Delete'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Auto-pause notice */}
      {isAutoPaused && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            {getAutoPauseMessage()} Activate the schedule once the asset returns to active status.
          </p>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Form directly editable for users with permission */}
      {canManage ? (
        <ScheduleForm
          templates={[]}
          assets={[]}
          mode="edit"
          schedule={schedule}
        />
      ) : (
        <>
          {/* Schedule info */}
          <div className="rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Schedule Details
            </h2>
            <Separator />

            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Template</p>
                <p className="text-sm font-medium">
                  {schedule.template?.name ? (
                    <a
                      href={`/maintenance/templates/${schedule.template_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {schedule.template.name}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Asset</p>
                <p className="text-sm font-medium">
                  {schedule.asset?.name ? (
                    <a
                      href={`/inventory/${schedule.item_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {schedule.asset.name}
                      {schedule.asset.display_id && (
                        <span className="text-muted-foreground font-normal ml-1">
                          ({schedule.asset.display_id})
                        </span>
                      )}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Interval</p>
                <p className="text-sm">
                  {schedule.interval_days} {schedule.interval_days === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                <p className="text-sm capitalize">
                  {schedule.interval_type === 'fixed' ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Fixed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                      Floating
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Next Due</p>
                <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {!schedule.is_active || schedule.is_paused
                    ? <span className="text-muted-foreground font-normal">N/A</span>
                    : nextDue
                    ? format(nextDue, 'dd-MM-yyyy')
                    : '—'}
                </p>
                {isOverdue && (
                  <p className="text-xs text-red-500 mt-0.5">Overdue</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Last Completed</p>
                <p className="text-sm">
                  {schedule.last_completed_at
                    ? format(new Date(schedule.last_completed_at), 'dd-MM-yyyy')
                    : <span className="text-muted-foreground">Never</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Linked PM Jobs */}
          <div className="rounded-lg border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                PM Jobs ({pmJobs.length})
              </h2>
            </div>
            <Separator />

            {pmJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No PM jobs have been generated from this schedule yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {pmJobs.map((job) => (
                  <li key={job.id}>
                    <a
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-600">
                          {job.display_id}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${jobStatusColor(job.status)}`}
                        >
                          {JOB_STATUS_LABELS[job.status] ?? job.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(job.created_at), 'dd-MM-yyyy')}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
