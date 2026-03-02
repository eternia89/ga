import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { JobTable } from '@/components/jobs/job-table';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/export-button';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';

export default async function JobsPage() {
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

  // Build jobs query with role-based filtering
  let jobsQuery = supabase
    .from('jobs')
    .select(
      `id, display_id, title, status, priority, assigned_to, created_by,
       estimated_cost, created_at, updated_at, company_id,
       job_type, maintenance_schedule_id,
       location:locations(name),
       category:categories(name),
       pic:user_profiles!assigned_to(full_name),
       created_by_user:user_profiles!created_by(full_name),
       maintenance_schedule:maintenance_schedules(id, next_due_at, interval_type, interval_days),
       job_requests(request:requests(id, display_id, title, status))`
    )
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // General users and GA Staff only see jobs assigned to them
  if (['general_user', 'ga_staff'].includes(profile.role)) {
    jobsQuery = jobsQuery.eq('assigned_to', profile.id);
  }

  const [jobsResult, usersResult] = await Promise.all([
    jobsQuery,

    // GA Staff/Lead users for PIC filter
    supabase
      .from('user_profiles')
      .select('id, name:full_name')
      .eq('company_id', profile.company_id)
      .in('role', ['ga_staff', 'ga_lead'])
      .is('deleted_at', null)
      .order('full_name'),
  ]);

  const jobs = (jobsResult.data ?? []) as unknown as import('@/lib/types/database').JobWithRelations[];
  const users = usersResult.data ?? [];

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Jobs' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all company jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ga_lead', 'admin', 'finance_approver'].includes(profile.role) && (
            <ExportButton exportUrl="/api/exports/jobs" />
          )}
          {['ga_lead', 'admin'].includes(profile.role) && (
            <Button asChild size="sm">
              <Link href="/jobs/new">
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Link>
            </Button>
          )}
        </div>
      </div>

      <JobTable
        data={jobs}
        users={users}
        currentUserId={profile.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
