import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AssetSubmitForm } from '@/components/assets/asset-submit-form';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { GA_ROLES } from '@/lib/constants/roles';

export default async function NewAssetPage() {
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

  // Only ga_staff, ga_lead, and admin can create assets
  if (!(GA_ROLES as readonly string[]).includes(profile.role)) {
    redirect('/inventory');
  }

  // Fetch user's extra company access for multi-company scoping
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

  // Fetch asset-type categories only
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'asset')
    .is('deleted_at', null)
    .order('name');

  // Fetch active locations (all accessible companies) and primary company name in parallel
  const [locationsResult, primaryCompanyResult] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name')
      .in('company_id', allAccessibleCompanyIds)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single(),
  ]);

  const locations = locationsResult.data;
  const primaryCompanyName = primaryCompanyResult.data?.name ?? '';

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Assets', href: '/inventory' }, { label: 'New Asset' }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Asset</h1>
        <p className="text-muted-foreground mt-1">
          Register a new asset with condition photos and optional invoice attachments
        </p>
      </div>

      <AssetSubmitForm
        categories={categories ?? []}
        locations={locations ?? []}
        primaryCompanyName={primaryCompanyName}
        primaryCompanyId={profile.company_id ?? ''}
      />
    </div>
  );
}
