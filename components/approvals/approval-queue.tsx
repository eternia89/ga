'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatIDR, formatDate } from '@/lib/utils';
import { JobViewModal } from '@/components/jobs/job-view-modal';
import { APPROVAL_TYPE_COLORS, APPROVAL_TYPE_LABELS, APPROVAL_DECISION_COLORS, APPROVAL_DECISION_LABELS } from '@/lib/constants/approval-status';
import { DisplayId } from '@/components/display-id';

// ============================================================================
// Types
// ============================================================================

export type ApprovalJob = {
  id: string;
  display_id: string;
  title: string;
  estimated_cost: number | null;
  status: string;
  // Budget approval fields
  approval_submitted_at: string | null;
  approved_at: string | null;
  approval_rejected_at: string | null;
  approval_rejection_reason: string | null;
  // Completion approval fields
  completion_submitted_at: string | null;
  completion_approved_at: string | null;
  completion_rejected_at: string | null;
  completion_rejection_reason: string | null;
  created_at: string;
  pic?: { full_name: string } | null;
  approved_by_user?: { full_name: string } | null;
  rejected_by_user?: { full_name: string } | null;
  completion_approved_by_user?: { full_name: string } | null;
  completion_rejected_by_user?: { full_name: string } | null;
  job_requests?: Array<{
    request: { display_id: string };
  }>;
  decision: 'pending' | 'approved' | 'rejected';
  approval_type: 'budget' | 'completion';
};

interface ApprovalQueueProps {
  jobs: ApprovalJob[];
  initialViewId?: string;
  currentUserId: string;
  currentUserRole: string;
}

// ============================================================================
// Helpers
// ============================================================================

function getDecisionDate(job: ApprovalJob): string | null {
  if (job.approval_type === 'completion') {
    if (job.decision === 'approved') return job.completion_approved_at;
    if (job.decision === 'rejected') return job.completion_rejected_at;
    return job.completion_submitted_at ?? job.created_at;
  }
  // budget type
  if (job.decision === 'approved') return job.approved_at;
  if (job.decision === 'rejected') return job.approval_rejected_at;
  return job.approval_submitted_at ?? job.created_at;
}

function getDecidedBy(job: ApprovalJob): string | null {
  if (job.approval_type === 'completion') {
    if (job.decision === 'approved') return job.completion_approved_by_user?.full_name ?? null;
    if (job.decision === 'rejected') return job.completion_rejected_by_user?.full_name ?? null;
    return job.pic?.full_name ?? null;
  }
  // budget type
  if (job.decision === 'approved') return job.approved_by_user?.full_name ?? null;
  if (job.decision === 'rejected') return job.rejected_by_user?.full_name ?? null;
  return job.pic?.full_name ?? null;
}

function getRejectionReason(job: ApprovalJob): string | null {
  if (job.approval_type === 'completion') return job.completion_rejection_reason;
  return job.approval_rejection_reason;
}

// ============================================================================
// ApprovalQueue
// ============================================================================

export function ApprovalQueue({
  jobs,
  initialViewId,
  currentUserId,
  currentUserRole,
}: ApprovalQueueProps) {
  const [pendingOnly, setPendingOnly] = useState(false);
  const [viewJobId, setViewJobId] = useState<string | null>(initialViewId ?? null);

  // Sort by date descending (newest first)
  const sortedJobs = [...jobs].sort((a, b) => {
    const dateA = getDecisionDate(a) ?? '';
    const dateB = getDecisionDate(b) ?? '';
    return dateB.localeCompare(dateA);
  });

  const visibleJobs = pendingOnly
    ? sortedJobs.filter((j) => j.decision === 'pending')
    : sortedJobs;

  const pendingCount = jobs.filter((j) => j.decision === 'pending').length;

  // Deduplicated job IDs for prev/next navigation in modal
  const jobIds = [...new Set(visibleJobs.map((j) => j.id))];

  return (
    <div className="space-y-4">
      {/* Filter checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="pending-only"
          checked={pendingOnly}
          onCheckedChange={(checked) => setPendingOnly(checked === true)}
        />
        <Label htmlFor="pending-only" className="cursor-pointer text-sm font-normal">
          Show pending only
        </Label>
      </div>

      {/* Table */}
      {visibleJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {pendingOnly ? 'No jobs awaiting approval' : 'No approval records found'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingOnly
              ? 'Jobs submitted for budget or completion approval will appear here.'
              : 'No jobs have been submitted for approval yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Job ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[130px]">Type</TableHead>
                <TableHead className="w-[180px]">Estimated Cost</TableHead>
                <TableHead className="w-[160px]">PIC</TableHead>
                <TableHead className="w-[130px]">Status</TableHead>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleJobs.map((job) => {
                const dateLabel =
                  job.decision === 'pending'
                    ? formatDate(getDecisionDate(job))
                    : formatDate(getDecisionDate(job));
                const decidedBy = getDecidedBy(job);
                const rejectionReason = getRejectionReason(job);

                return (
                  <TableRow key={`${job.id}-${job.approval_type}`}>
                    <TableCell>
                      <DisplayId className="text-sm font-medium">{job.display_id}</DisplayId>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{job.title}</div>
                      {job.decision === 'rejected' && rejectionReason && (
                        <div className="text-xs text-red-600 mt-0.5 max-w-xs truncate">
                          Reason: {rejectionReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${APPROVAL_TYPE_COLORS[job.approval_type] ?? 'bg-gray-100 text-gray-700'} border-0 whitespace-nowrap`}>
                        {APPROVAL_TYPE_LABELS[job.approval_type] ?? job.approval_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {job.estimated_cost != null ? formatIDR(job.estimated_cost) : '\u2014'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {job.decision === 'pending' ? (
                        job.pic?.full_name ?? (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )
                      ) : (
                        decidedBy ?? <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${APPROVAL_DECISION_COLORS[job.decision] ?? 'bg-gray-100 text-gray-700'} border-0`}>
                        {APPROVAL_DECISION_LABELS[job.decision] ?? job.decision}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dateLabel}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="text-blue-600 hover:underline font-normal h-auto p-0"
                        onClick={() => setViewJobId(job.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary line */}
      {pendingCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {pendingCount} pending {pendingCount === 1 ? 'approval' : 'approvals'}
          {!pendingOnly && ` out of ${jobs.length} total`}.
        </p>
      )}

      {/* Job view modal */}
      <JobViewModal
        jobId={viewJobId}
        onOpenChange={(open) => {
          if (!open) setViewJobId(null);
        }}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onActionSuccess={() => {
          // Refresh is handled internally by the modal
        }}
        jobIds={jobIds}
        onNavigate={setViewJobId}
      />
    </div>
  );
}
