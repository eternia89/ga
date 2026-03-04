'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobWithRelations } from '@/lib/types/database';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { InlineFeedback } from '@/components/inline-feedback';
import {
  updateJobStatus,
  cancelJob,
} from '@/app/actions/job-actions';
import {
  approveJob,
  rejectJob,
  approveCompletion,
  rejectCompletion,
} from '@/app/actions/approval-actions';
import {
  Play,
  CheckCircle,
  Ban,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react';

interface JobDetailActionsProps {
  job: JobWithRelations;
  currentUserId: string;
  currentUserRole: string;
  onActionSuccess: () => void;
}

export function JobDetailActions({
  job,
  currentUserId,
  currentUserRole,
  onActionSuccess,
}: JobDetailActionsProps) {
  const router = useRouter();

  // GPS hook for status changes
  const { capturing: capturingGps, capturePosition } = useGeolocation();

  // Dialog states
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectCompletionOpen, setRejectCompletionOpen] = useState(false);

  // Form states
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCompletionReason, setRejectCompletionReason] = useState('');

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isFinanceApproverOrAdmin = ['finance_approver', 'admin'].includes(currentUserRole);
  const isFinanceApproverOnly = currentUserRole === 'finance_approver';
  const isPIC = job.assigned_to === currentUserId;

  // Determine available actions per role + status
  const canStartWork = (isGaLeadOrAdmin || isPIC) && job.status === 'assigned';
  const canApproveReject =
    isFinanceApproverOrAdmin && job.status === 'pending_approval';
  const canApproveCompletion =
    isFinanceApproverOrAdmin && job.status === 'pending_completion_approval';
  // Can only mark complete if in_progress AND budget is approved (or no budget set)
  const hasPendingBudget = (job.estimated_cost ?? 0) > 0 && !job.approved_at;
  const canMarkComplete =
    (isGaLeadOrAdmin || isPIC) && job.status === 'in_progress' && !hasPendingBudget;
  const canCancel =
    isGaLeadOrAdmin &&
    !isFinanceApproverOnly &&
    !['completed', 'cancelled'].includes(job.status);

  const hasAnyAction =
    canStartWork ||
    canApproveReject ||
    canApproveCompletion ||
    canMarkComplete ||
    canCancel;

  if (!hasAnyAction) return null;

  const handleStartWork = async () => {
    setFeedback(null);
    // Capture GPS before status change — GPS is blocking (REQ-JOB-010)
    let gps: { latitude: number; longitude: number; accuracy: number } | undefined;
    try {
      gps = await capturePosition();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to get location. Please allow location access.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateJobStatus({
        id: job.id,
        status: 'in_progress',
        latitude: gps.latitude,
        longitude: gps.longitude,
        gpsAccuracy: gps.accuracy,
      });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Work started.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to start' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await approveJob({ job_id: job.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Job approved. Work can proceed.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to approve' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await rejectJob({ job_id: job.id, reason: rejectReason.trim() });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setRejectOpen(false);
      setRejectReason('');
      setFeedback({ type: 'success', message: 'Job rejected. Returned to In Progress — budget can be re-edited.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveCompletion = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await approveCompletion({ job_id: job.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Completion approved. Linked requests moved to pending acceptance.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to approve completion' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectCompletion = async () => {
    if (!rejectCompletionReason.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await rejectCompletion({ job_id: job.id, reason: rejectCompletionReason.trim() });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setRejectCompletionOpen(false);
      setRejectCompletionReason('');
      setFeedback({ type: 'success', message: 'Completion rejected. Job returned to In Progress for rework.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject completion' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    setFeedback(null);
    // Capture GPS before status change — GPS is blocking (REQ-JOB-010)
    let gps: { latitude: number; longitude: number; accuracy: number } | undefined;
    try {
      gps = await capturePosition();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to get location. Please allow location access.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateJobStatus({
        id: job.id,
        status: 'completed',
        latitude: gps.latitude,
        longitude: gps.longitude,
        gpsAccuracy: gps.accuracy,
      });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Job marked as complete.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to complete' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await cancelJob({ id: job.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setCancelOpen(false);
      router.refresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to cancel' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Primary CTA */}
          <div className="flex flex-wrap gap-2">
            {canStartWork && (
              <Button onClick={handleStartWork} disabled={submitting || capturingGps}>
                <Play className="mr-2 h-4 w-4" />
                {capturingGps ? 'Getting location...' : 'Start Work'}
              </Button>
            )}

            {canApproveReject && (
              <Button onClick={handleApprove} disabled={submitting}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                Approve Budget
              </Button>
            )}

            {canApproveCompletion && (
              <Button onClick={handleApproveCompletion} disabled={submitting}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Completion
              </Button>
            )}

            {canMarkComplete && (
              <Button onClick={handleMarkComplete} disabled={submitting || capturingGps}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {capturingGps ? 'Getting location...' : 'Mark Complete'}
              </Button>
            )}
          </div>

          {/* Right: Secondary actions */}
          <div className="flex flex-wrap gap-2">
            {canApproveReject && (
              <Button
                variant="outline"
                onClick={() => {
                  setRejectReason('');
                  setRejectOpen(true);
                }}
                disabled={submitting}
              >
                <ThumbsDown className="mr-2 h-4 w-4 text-destructive" />
                <span className="text-destructive">Reject Budget</span>
              </Button>
            )}

            {canApproveCompletion && (
              <Button
                variant="outline"
                onClick={() => {
                  setRejectCompletionReason('');
                  setRejectCompletionOpen(true);
                }}
                disabled={submitting}
              >
                <ThumbsDown className="mr-2 h-4 w-4 text-destructive" />
                <span className="text-destructive">Reject Completion</span>
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                onClick={() => setCancelOpen(true)}
                disabled={submitting}
              >
                <Ban className="mr-2 h-4 w-4 text-destructive" />
                <span className="text-destructive">Cancel Job</span>
              </Button>
            )}
          </div>
        </div>

        {/* Pending Approval read-only indicator (for non-approvers) */}
        {job.status === 'pending_approval' && !isFinanceApproverOrAdmin && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border px-3 py-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Awaiting Budget Approval
          </div>
        )}

        {/* Pending Completion Approval read-only indicator (for non-approvers) */}
        {job.status === 'pending_completion_approval' && !isFinanceApproverOrAdmin && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border px-3 py-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Awaiting Completion Approval
          </div>
        )}

        {feedback && (
          <InlineFeedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Budget</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this budget. The job will return to In Progress so the PIC can revise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this budget is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={1000}
              className="min-h-24 resize-y"
            />
            <p className="text-xs text-muted-foreground text-right">
              {rejectReason.length}/1000
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !rejectReason.trim()}
            >
              {submitting ? 'Rejecting...' : 'Reject Budget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Completion Dialog */}
      <Dialog open={rejectCompletionOpen} onOpenChange={setRejectCompletionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Completion</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this completion. The job will return to In Progress so the PIC can rework and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reject-completion-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-completion-reason"
              placeholder="Explain why the completion is being rejected..."
              value={rejectCompletionReason}
              onChange={(e) => setRejectCompletionReason(e.target.value)}
              maxLength={1000}
              className="min-h-24 resize-y"
            />
            <p className="text-xs text-muted-foreground text-right">
              {rejectCompletionReason.length}/1000
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectCompletionOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectCompletion}
              disabled={submitting || !rejectCompletionReason.trim()}
            >
              {submitting ? 'Rejecting...' : 'Reject Completion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation AlertDialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel job <strong>{job.display_id}</strong> and return all linked requests to
              &quot;Triaged&quot; status. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Keep Job</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? 'Cancelling...' : 'Cancel Job'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
