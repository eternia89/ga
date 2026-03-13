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

  // Fetch asset-type categories for create dialog
  const categoriesResult = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'asset')
    .is('deleted_at', null)
    .order('name');

  const assetCategories = categoriesResult.data;

  // Fetch all templates globally (templates are shared across companies)
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
          />
        )}
      </div>

      <TemplateList templates={templateList} userRole={profile.role} initialViewId={view} />
    </div>
  );
}
