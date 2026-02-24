import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { ApprovalQueue } from '@/components/approvals/approval-queue';

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

  // Fetch pending jobs (pending tab)
  const { data: pendingJobs } = await supabase
    .from('jobs')
    .select(
      `*,
       location:locations(name),
       category:categories(name),
       pic:user_profiles!assigned_to(full_name),
       created_by_user:user_profiles!created_by(full_name),
       job_requests(
         request:requests(
           display_id,
           title,
           requester:user_profiles!requester_id(full_name)
         )
       )`
    )
    .eq('status', 'pending_approval')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('approval_submitted_at', { ascending: true });

  // Fetch history jobs (approved or rejected)
  const { data: historyJobs } = await supabase
    .from('jobs')
    .select(
      `*,
       pic:user_profiles!assigned_to(full_name),
       approved_by_user:user_profiles!approved_by(full_name),
       rejected_by_user:user_profiles!approval_rejected_by(full_name)`
    )
    .or('approved_at.not.is.null,approval_rejected_at.not.is.null')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50);

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
          Review jobs pending budget approval
        </p>
      </div>

      <ApprovalQueue
        pendingJobs={pendingJobs ?? []}
        historyJobs={historyJobs ?? []}
      />
    </div>
  );
}
