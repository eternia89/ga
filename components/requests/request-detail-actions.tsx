'use client';

import { useState } from 'react';
import { RequestWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { XCircle, ClipboardList, Ban, CheckCircle, Star } from 'lucide-react';
import { RequestRejectDialog } from './request-reject-dialog';
import { RequestCancelDialog } from './request-cancel-dialog';
import { RequestAcceptanceDialog } from './request-acceptance-dialog';

interface RequestDetailActionsProps {
  request: RequestWithRelations;
  currentUserId: string;
  currentUserRole: string;
  onActionSuccess: () => void;
  onAccepted?: () => void;
}

export function RequestDetailActions({
  request,
  currentUserId,
  currentUserRole,
  onActionSuccess,
  onAccepted,
}: RequestDetailActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [acceptanceOpen, setAcceptanceOpen] = useState(false);
  const [acceptanceMode, setAcceptanceMode] = useState<'accept' | 'reject'>('accept');

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isRequester = request.requester_id === currentUserId;
  const isAdmin = currentUserRole === 'admin';

  const canCancel = isRequester && request.status === 'submitted';
  const canTriage = isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status);
  const canReject =
    isGaLeadOrAdmin &&
    (request.status === 'submitted' || request.status === 'triaged');

  // Acceptance actions: requester or admin on pending_acceptance
  const canAcceptOrReject =
    (isRequester || isAdmin) && request.status === 'pending_acceptance';

  // Feedback: requester only, accepted status, no feedback yet
  const canGiveFeedback =
    isRequester && request.status === 'accepted' && !request.feedback_rating;

  const hasAnyAction =
    canCancel || canTriage || canReject || canAcceptOrReject || canGiveFeedback;

  if (!hasAnyAction) return null;

  const scrollToTriage = () => {
    const el = document.getElementById('triage-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openAcceptance = (mode: 'accept' | 'reject') => {
    setAcceptanceMode(mode);
    setAcceptanceOpen(true);
  };

  const handleAccepted = () => {
    onAccepted?.();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Primary CTA */}
        <div className="flex flex-wrap gap-2">
          {canTriage && (
            <Button onClick={scrollToTriage}>
              <ClipboardList className="mr-2 h-4 w-4" />
              {request.status === 'submitted' ? 'Triage' : 'Edit Triage'}
            </Button>
          )}

          {canAcceptOrReject && (
            <Button
              onClick={() => openAcceptance('accept')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept Work
            </Button>
          )}

          {canGiveFeedback && (
            <Button onClick={() => onAccepted?.()}>
              <Star className="mr-2 h-4 w-4" />
              Give Feedback
            </Button>
          )}
        </div>

        {/* Right: Secondary actions */}
        <div className="flex flex-wrap gap-2">
          {canAcceptOrReject && (
            <Button variant="outline" onClick={() => openAcceptance('reject')}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Reject Work</span>
            </Button>
          )}

          {canReject && (
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Reject</span>
            </Button>
          )}

          {canCancel && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <Ban className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Cancel Request</span>
            </Button>
          )}
        </div>
      </div>

      <RequestRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        requestId={request.id}
        requestDisplayId={request.display_id}
        onSuccess={onActionSuccess}
      />

      <RequestCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        requestId={request.id}
        requestDisplayId={request.display_id}
        onSuccess={onActionSuccess}
      />

      <RequestAcceptanceDialog
        open={acceptanceOpen}
        onOpenChange={setAcceptanceOpen}
        mode={acceptanceMode}
        requestId={request.id}
        requestDisplayId={request.display_id}
        onAccepted={handleAccepted}
        onSuccess={onActionSuccess}
      />
    </>
  );
}
