import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { JobForm } from '@/components/jobs/job-form';

interface NewJobPageProps {
  searchParams: Promise<{ request_id?: string }>;
}

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Only GA Lead and Admin can create jobs
  if (!['ga_lead', 'admin'].includes(profile.role)) {
    redirect('/jobs');
  }

  // Fetch all data in parallel
  const [locationsResult, categoriesResult, usersResult, requestsResult] = await Promise.all([
    // Active locations for this company
    supabase
      .from('locations')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('name'),

    // Categories (active only, global — not company-scoped)
    supabase
      .from('categories')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),

    // Active users in same company for PIC assignment
    supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('full_name'),

    // Eligible requests (triaged + in_progress) — include assigned_to for PIC filter
    supabase
      .from('requests')
      .select('id, display_id, title, priority, status, location_id, category_id, description, assigned_to')
      .eq('company_id', profile.company_id)
      .in('status', ['triaged', 'in_progress'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const locations = locationsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const users = usersResult.data ?? [];
  const rawEligibleRequests = requestsResult.data ?? [];

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

  // Optional prefill from ?request_id= query param
  let prefillRequest: {
    id: string;
    display_id: string;
    title: string;
    priority: string | null;
    location_id: string | null;
    category_id: string | null;
    description: string | null;
  } | null = null;

  if (params.request_id) {
    const { data: prefill } = await supabase
      .from('requests')
      .select('id, display_id, title, priority, location_id, category_id, description')
      .eq('id', params.request_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (prefill) {
      prefillRequest = prefill;
    }
  }

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Jobs', href: '/jobs' }, { label: 'New Job' }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Job</h1>
        <p className="text-muted-foreground mt-1">
          Create a job from a request or as a standalone task
        </p>
      </div>

      <JobForm
        locations={locations}
        categories={categories}
        users={users}
        eligibleRequests={eligibleRequests}
        requestJobLinks={requestJobLinks}
        prefillRequest={prefillRequest}
        mode="create"
      />
    </div>
  );
}
