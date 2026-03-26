'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobWithRelations } from '@/lib/types/database';
import { useGeolocation, useGeolocationPermission } from '@/hooks/use-geolocation';
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
  assignJob,
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
  MapPin,
} from 'lucide-react';
import { Combobox } from '@/components/combobox';
import { LEAD_ROLES, ROLES } from '@/lib/constants/roles';

interface JobDetailActionsProps {
  job: JobWithRelations;
  currentUserId: string;
  currentUserRole: string;
  users?: { id: string; full_name: string }[];
  onActionSuccess: () => void;
}

export function JobDetailActions({
  job,
  currentUserId,
  currentUserRole,
  users = [],
  onActionSuccess,
}: JobDetailActionsProps) {
  const router = useRouter();

  // GPS hook for status changes
  const { capturing: capturingGps, capturePosition } = useGeolocation();
  const { permissionState } = useGeolocationPermission();
  const locationActivated = permissionState === 'granted';

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
  const [assignPicValue, setAssignPicValue] = useState('');

  const isGaLeadOrAdmin = (LEAD_ROLES as readonly string[]).includes(currentUserRole);
  const isFinanceApproverOnly = currentUserRole === ROLES.FINANCE_APPROVER;
  const isPIC = job.assigned_to === currentUserId;
  const isCreator = job.created_by === currentUserId;

  // Determine available actions per role + status
  const canAssignPIC = isGaLeadOrAdmin && job.status === 'created';
  const canStartWork = isPIC && job.status === 'assigned';
  const canApproveReject =
    isCreator && job.status === 'pending_approval';
  const canApproveCompletion =
    isCreator && job.status === 'pending_completion_approval';
  const canMarkComplete =
    (isGaLeadOrAdmin || isPIC) && job.status === 'in_progress';
  const canCancel =
    isGaLeadOrAdmin &&
    !isFinanceApproverOnly &&
    !['completed', 'cancelled'].includes(job.status);

  const hasAnyAction =
    canAssignPIC ||
    canStartWork ||
    canApproveReject ||
    canApproveCompletion ||
    canMarkComplete ||
    canCancel;

  if (!hasAnyAction) return null;

  const handleAssignPIC = async () => {
    if (!assignPicValue) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await assignJob({ id: job.id, assigned_to: assignPicValue });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setAssignPicValue('');
      setFeedback({ type: 'success', message: 'PIC assigned.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to assign PIC' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateLocation = async () => {
    setFeedback(null);
    try {
      await capturePosition();
      setFeedback({ type: 'success', message: 'Location activated. You can now start work.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to get location. Please allow location access.',
      });
    }
  };

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
      setFeedback({ type: 'success', message: 'Job rejected. Returned to In Progress — PIC can revise cost and re-request approval.' });
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
          <div className="flex flex-wrap items-center gap-2">
            {canAssignPIC && (
              <>
                <div className="w-48">
                  <Combobox
                    options={users.map((u) => ({ label: u.full_name, value: u.id }))}
                    value={assignPicValue}
                    onValueChange={setAssignPicValue}
                    placeholder="Select PIC..."
                    searchPlaceholder="Search users..."
                    emptyText="No users found."
                    disabled={submitting}
                  />
                </div>
                <Button onClick={handleAssignPIC} disabled={submitting || !assignPicValue}>
                  Assign
                </Button>
              </>
            )}

            {canStartWork && !locationActivated && (
              <Button onClick={handleActivateLocation} disabled={submitting || capturingGps}>
                <MapPin className="mr-2 h-4 w-4" />
                {capturingGps ? 'Getting location...' : 'Activate Location'}
              </Button>
            )}

            {canStartWork && locationActivated && (
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

        {/* Pending Approval read-only indicator (for non-creators) */}
        {job.status === 'pending_approval' && !isCreator && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border px-3 py-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Awaiting Budget Approval
          </div>
        )}

        {/* Pending Completion Approval read-only indicator (for non-creators) */}
        {job.status === 'pending_completion_approval' && !isCreator && (
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
