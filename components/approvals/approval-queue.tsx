'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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

type PendingJob = {
  id: string;
  display_id: string;
  title: string;
  estimated_cost: number | null;
  approval_submitted_at: string | null;
  created_at: string;
  pic?: { full_name: string } | null;
  created_by_user?: { full_name: string } | null;
  job_requests?: Array<{
    request: {
      display_id: string;
      title: string;
      requester?: { full_name: string } | null;
    };
  }>;
};

type HistoryJob = {
  id: string;
  display_id: string;
  title: string;
  estimated_cost: number | null;
  approved_at: string | null;
  approval_rejected_at: string | null;
  approval_rejection_reason: string | null;
  approved_by_user?: { full_name: string } | null;
  rejected_by_user?: { full_name: string } | null;
};

interface ApprovalQueueProps {
  pendingJobs: PendingJob[];
  historyJobs: HistoryJob[];
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

// ============================================================================
// ApprovalQueue
// ============================================================================

export function ApprovalQueue({ pendingJobs, historyJobs }: ApprovalQueueProps) {
  const router = useRouter();

  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">
          Pending
          {pendingJobs.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingJobs.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      {/* ------------------------------------------------------------------ */}
      {/* PENDING TAB                                                         */}
      {/* ------------------------------------------------------------------ */}
      <TabsContent value="pending" className="mt-4">
        {pendingJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No jobs awaiting approval
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Jobs submitted for budget approval will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Job ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[180px]">Estimated Cost</TableHead>
                  <TableHead className="w-[160px]">PIC</TableHead>
                  <TableHead className="w-[180px]">Linked Requests</TableHead>
                  <TableHead className="w-[130px]">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingJobs.map((job) => {
                  const linkedRequests = job.job_requests ?? [];
                  const requesterName =
                    linkedRequests[0]?.request?.requester?.full_name ?? null;

                  return (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {job.display_id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{job.title}</div>
                        {requesterName && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Requester: {requesterName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-base">
                          {formatIDR(job.estimated_cost)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.pic?.full_name ?? (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {linkedRequests.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {linkedRequests.map((jr, idx) => (
                              <span
                                key={idx}
                                className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded"
                              >
                                {jr.request.display_id}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(job.approval_submitted_at ?? job.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      {/* HISTORY TAB                                                         */}
      {/* ------------------------------------------------------------------ */}
      <TabsContent value="history" className="mt-4">
        {historyJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No approval history yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Past approval decisions will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Job ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[160px]">Estimated Cost</TableHead>
                  <TableHead className="w-[120px]">Decision</TableHead>
                  <TableHead className="w-[160px]">Decided By</TableHead>
                  <TableHead className="w-[130px]">Decision Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyJobs.map((job) => {
                  const isApproved = job.approved_at !== null;
                  const decisionDate = isApproved
                    ? job.approved_at
                    : job.approval_rejected_at;
                  const decidedBy = isApproved
                    ? job.approved_by_user?.full_name
                    : job.rejected_by_user?.full_name;

                  return (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {job.display_id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{job.title}</div>
                        {!isApproved && job.approval_rejection_reason && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-0.5 max-w-xs truncate">
                            Reason: {job.approval_rejection_reason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatIDR(job.estimated_cost)}
                      </TableCell>
                      <TableCell>
                        {isApproved ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {decidedBy ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(decisionDate ?? null)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
