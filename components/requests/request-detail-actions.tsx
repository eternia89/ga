'use client';

import { useState } from 'react';
import { RequestWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Pencil, XCircle, ClipboardList, Ban } from 'lucide-react';
import { RequestRejectDialog } from './request-reject-dialog';
import { RequestCancelDialog } from './request-cancel-dialog';

interface RequestDetailActionsProps {
  request: RequestWithRelations;
  currentUserId: string;
  currentUserRole: string;
  onEdit: () => void;
  onActionSuccess: () => void;
}

export function RequestDetailActions({
  request,
  currentUserId,
  currentUserRole,
  onEdit,
  onActionSuccess,
}: RequestDetailActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isRequester = request.requester_id === currentUserId;

  const canEdit = isRequester && request.status === 'submitted';
  const canCancel = isRequester && request.status === 'submitted';
  const canTriage = isGaLeadOrAdmin && request.status === 'submitted';
  const canReject =
    isGaLeadOrAdmin &&
    (request.status === 'submitted' || request.status === 'triaged');

  const hasAnyAction = canEdit || canCancel || canTriage || canReject;
  if (!hasAnyAction) return null;

  const scrollToTriage = () => {
    const el = document.getElementById('triage-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}

        {canTriage && (
          <Button onClick={scrollToTriage}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Triage
          </Button>
        )}

        {canReject && (
          <Button variant="outline" onClick={() => setRejectOpen(true)}>
            <XCircle className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-destructive">Reject</span>
          </Button>
        )}

        {canCancel && (
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            <Ban className="mr-2 h-4 w-4" />
            Cancel Request
          </Button>
        )}
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
    </>
  );
}
