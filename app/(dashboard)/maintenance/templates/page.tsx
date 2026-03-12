import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { TemplateList } from '@/components/maintenance/template-list';
import { TemplateCreateDialog } from '@/components/maintenance/template-create-dialog';
import type { MaintenanceTemplate } from '@/lib/types/maintenance';

interface PageProps {
  searchParams: Promise<{ view?: string; action?: string }>;
}

export default async function MaintenanceTemplatesPage({ searchParams }: PageProps) {
  const { view, action } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch user's extra company access
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

  // Fetch asset-type categories for create dialog, primary company name, and extra companies
  const [categoriesResult, primaryCompanyResult, extraCompaniesResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'asset')
      .is('deleted_at', null)
      .order('name'),
    // Primary company name for the always-visible Company field
    supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
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
  ]);

  const assetCategories = categoriesResult.data;
  const primaryCompanyName = primaryCompanyResult.data?.name ?? '';
  const extraCompanies = extraCompaniesResult.data ?? [];

  // Fetch all templates for this company with category join
  const { data: templates } = await supabase
    .from('maintenance_templates')
    .select(`
      id,
      company_id,
      category_id,
      name,
      description,
      checklist,
      is_active,
      deleted_at,
      created_at,
      updated_at,
      category:categories(name, type)
    `)
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  // Normalize: compute item_count, flatten category (Supabase returns as array)
  const templateList: MaintenanceTemplate[] = (templates ?? []).map((t) => ({
    ...t,
    checklist: (Array.isArray(t.checklist) ? t.checklist : []) as MaintenanceTemplate['checklist'],
    item_count: Array.isArray(t.checklist) ? t.checklist.length : 0,
    category: Array.isArray(t.category) ? t.category[0] ?? null : t.category ?? null,
  }));

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Maintenance', href: '/maintenance/templates' }, { label: 'Templates' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Templates</h1>
          <p className="text-muted-foreground mt-1">
            Define reusable maintenance checklists for assets
          </p>
        </div>
        {['ga_lead', 'admin'].includes(profile.role) && (
          <TemplateCreateDialog
            categories={assetCategories ?? []}
            initialOpen={action === 'create'}
            primaryCompanyName={primaryCompanyName}
            extraCompanies={extraCompanies}
          />
        )}
      </div>

      <TemplateList templates={templateList} userRole={profile.role} initialViewId={view} />
    </div>
  );
}
