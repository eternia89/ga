import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RequestTable } from '@/components/requests/request-table';
import { ExportButton } from '@/components/export-button';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { RequestCreateDialog } from '@/components/requests/request-create-dialog';
import { OPERATIONAL_ROLES } from '@/lib/constants/roles';

interface PageProps {
  searchParams: Promise<{ view?: string; action?: string }>;
}

export default async function RequestsPage({ searchParams }: PageProps) {
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
    .select('id, company_id, role, division_id, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Role-based request query
  const requestQuery = supabase
    .from('requests')
    .select(
      '*, location:locations(name), category:categories(name), requester:user_profiles!requester_id(name:full_name, email), assigned_user:user_profiles!assigned_to(name:full_name, email), division:divisions(name)'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // General users only see their own requests
  if (profile.role === 'general_user') {
    requestQuery.eq('requester_id', profile.id);
  }
  // All other roles see all company requests (RLS enforces company isolation)

  // Fetch user's extra company access
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

  // Fetch all data in parallel
  const [requestsResult, categoriesResult, usersResult, locationsResult, extraCompaniesResult, allLocationsResult, primaryCompanyResult] = await Promise.all([
    requestQuery,
    supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'request')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('user_profiles')
      .select('id, name:full_name')
      .in('company_id', allAccessibleCompanyIds)
      .is('deleted_at', null)
      .order('full_name'),
    // Locations for the create dialog (all accessible companies)
    supabase
      .from('locations')
      .select('id, name')
      .in('company_id', allAccessibleCompanyIds)
      .is('deleted_at', null)
      .order('name'),
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

  const requests = requestsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const users = usersResult.data ?? [];
  const locations = locationsResult.data ?? [];
  const extraCompanies = extraCompaniesResult.data ?? [];
  const allLocations = allLocationsResult.data ?? [];
  const primaryCompanyName = primaryCompanyResult.data?.name ?? '';

  // Batch-fetch photos for all requests
  const requestIds = requests.map((r) => r.id);
  let photosByRequest: Record<string, { id: string; url: string; fileName: string }[]> = {};

  if (requestIds.length > 0) {
    const { data: attachments } = await supabase
      .from('media_attachments')
      .select('id, entity_id, file_name, file_path')
      .eq('entity_type', 'request')
      .in('entity_id', requestIds)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (attachments && attachments.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('request-photos')
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

      // Group by request ID
      photosByRequest = {};
      for (const photo of photosWithUrls) {
        if (!photosByRequest[photo.entityId]) {
          photosByRequest[photo.entityId] = [];
        }
        photosByRequest[photo.entityId].push({
          id: photo.id,
          url: photo.url,
          fileName: photo.fileName,
        });
      }
    }
  }

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Requests' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground mt-1">
            {profile.role === 'general_user'
              ? 'View and manage your submitted requests'
              : 'View and manage all company requests'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(OPERATIONAL_ROLES as readonly string[]).includes(profile.role) && (
            <ExportButton exportUrl="/api/exports/requests" />
          )}
          <RequestCreateDialog
            locations={locations}
            initialOpen={action === 'create'}
            extraCompanies={extraCompanies}
            allLocations={allLocations}
            primaryCompanyName={primaryCompanyName}
          />
        </div>
      </div>

      <RequestTable
        data={requests}
        categories={categories}
        users={users}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        photosByRequest={photosByRequest}
        initialViewId={view}
      />
    </div>
  );
}
