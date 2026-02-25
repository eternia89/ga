import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ScheduleForm } from '@/components/maintenance/schedule-form';
import type { TemplateListItem, AssetListItem } from '@/components/maintenance/schedule-form';

interface PageProps {
  searchParams: Promise<{ template_id?: string; asset_id?: string }>;
}

export default async function NewSchedulePage({ searchParams }: PageProps) {
  const { template_id: defaultTemplateId, asset_id: defaultAssetId } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Only ga_lead and admin can create schedules
  if (!['ga_lead', 'admin'].includes(profile.role)) {
    redirect('/maintenance');
  }

  // Fetch active templates with category info
  const { data: templates } = await supabase
    .from('maintenance_templates')
    .select('id, name, category_id')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  // Fetch active assets (not sold_disposed) with category info
  const { data: assets } = await supabase
    .from('inventory_items')
    .select('id, name, display_id, category_id')
    .eq('company_id', profile.company_id)
    .neq('status', 'sold_disposed')
    .is('deleted_at', null)
    .order('name');

  const templateList: TemplateListItem[] = (templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    category_id: t.category_id ?? null,
  }));

  const assetList: AssetListItem[] = (assets ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    display_id: a.display_id,
    category_id: a.category_id ?? null,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/maintenance">Maintenance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/maintenance">Schedules</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Maintenance Schedule</h1>
        <p className="text-muted-foreground mt-1">
          Assign a maintenance template to an asset with a configurable interval
        </p>
      </div>

      <ScheduleForm
        templates={templateList}
        assets={assetList}
        defaultTemplateId={defaultTemplateId}
        defaultAssetId={defaultAssetId}
        mode="create"
      />
    </div>
  );
}
