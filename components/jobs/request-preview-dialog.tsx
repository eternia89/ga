'use client';

import { formatDateTime } from '@/lib/utils';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import { PRIORITY_LABELS } from '@/lib/constants/request-status';
import { DisplayId } from '@/components/display-id';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LinkedRequestDetail {
  id: string;
  display_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  location?: { name: string } | null;
  category?: { name: string } | null;
  requester?: { full_name: string } | null;
  assigned_user?: { full_name: string } | null;
}

interface RequestPreviewDialogProps {
  request: LinkedRequestDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestPreviewDialog({
  request,
  open,
  onOpenChange,
}: RequestPreviewDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DisplayId className="text-sm font-semibold text-muted-foreground">
              {request.display_id}
            </DisplayId>
            <RequestStatusBadge status={request.status} />
          </div>
          <DialogTitle className="text-lg">{request.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Description */}
          {request.description && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Description
              </dt>
              <dd className="text-sm whitespace-pre-wrap">{request.description}</dd>
            </div>
          )}

          {/* Info grid */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Requester</dt>
              <dd className="text-sm mt-0.5">{request.requester?.full_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Location</dt>
              <dd className="text-sm mt-0.5">{request.location?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Category</dt>
              <dd className="text-sm mt-0.5">{request.category?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Priority</dt>
              <dd className="text-sm mt-0.5">
                {request.priority
                  ? (PRIORITY_LABELS[request.priority] ?? request.priority)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">PIC</dt>
              <dd className="text-sm mt-0.5">{request.assigned_user?.full_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Created</dt>
              <dd className="text-sm mt-0.5">
                {formatDateTime(request.created_at)}
              </dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
