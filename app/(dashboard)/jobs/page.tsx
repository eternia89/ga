import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JobTable } from '@/components/jobs/job-table';
import { ExportButton } from '@/components/export-button';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { JobCreateDialog } from '@/components/jobs/job-create-dialog';

interface PageProps {
  searchParams: Promise<{ view?: string; action?: string }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const { view, action } = await searchParams;
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

  const [jobsResult, usersResult, locationsResult, allCategoriesResult, allUsersResult, eligibleRequestsResult] = await Promise.all([
    jobsQuery,

    // GA Staff/Lead users for PIC filter
    supabase
      .from('user_profiles')
      .select('id, name:full_name')
      .eq('company_id', profile.company_id)
      .in('role', ['ga_staff', 'ga_lead'])
      .is('deleted_at', null)
      .order('full_name'),

    // Locations for create dialog
    supabase
      .from('locations')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('name'),

    // All categories for create dialog
    supabase
      .from('categories')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),

    // All active users for PIC assignment in create dialog
    supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('full_name'),

    // Eligible requests (triaged + in_progress) for create dialog
    supabase
      .from('requests')
      .select('id, display_id, title, priority, status, location_id, category_id, description')
      .eq('company_id', profile.company_id)
      .in('status', ['triaged', 'in_progress'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const jobs = (jobsResult.data ?? []) as unknown as import('@/lib/types/database').JobWithRelations[];
  const users = usersResult.data ?? [];
  const formLocations = locationsResult.data ?? [];
  const formCategories = allCategoriesResult.data ?? [];
  const formUsers = allUsersResult.data ?? [];
  const eligibleRequests = eligibleRequestsResult.data ?? [];

  // Fetch job links for in_progress requests (for create dialog)
  const inProgressRequestIds = eligibleRequests
    .filter((r) => r.status === 'in_progress')
    .map((r) => r.id);

  let requestJobLinks: Record<string, string> = {};

  if (inProgressRequestIds.length > 0) {
    const { data: jobLinks } = await supabase
      .from('job_requests')
      .select('request_id, job:jobs(display_id)')
      .in('request_id', inProgressRequestIds);

    if (jobLinks) {
      for (const link of jobLinks) {
        const jobData = link.job as unknown as { display_id: string } | null;
        if (jobData?.display_id) {
          requestJobLinks[link.request_id] = jobData.display_id;
        }
      }
    }
  }

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
            <JobCreateDialog
              locations={formLocations}
              categories={formCategories}
              users={formUsers}
              eligibleRequests={eligibleRequests}
              requestJobLinks={requestJobLinks}
              initialOpen={action === 'create'}
            />
          )}
        </div>
      </div>

      <JobTable
        data={jobs}
        users={users}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        initialViewId={view}
      />
    </div>
  );
}
