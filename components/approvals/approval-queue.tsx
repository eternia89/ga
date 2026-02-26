'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
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
}

// ============================================================================
// Helpers
// ============================================================================

function formatIDR(amount: number | null): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'dd-MM-yyyy');
}

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

export function ApprovalQueue({ jobs }: ApprovalQueueProps) {
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);

  // Sort: pending first, then by date descending
  const sortedJobs = [...jobs].sort((a, b) => {
    if (a.decision === 'pending' && b.decision !== 'pending') return -1;
    if (a.decision !== 'pending' && b.decision === 'pending') return 1;
    // Within same group, sort by relevant date descending
    const dateA = getDecisionDate(a) ?? '';
    const dateB = getDecisionDate(b) ?? '';
    return dateB.localeCompare(dateA);
  });

  const visibleJobs = showHistory
    ? sortedJobs
    : sortedJobs.filter((j) => j.decision === 'pending');

  const pendingCount = jobs.filter((j) => j.decision === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Filter checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-history"
          checked={showHistory}
          onCheckedChange={(checked) => setShowHistory(checked === true)}
        />
        <Label htmlFor="show-history" className="cursor-pointer text-sm font-normal">
          Show approved history
        </Label>
      </div>

      {/* Table */}
      {visibleJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {showHistory ? 'No approval records found' : 'No jobs awaiting approval'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {showHistory
              ? 'No jobs have been submitted for approval yet.'
              : 'Jobs submitted for budget or completion approval will appear here.'}
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
                  <TableRow
                    key={`${job.id}-${job.approval_type}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {job.display_id}
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
                      {job.approval_type === 'budget' ? (
                        <Badge className="bg-purple-100 text-purple-700 border-0 whitespace-nowrap">
                          Budget
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 border-0 whitespace-nowrap">
                          Completion
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-base">
                        {formatIDR(job.estimated_cost)}
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
                      {job.decision === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-0">
                          Pending
                        </Badge>
                      )}
                      {job.decision === 'approved' && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          Approved
                        </Badge>
                      )}
                      {job.decision === 'rejected' && (
                        <Badge className="bg-red-100 text-red-700 border-0">
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dateLabel}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary line */}
      {pendingCount > 0 && !showHistory && (
        <p className="text-xs text-muted-foreground">
          Showing {pendingCount} pending{' '}
          {pendingCount === 1 ? 'approval' : 'approvals'}.{' '}
          <button
            type="button"
            className="underline hover:no-underline"
            onClick={() => setShowHistory(true)}
          >
            Show history
          </button>
        </p>
      )}
    </div>
  );
}
