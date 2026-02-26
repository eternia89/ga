import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { ApprovalQueue } from '@/components/approvals/approval-queue';
import type { ApprovalJob } from '@/components/approvals/approval-queue';

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Only finance_approver and admin can access this page
  if (!['finance_approver', 'admin'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch ALL jobs that are pending budget approval OR have a budget decision (approved/rejected)
  // OR pending completion approval OR have a completion decision
  const { data: rawJobs } = await supabase
    .from('jobs')
    .select(
      `id,
       display_id,
       title,
       estimated_cost,
       status,
       approval_submitted_at,
       approved_at,
       approval_rejected_at,
       approval_rejection_reason,
       completion_submitted_at,
       completion_approved_at,
       completion_rejected_at,
       completion_rejection_reason,
       completion_approved_by,
       completion_rejected_by,
       created_at,
       pic:user_profiles!assigned_to(full_name),
       approved_by_user:user_profiles!approved_by(full_name),
       rejected_by_user:user_profiles!approval_rejected_by(full_name),
       job_requests(
         request:requests(display_id)
       )`
    )
    .or(
      'status.eq.pending_approval,status.eq.pending_completion_approval,approved_at.not.is.null,approval_rejected_at.not.is.null,completion_approved_at.not.is.null,completion_rejected_at.not.is.null'
    )
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch completion approver/rejecter names
  const completionApproverIds = [
    ...(rawJobs ?? []).map((j) => j.completion_approved_by).filter(Boolean),
    ...(rawJobs ?? []).map((j) => j.completion_rejected_by).filter(Boolean),
  ] as string[];

  const uniqueCompletionActorIds = [...new Set(completionApproverIds)];
  let completionActorMap: Record<string, string> = {};

  if (uniqueCompletionActorIds.length > 0) {
    const { data: completionActors } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', uniqueCompletionActorIds);

    if (completionActors) {
      completionActorMap = Object.fromEntries(
        completionActors.map((u) => [u.id, u.full_name ?? ''])
      );
    }
  }

  // Build ApprovalJob array — one entry per approval event on a job
  const jobs: ApprovalJob[] = [];

  for (const job of rawJobs ?? []) {
    const picNorm = Array.isArray(job.pic) ? job.pic[0] ?? null : job.pic ?? null;
    const approvedByUserNorm = Array.isArray(job.approved_by_user)
      ? job.approved_by_user[0] ?? null
      : job.approved_by_user ?? null;
    const rejectedByUserNorm = Array.isArray(job.rejected_by_user)
      ? job.rejected_by_user[0] ?? null
      : job.rejected_by_user ?? null;
    const jobRequestsNorm = Array.isArray(job.job_requests)
      ? job.job_requests.map((jr: { request: { display_id: string } | { display_id: string }[] }) => ({
          request: Array.isArray(jr.request)
            ? (jr.request[0] as { display_id: string })
            : (jr.request as { display_id: string }),
        }))
      : [];

    const base = {
      id: job.id,
      display_id: job.display_id,
      title: job.title,
      estimated_cost: job.estimated_cost,
      status: job.status,
      approval_submitted_at: job.approval_submitted_at,
      approved_at: job.approved_at,
      approval_rejected_at: job.approval_rejected_at,
      approval_rejection_reason: job.approval_rejection_reason,
      completion_submitted_at: job.completion_submitted_at,
      completion_approved_at: job.completion_approved_at,
      completion_rejected_at: job.completion_rejected_at,
      completion_rejection_reason: job.completion_rejection_reason,
      created_at: job.created_at,
      pic: picNorm,
      approved_by_user: approvedByUserNorm,
      rejected_by_user: rejectedByUserNorm,
      completion_approved_by_user: job.completion_approved_by
        ? { full_name: completionActorMap[job.completion_approved_by] ?? '' }
        : null,
      completion_rejected_by_user: job.completion_rejected_by
        ? { full_name: completionActorMap[job.completion_rejected_by] ?? '' }
        : null,
      job_requests: jobRequestsNorm,
    };

    // Emit a budget approval row if this job has budget approval activity
    const hasBudgetActivity =
      job.status === 'pending_approval' ||
      job.approved_at !== null ||
      job.approval_rejected_at !== null;

    if (hasBudgetActivity) {
      jobs.push({
        ...base,
        approval_type: 'budget',
        decision:
          job.approved_at !== null
            ? 'approved'
            : job.approval_rejected_at !== null
              ? 'rejected'
              : 'pending',
      });
    }

    // Emit a completion approval row if this job has completion approval activity
    const hasCompletionActivity =
      job.status === 'pending_completion_approval' ||
      job.completion_approved_at !== null ||
      job.completion_rejected_at !== null;

    if (hasCompletionActivity) {
      jobs.push({
        ...base,
        approval_type: 'completion',
        decision:
          job.completion_approved_at !== null
            ? 'approved'
            : job.completion_rejected_at !== null
              ? 'rejected'
              : 'pending',
      });
    }
  }

  return (
    <div className="space-y-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Approvals</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review jobs pending budget or completion approval
        </p>
      </div>

      <ApprovalQueue jobs={jobs} />
    </div>
  );
}
