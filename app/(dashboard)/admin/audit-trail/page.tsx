import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { subDays } from 'date-fns';
import { AuditTrailTable } from '@/components/audit-trail/audit-trail-table';
import type { AuditLogRow } from '@/components/audit-trail/audit-trail-columns';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';

export default async function AuditTrailPage() {
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

  // Only admin and ga_lead can access audit trail
  if (profile.role !== 'admin' && profile.role !== 'ga_lead') {
    redirect('/unauthorized');
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  // Fetch audit logs (last 30 days, max 1000 entries)
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .gte('performed_at', thirtyDaysAgo.toISOString())
    .order('performed_at', { ascending: false })
    .limit(1000);

  // Fetch all company users for the user filter dropdown
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, full_name, email')
    .is('deleted_at', null)
    .order('full_name');

  const auditLogs = logs ?? [];
  const userList = users ?? [];

  // Build user lookup map for resolving names
  const userMap = new Map(userList.map((u) => [u.id, u]));

  // Collect unique record IDs for entities that have display IDs
  const requestIds: string[] = [];
  const jobIds: string[] = [];
  const assetIds: string[] = [];

  for (const log of auditLogs) {
    if (log.table_name === 'requests') requestIds.push(log.record_id);
    else if (log.table_name === 'jobs') jobIds.push(log.record_id);
    else if (log.table_name === 'inventory_items') assetIds.push(log.record_id);
  }

  // Batch-query display IDs for requests, jobs, and assets in parallel
  const [requestDisplayIds, jobDisplayIds, assetDisplayIds] = await Promise.all([
    requestIds.length > 0
      ? supabase
          .from('requests')
          .select('id, display_id')
          .in('id', requestIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    jobIds.length > 0
      ? supabase
          .from('jobs')
          .select('id, display_id')
          .in('id', jobIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    assetIds.length > 0
      ? supabase
          .from('inventory_items')
          .select('id, display_id')
          .in('id', assetIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
  ]);

  // Build display ID lookup maps
  const displayIdMap = new Map<string, string>();
  for (const r of requestDisplayIds) displayIdMap.set(r.id, r.display_id);
  for (const j of jobDisplayIds) displayIdMap.set(j.id, j.display_id);
  for (const a of assetDisplayIds) displayIdMap.set(a.id, a.display_id);

  // Enrich log entries with user names and display IDs
  const enrichedLogs: AuditLogRow[] = auditLogs.map((log) => {
    const logUser = log.user_id ? userMap.get(log.user_id) : null;
    return {
      id: log.id,
      table_name: log.table_name,
      record_id: log.record_id,
      operation: log.operation,
      old_data: log.old_data as Record<string, unknown> | null,
      new_data: log.new_data as Record<string, unknown> | null,
      user_id: log.user_id ?? null,
      user_email: logUser?.email ?? log.user_email ?? null,
      performed_at: log.performed_at,
      company_id: log.company_id ?? null,
      user_full_name: logUser?.full_name ?? null,
      record_display_id: displayIdMap.get(log.record_id) ?? null,
    };
  });

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings', href: '/admin/settings' }, { label: 'Audit Trail' }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground mt-1">
          View system activity logs for the last 30 days
        </p>
      </div>

      <AuditTrailTable data={enrichedLogs} users={userList} />
    </div>
  );
}
