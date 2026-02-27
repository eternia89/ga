import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/export-button';
import { ScheduleList } from '@/components/maintenance/schedule-list';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
import { getScheduleDisplayStatus } from '@/lib/constants/schedule-status';

export default async function MaintenanceSchedulesPage() {
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

  // Fetch all schedules for this company with template and asset joins
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
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/maintenance">Maintenance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Schedules</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
            <Button asChild size="sm">
              <Link href="/maintenance/schedules/new">
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Link>
            </Button>
          )}
        </div>
      </div>

      <ScheduleList schedules={scheduleList} userRole={profile.role} />
    </div>
  );
}
