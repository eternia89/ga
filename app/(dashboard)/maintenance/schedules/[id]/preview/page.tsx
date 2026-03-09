import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { PMChecklistPreview } from '@/components/maintenance/pm-checklist-preview';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SchedulePreviewPage({ params }: PageProps) {
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

  // Fetch assigned user's name if assigned
  let assignedUserName: string | null = null;
  if (schedule.assigned_to) {
    const { data: assignedUser } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', schedule.assigned_to)
      .single();
    assignedUserName = assignedUser?.full_name ?? null;
  }

  const templateName = schedule.template?.name ?? 'Schedule';
  const assetName = schedule.asset?.name ?? '';
  const assetDisplayId = schedule.asset?.display_id ?? '';
  const checklistItems = schedule.template?.checklist ?? [];

  const breadcrumbTitle = assetName
    ? `${templateName} - ${assetName}`
    : templateName;

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs
        items={[
          { label: 'Maintenance', href: '/maintenance' },
          { label: 'Schedules', href: '/maintenance' },
          { label: breadcrumbTitle, href: `/maintenance/schedules/${id}` },
          { label: 'Preview Form' },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Preview Form</h1>
        <Link
          href={`/maintenance/schedules/${id}`}
          className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Back to Schedule
        </Link>
      </div>

      <PMChecklistPreview
        templateName={templateName}
        checklist={checklistItems}
        assetName={assetName}
        assetDisplayId={assetDisplayId}
        nextDueAt={schedule.next_due_at}
        assignedUserName={assignedUserName}
      />
    </div>
  );
}
