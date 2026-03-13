import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { ExportButton } from '@/components/export-button';
import { ScheduleList } from '@/components/maintenance/schedule-list';
import { ScheduleCreateDialog } from '@/components/maintenance/schedule-create-dialog';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
import type { TemplateListItem, AssetListItem } from '@/components/maintenance/schedule-form';
import { getScheduleDisplayStatus } from '@/lib/constants/schedule-status';

interface PageProps {
  searchParams: Promise<{ view?: string; action?: string }>;
}

export default async function MaintenanceSchedulesPage({ searchParams }: PageProps) {
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

  // Fetch user's extra company access (must be before main queries)
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

  // Fetch all schedules for all accessible companies with template and asset joins
  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select(`
      id,
      company_id,
      item_id,
      template_id,
      assigned_to,
      interval_days,
      interval_type,
      last_completed_at,
      next_due_at,
      is_paused,
      paused_at,
      paused_reason,
      is_active,
      deleted_at,
      created_at,
      updated_at,
      template:maintenance_templates(name),
      asset:inventory_items(name, display_id)
    `)
    .in('company_id', allAccessibleCompanyIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch templates and assets for create dialog
  const [templatesResult, assetsResult, primaryCompanyResult, extraCompaniesResult] = await Promise.all([
    supabase
      .from('maintenance_templates')
      .select('id, name, category_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('inventory_items')
      .select('id, name, display_id, category_id')
      .in('company_id', allAccessibleCompanyIds)
      .neq('status', 'sold_disposed')
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

  const templateList: TemplateListItem[] = (templatesResult.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    category_id: t.category_id ?? null,
  }));

  const assetList: AssetListItem[] = (assetsResult.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    display_id: a.display_id,
    category_id: a.category_id ?? null,
  }));

  const primaryCompanyName = primaryCompanyResult.data?.name ?? '';
  const extraCompanies = extraCompaniesResult.data ?? [];

  // Normalize Supabase FK array returns and compute display_status
  const scheduleList: MaintenanceSchedule[] = (schedules ?? []).map((s) => {
    const templateRaw = Array.isArray(s.template) ? s.template[0] : s.template;
    const assetRaw = Array.isArray(s.asset) ? s.asset[0] : s.asset;

    return {
      ...s,
      template: templateRaw
        ? { name: templateRaw.name, checklist: [] }
        : null,
      asset: assetRaw
        ? { name: assetRaw.name, display_id: assetRaw.display_id }
        : null,
      display_status: getScheduleDisplayStatus({
        is_active: s.is_active ?? true,
        is_paused: s.is_paused ?? false,
        paused_reason: s.paused_reason ?? null,
      }),
    } as MaintenanceSchedule;
  });

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Maintenance', href: '/maintenance' }, { label: 'Schedules' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Schedules</h1>
          <p className="text-muted-foreground mt-1">
            View and manage maintenance schedules for company assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ga_lead', 'admin'].includes(profile.role) && (
            <ExportButton exportUrl="/api/exports/maintenance" />
          )}
          {['ga_lead', 'admin'].includes(profile.role) && (
            <ScheduleCreateDialog
              templates={templateList}
              assets={assetList}
              initialOpen={action === 'create'}
              primaryCompanyName={primaryCompanyName}
              extraCompanies={extraCompanies}
            />
          )}
        </div>
      </div>

      <ScheduleList schedules={scheduleList} userRole={profile.role} initialViewId={view} />
    </div>
  );
}
