import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { ScheduleDetail } from '@/components/maintenance/schedule-detail';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';
import type { PMJobRef } from '@/components/maintenance/schedule-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScheduleDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  // Fetch schedule with template and asset joins
  const { data: scheduleRaw } = await supabase
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
      template:maintenance_templates(name, checklist),
      asset:inventory_items(name, display_id)
    `)
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .single();

  if (!scheduleRaw) {
    notFound();
  }

  // Normalize Supabase FK array returns
  const templateRaw = Array.isArray(scheduleRaw.template) ? scheduleRaw.template[0] : scheduleRaw.template;
  const assetRaw = Array.isArray(scheduleRaw.asset) ? scheduleRaw.asset[0] : scheduleRaw.asset;

  const schedule: MaintenanceSchedule = {
    ...scheduleRaw,
    template: templateRaw
      ? { name: templateRaw.name, checklist: (templateRaw.checklist ?? []) as MaintenanceSchedule['template'] extends object ? MaintenanceSchedule['template']['checklist'] : never }
      : null,
    asset: assetRaw
      ? { name: assetRaw.name, display_id: assetRaw.display_id }
      : null,
  };

  // Fetch PM jobs generated from this schedule
  const { data: pmJobsRaw } = await supabase
    .from('jobs')
    .select('id, display_id, status, created_at')
    .eq('maintenance_schedule_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const pmJobs: PMJobRef[] = (pmJobsRaw ?? []).map((j) => ({
    id: j.id,
    display_id: j.display_id,
    status: j.status,
    created_at: j.created_at,
  }));

  // Build breadcrumb title
  const templateName = schedule.template?.name ?? 'Schedule';
  const assetName = schedule.asset?.name ?? '';
  const breadcrumbTitle = assetName
    ? `${templateName} - ${assetName}`
    : templateName;

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Maintenance', href: '/maintenance' }, { label: 'Schedules', href: '/maintenance' }, { label: breadcrumbTitle }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{templateName}</h1>
        {assetName && (
          <p className="text-muted-foreground mt-1">
            Asset:{' '}
            <Link
              href={`/inventory/${schedule.item_id}`}
              className="text-blue-600 hover:underline"
            >
              {assetName}
              {schedule.asset?.display_id && (
                <span className="text-muted-foreground ml-1">({schedule.asset.display_id})</span>
              )}
            </Link>
          </p>
        )}
      </div>

      <ScheduleDetail
        schedule={schedule}
        pmJobs={pmJobs}
        userRole={profile.role}
      />
    </div>
  );
}
