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
import { Combobox } from '@/components/combobox';
import { InlineFeedback } from '@/components/inline-feedback';
import {
  assignJob,
  updateJobStatus,
  cancelJob,
} from '@/app/actions/job-actions';
import {
  approveJob,
  rejectJob,
  unapproveJob,
} from '@/app/actions/approval-actions';
import {
  UserCheck,
  Play,
  CheckCircle,
  Ban,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Unlock,
} from 'lucide-react';

interface JobDetailActionsProps {
  job: JobWithRelations;
  currentUserId: string;
  currentUserRole: string;
  users: { id: string; name: string }[];
  onActionSuccess: () => void;
}

export function JobDetailActions({
  job,
  currentUserId,
  currentUserRole,
  users,
  onActionSuccess,
}: JobDetailActionsProps) {
  const router = useRouter();

  // GPS hook for status changes
  const { capturing: capturingGps, capturePosition } = useGeolocation();

  // Dialog states
  const [cancelOpen, setCancelOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Form states
  const [selectedPIC, setSelectedPIC] = useState(job.assigned_to ?? '');
  const [rejectReason, setRejectReason] = useState('');

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isFinanceApproverOrAdmin = ['finance_approver', 'admin'].includes(currentUserRole);
  const isFinanceApproverOnly = currentUserRole === 'finance_approver';
  const isPIC = job.assigned_to === currentUserId;

  const userOptions = users.map((u) => ({ label: u.name, value: u.id }));

  // Determine available actions per role + status
  const canAssign = isGaLeadOrAdmin && job.status === 'created';
  const canReassign = isGaLeadOrAdmin && ['assigned', 'in_progress', 'pending_approval', 'pending_completion_approval'].includes(job.status);
  const canStartWork = (isGaLeadOrAdmin || isPIC) && job.status === 'assigned';
  const canApproveReject =
    isFinanceApproverOrAdmin && job.status === 'pending_approval';
  const canMarkComplete =
    (isGaLeadOrAdmin || isPIC) && job.status === 'in_progress';
  const canCancel =
    isGaLeadOrAdmin &&
    !isFinanceApproverOnly &&
    !['completed', 'cancelled'].includes(job.status);

  // Un-approve: finance_approver/admin can unlock budget on approved in_progress jobs
  const canUnapprove =
    isFinanceApproverOrAdmin &&
    job.status === 'in_progress' &&
    !!job.approved_at;

  const hasAnyAction =
    canAssign ||
    canReassign ||
    canStartWork ||
    canApproveReject ||
    canMarkComplete ||
    canCancel ||
    canUnapprove;

  if (!hasAnyAction) return null;

  const handleAssign = async () => {
    if (!selectedPIC) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await assignJob({ id: job.id, assigned_to: selectedPIC });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setAssignOpen(false);
      setFeedback({ type: 'success', message: 'Job assigned successfully.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to assign' });
    } finally {
      setSubmitting(false);
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
      setFeedback({ type: 'success', message: 'Job rejected. Returned to In Progress — budget can be re-edited.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnapprove = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await unapproveJob({ job_id: job.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Budget unlocked. PIC can now re-edit the estimated cost.' });
      onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to un-approve' });
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
        <div className="flex flex-wrap gap-2">
          {/* Assign / Reassign */}
          {(canAssign || canReassign) && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPIC(job.assigned_to ?? '');
                setAssignOpen(true);
              }}
              disabled={submitting}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {canReassign ? 'Reassign PIC' : 'Assign PIC'}
            </Button>
          )}

          {/* Start Work */}
          {canStartWork && (
            <Button onClick={handleStartWork} disabled={submitting || capturingGps}>
              <Play className="mr-2 h-4 w-4" />
              {capturingGps ? 'Getting location...' : 'Start Work'}
            </Button>
          )}

          {/* Approve Budget */}
          {canApproveReject && (
            <Button onClick={handleApprove} disabled={submitting}>
              <ThumbsUp className="mr-2 h-4 w-4" />
              Approve Budget
            </Button>
          )}

          {/* Reject Budget */}
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

          {/* Un-approve (unlock budget) */}
          {canUnapprove && (
            <Button
              variant="outline"
              onClick={handleUnapprove}
              disabled={submitting}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Unlock Budget
            </Button>
          )}

          {/* Mark Complete */}
          {canMarkComplete && (
            <Button onClick={handleMarkComplete} disabled={submitting || capturingGps}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {capturingGps ? 'Getting location...' : 'Mark Complete'}
            </Button>
          )}

          {/* Cancel */}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              disabled={submitting}
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel Job
            </Button>
          )}
        </div>

        {/* Pending Approval read-only indicator (for non-approvers) */}
        {job.status === 'pending_approval' && !isFinanceApproverOrAdmin && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border px-3 py-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Awaiting Budget Approval
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

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {canReassign ? 'Reassign PIC' : 'Assign PIC'}
            </DialogTitle>
            <DialogDescription>
              Select a person in charge for this job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Person in Charge</Label>
            <Combobox
              options={userOptions}
              value={selectedPIC}
              onValueChange={setSelectedPIC}
              placeholder="Select PIC..."
              searchPlaceholder="Search users..."
              emptyText="No users found."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={submitting || !selectedPIC}>
              {submitting ? 'Saving...' : (canReassign ? 'Reassign' : 'Assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
