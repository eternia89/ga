import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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

    // Request categories (active only)
    supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'request')
      .is('deleted_at', null)
      .order('name'),

    // GA Staff and GA Lead users for PIC assignment
    supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('company_id', profile.company_id)
      .in('role', ['ga_staff', 'ga_lead'])
      .is('deleted_at', null)
      .order('full_name'),

    // Eligible requests (triaged status) — these can be linked to jobs
    // Also fetch already-linked requests (in_progress) with their job link info
    supabase
      .from('requests')
      .select('id, display_id, title, priority, status, location_id, category_id, description')
      .eq('company_id', profile.company_id)
      .in('status', ['triaged', 'in_progress'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const locations = locationsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const users = usersResult.data ?? [];
  const eligibleRequests = requestsResult.data ?? [];

  // Fetch job links for in_progress requests so we can show "(linked to JOB-XX-XXXX)"
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
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/jobs" className="hover:text-foreground transition-colors">
          Jobs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">New Job</span>
      </nav>

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
