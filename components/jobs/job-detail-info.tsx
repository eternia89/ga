'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { JobWithRelations } from '@/lib/types/database';
import { JobStatusBadge } from './job-status-badge';
import { JobPriorityBadge } from './job-priority-badge';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import { RequestPreviewDialog } from './request-preview-dialog';
import { OverdueBadge } from '@/components/maintenance/overdue-badge';
import { PRIORITY_LABELS } from '@/lib/constants/job-status';
import { Lock, LockOpen } from 'lucide-react';

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'dd-MM-yyyy, HH:mm:ss');
}

interface JobDetailInfoProps {
  job: JobWithRelations;
  approvedByName?: string | null;
  approvalRejectedByName?: string | null;
}

export function JobDetailInfo({
  job,
  approvedByName,
  approvalRejectedByName,
}: JobDetailInfoProps) {
  const linkedRequests = job.job_requests ?? [];
  const [previewRequest, setPreviewRequest] = useState<typeof linkedRequests[number]['request'] | null>(null);

  return (
    <div className="rounded-lg border p-6 space-y-6">
      {/* Header: display_id, title, status, priority, PM badges */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-muted-foreground">
            {job.display_id}
          </span>
          <JobStatusBadge status={job.status} />
          {job.priority && <JobPriorityBadge priority={job.priority} />}
          {job.job_type === 'preventive_maintenance' && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              PM
            </span>
          )}
          {job.job_type === 'preventive_maintenance' && job.maintenance_schedule && (
            <OverdueBadge
              nextDueAt={(job.maintenance_schedule as { next_due_at?: string | null }).next_due_at ?? null}
              jobStatus={job.status}
            />
          )}
        </div>
        <h2 className="text-xl font-semibold leading-tight">{job.title}</h2>
        {job.created_by_user?.full_name && (
          <p className="text-sm text-muted-foreground">
            Created by {job.created_by_user.full_name}
            <span> · {format(new Date(job.created_at), 'dd-MM-yyyy')}</span>
          </p>
        )}
      </div>

      {/* Estimated Cost — prominent */}
      {job.estimated_cost !== null && job.estimated_cost !== undefined && (
        <div className="rounded-md bg-muted/50 border px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Estimated Cost
            </p>
            {job.approved_at ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <Lock className="h-3 w-3" />
                Approved
              </span>
            ) : job.status === 'pending_approval' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Pending Approval
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <LockOpen className="h-3 w-3" />
                Editable
              </span>
            )}
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatIDR(job.estimated_cost)}
          </p>
        </div>
      )}

      {/* Core fields */}
      <dl className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            PIC
          </dt>
          <dd className="text-sm">
            {job.pic?.full_name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Priority
          </dt>
          <dd className="text-sm">
            {job.priority ? (PRIORITY_LABELS[job.priority] ?? job.priority) : (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Category
          </dt>
          <dd className="text-sm">
            {job.category?.name ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Location
          </dt>
          <dd className="text-sm">
            {job.location?.name ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Created By
          </dt>
          <dd className="text-sm">
            {job.created_by_user?.full_name ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Created At
          </dt>
          <dd className="text-sm">{formatDate(job.created_at)}</dd>
        </div>

        {job.started_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Started At
            </dt>
            <dd className="text-sm">{formatDate(job.started_at)}</dd>
          </div>
        )}

        {job.completed_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Completed At
            </dt>
            <dd className="text-sm">{formatDate(job.completed_at)}</dd>
          </div>
        )}

        {/* Approval fields */}
        {job.approval_submitted_at && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Submitted for Approval
            </dt>
            <dd className="text-sm">{formatDate(job.approval_submitted_at)}</dd>
          </div>
        )}

        {job.approved_at && (
          <>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Approved At
              </dt>
              <dd className="text-sm">{formatDate(job.approved_at)}</dd>
            </div>
            {approvedByName && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Approved By
                </dt>
                <dd className="text-sm">{approvedByName}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      {/* Description */}
      {job.description && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Description
          </h3>
          <p className="text-sm whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      {/* Rejection reason callout */}
      {job.approval_rejection_reason && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Approval Rejected
            {approvalRejectedByName && (
              <span className="font-normal"> by {approvalRejectedByName}</span>
            )}
            {job.approval_rejected_at && (
              <span className="font-normal ml-1 text-xs text-red-500">
                — {formatDate(job.approval_rejected_at)}
              </span>
            )}
          </p>
          <p className="text-sm text-red-600 mt-1">
            {job.approval_rejection_reason}
          </p>
        </div>
      )}

      {/* Linked Requests */}
      {linkedRequests.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Linked Requests ({linkedRequests.length})
          </h3>
          <div className="space-y-2">
            {linkedRequests.map(({ request }) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setPreviewRequest(request)}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted/40 transition-colors w-full text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
                    {request.display_id}
                  </span>
                  <span className="truncate text-sm">{request.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {request.requester?.full_name && (
                    <span className="text-xs text-muted-foreground hidden max-md:hidden">
                      {request.requester.full_name}
                    </span>
                  )}
                  <RequestStatusBadge status={request.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Request Preview Dialog */}
      <RequestPreviewDialog
        request={previewRequest}
        open={!!previewRequest}
        onOpenChange={(open) => { if (!open) setPreviewRequest(null); }}
      />
    </div>
  );
}
