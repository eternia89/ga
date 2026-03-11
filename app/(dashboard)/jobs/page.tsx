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

  // Fetch user's extra company access
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

  const [jobsResult, usersResult, locationsResult, allCategoriesResult, allUsersResult, eligibleRequestsResult, budgetThresholdResult, extraCompaniesResult, allLocationsResult, primaryCompanyResult] = await Promise.all([
    jobsQuery,

    // GA Staff/Lead users for PIC filter
    supabase
      .from('user_profiles')
      .select('id, name:full_name')
      .eq('company_id', profile.company_id)
      .in('role', ['ga_staff', 'ga_lead'])
      .is('deleted_at', null)
      .order('full_name'),

    // Locations for create dialog (primary company)
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

    // Eligible requests (triaged + in_progress) for create dialog — include assigned_to for PIC filter
    supabase
      .from('requests')
      .select('id, display_id, title, priority, status, location_id, category_id, description, assigned_to')
      .eq('company_id', profile.company_id)
      .in('status', ['triaged', 'in_progress'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    // Budget threshold for create dialog
    supabase
      .from('company_settings')
      .select('value')
      .eq('company_id', profile.company_id)
      .eq('key', 'budget_threshold')
      .single(),

    // Companies for multi-company selector (only if user has extra access)
    extraCompanyIds.length > 0
      ? supabase
          .from('companies')
          .select('id, name')
          .in('id', allAccessibleCompanyIds)
          .is('deleted_at', null)
          .order('name')
      : Promise.resolve({ data: null }),

    // All locations across accessible companies (only if user has extra access)
    extraCompanyIds.length > 0
      ? supabase
          .from('locations')
          .select('id, name, company_id')
          .in('company_id', allAccessibleCompanyIds)
          .is('deleted_at', null)
          .order('name')
      : Promise.resolve({ data: null }),

    // Primary company name for the always-visible Company field
    supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single(),
  ]);

  const jobs = (jobsResult.data ?? []) as unknown as import('@/lib/types/database').JobWithRelations[];
  const users = usersResult.data ?? [];
  const formLocations = locationsResult.data ?? [];
  const formCategories = allCategoriesResult.data ?? [];
  const formUsers = allUsersResult.data ?? [];
  const rawEligibleRequests = eligibleRequestsResult.data ?? [];
  const companyBudgetThreshold = budgetThresholdResult.data ? parseInt(budgetThresholdResult.data.value, 10) : null;
  const extraCompanies = extraCompaniesResult.data ?? [];
  const allLocations = allLocationsResult.data ?? [];
  const primaryCompanyName = primaryCompanyResult.data?.name ?? '';

  // Rule 3: Exclude requests already linked to any job
  const { data: alreadyLinkedData } = await supabase
    .from('job_requests')
    .select('request_id');

  const alreadyLinkedIds = new Set((alreadyLinkedData ?? []).map((r) => r.request_id));
  const unlinkedRequests = rawEligibleRequests.filter((r) => !alreadyLinkedIds.has(r.id));

  // Rule 1: Only show requests where current user is PIC
  const eligibleRequests = unlinkedRequests.filter((r) => r.assigned_to === profile.id);

  // No already-linked requests will appear in create mode, so requestJobLinks is empty
  const requestJobLinks: Record<string, string> = {};

  // Batch-fetch job photos from media_attachments
  let photosByJob: Record<string, { id: string; url: string; fileName: string }[]> = {};

  if (jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id);

    const { data: attachments } = await supabase
      .from('media_attachments')
      .select('id, entity_id, file_name, file_path')
      .eq('entity_type', 'job')
      .in('entity_id', jobIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (attachments && attachments.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('job-photos')
        .createSignedUrls(
          attachments.map((a) => a.file_path),
          21600
        );

      const photosWithUrls = attachments.map((a, i) => ({
        id: a.id,
        entityId: a.entity_id,
        url: signedUrls?.[i]?.signedUrl ?? '',
        fileName: a.file_name,
      }));

      for (const photo of photosWithUrls) {
        if (!photosByJob[photo.entityId]) {
          photosByJob[photo.entityId] = [];
        }
        photosByJob[photo.entityId].push({
          id: photo.id,
          url: photo.url,
          fileName: photo.fileName,
        });
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
          {['ga_lead', 'admin', 'ga_staff'].includes(profile.role) && (
            <JobCreateDialog
              locations={formLocations}
              categories={formCategories}
              users={formUsers}
              eligibleRequests={eligibleRequests}
              requestJobLinks={requestJobLinks}
              companyBudgetThreshold={companyBudgetThreshold}
              initialOpen={action === 'create'}
              extraCompanies={extraCompanies}
              allLocations={allLocations}
              primaryCompanyName={primaryCompanyName}
            />
          )}
        </div>
      </div>

      <JobTable
        data={jobs}
        users={users}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        photosByJob={photosByJob}
        initialViewId={view}
      />
    </div>
  );
}
