import { type SupabaseClient } from '@supabase/supabase-js';
import { subDays, differenceInDays, startOfMonth } from 'date-fns';
import { STATUS_LABELS, REQUEST_STATUSES } from '@/lib/constants/request-status';
import { JOB_STATUS_LABELS } from '@/lib/constants/job-status';

// Hex color palette for status distribution charts (recharts needs hex, not Tailwind classes)
const STATUS_HEX_COLORS: Record<string, string> = {
  submitted: '#9ca3af',       // gray
  triaged: '#60a5fa',         // blue
  in_progress: '#fbbf24',     // amber
  pending_acceptance: '#a78bfa', // violet
  accepted: '#4ade80',        // green
  closed: '#a8a29e',          // stone
  rejected: '#f87171',        // red
  cancelled: '#a8a29e',       // stone
};

const JOB_STATUS_HEX_COLORS: Record<string, string> = {
  created: '#9ca3af',         // gray
  assigned: '#60a5fa',        // blue
  in_progress: '#fbbf24',     // amber
  pending_approval: '#a78bfa', // violet
  pending_completion_approval: '#a78bfa', // violet
  completed: '#4ade80',       // green
  cancelled: '#a8a29e',       // stone
};


export interface DashboardDateRange {
  from: string; // ISO date string (yyyy-MM-dd)
  to: string;   // ISO date string (yyyy-MM-dd)
}

export interface KpiItem {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  href: string;
  trendIsGood: boolean;
}

export interface Trend {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
}

export function calculateTrend(current: number, previous: number): Trend {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'flat',
      percentage: 0,
    };
  }
  const change = current - previous;
  const percentage = Math.abs(Math.round((change / previous) * 100));
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  return { direction, percentage };
}

function getPreviousRange(dateRange: DashboardDateRange): DashboardDateRange {
  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);
  const duration = to.getTime() - from.getTime();
  const durationDays = Math.round(duration / (1000 * 60 * 60 * 24));

  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, durationDays);

  return {
    from: prevFrom.toISOString().split('T')[0],
    to: prevTo.toISOString().split('T')[0],
  };
}

export async function getDashboardKpis(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  dateRange: DashboardDateRange
): Promise<{ data: KpiItem[]; hasError: boolean }> {
  const prevRange = getPreviousRange(dateRange);

  // Build ISO timestamps for the date range (inclusive)
  const currentFrom = `${dateRange.from}T00:00:00.000Z`;
  const currentTo = `${dateRange.to}T23:59:59.999Z`;
  const prevFrom = `${prevRange.from}T00:00:00.000Z`;
  const prevTo = `${prevRange.to}T23:59:59.999Z`;

  // Overdue threshold: jobs in_progress for more than 7 days
  const overdueThreshold = subDays(new Date(), 7).toISOString();

  // Run all count queries in parallel
  const [
    openRequestsResult,
    openRequestsPrevResult,
    untriagedResult,
    untriagedPrevResult,
    overdueJobsResult,
    overdueJobsPrevResult,
    openJobsResult,
    openJobsPrevResult,
    completedResult,
    completedPrevResult,
  ] = await Promise.all([
    // Open Requests (current)
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'triaged', 'in_progress'])
      .is('deleted_at', null),

    // Open Requests (previous period — use created_at in range)
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'triaged', 'in_progress'])
      .is('deleted_at', null)
      .gte('created_at', prevFrom)
      .lte('created_at', prevTo),

    // Untriaged Requests (current)
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .is('deleted_at', null),

    // Untriaged Requests (previous period)
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .is('deleted_at', null)
      .gte('created_at', prevFrom)
      .lte('created_at', prevTo),

    // Overdue Jobs (current — in_progress > 7 days old)
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress')
      .lt('created_at', overdueThreshold)
      .is('deleted_at', null),

    // Overdue Jobs (previous period)
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress')
      .lt('created_at', subDays(new Date(prevRange.to), 7).toISOString())
      .is('deleted_at', null)
      .gte('created_at', prevFrom)
      .lte('created_at', prevTo),

    // Open Jobs (current)
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['created', 'assigned', 'in_progress'])
      .is('deleted_at', null),

    // Open Jobs (previous period)
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['created', 'assigned', 'in_progress'])
      .is('deleted_at', null)
      .gte('created_at', prevFrom)
      .lte('created_at', prevTo),

    // Completed This Period (requests with accepted/completed status, updated_at in range)
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['accepted', 'closed'])
      .is('deleted_at', null)
      .gte('updated_at', currentFrom)
      .lte('updated_at', currentTo),

    // Completed Previous Period
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['accepted', 'closed'])
      .is('deleted_at', null)
      .gte('updated_at', prevFrom)
      .lte('updated_at', prevTo),
  ]);

  const hasError = [
    openRequestsResult, openRequestsPrevResult,
    untriagedResult, untriagedPrevResult,
    overdueJobsResult, overdueJobsPrevResult,
    openJobsResult, openJobsPrevResult,
    completedResult, completedPrevResult,
  ].some((r) => r.error != null);

  const openRequests = openRequestsResult.count ?? 0;
  const openRequestsPrev = openRequestsPrevResult.count ?? 0;
  const untriaged = untriagedResult.count ?? 0;
  const untriagedPrev = untriagedPrevResult.count ?? 0;
  const overdueJobs = overdueJobsResult.count ?? 0;
  const overdueJobsPrev = overdueJobsPrevResult.count ?? 0;
  const openJobs = openJobsResult.count ?? 0;
  const openJobsPrev = openJobsPrevResult.count ?? 0;
  const completed = completedResult.count ?? 0;
  const completedPrev = completedPrevResult.count ?? 0;

  return { data: [
    {
      id: 'open-requests',
      title: 'Open Requests',
      value: openRequests,
      previousValue: openRequestsPrev,
      href: '/requests?status=submitted,triaged,in_progress',
      trendIsGood: false, // up is bad (more open requests = worse)
    },
    {
      id: 'untriaged',
      title: 'Untriaged',
      value: untriaged,
      previousValue: untriagedPrev,
      href: '/requests?status=submitted',
      trendIsGood: false, // up is bad
    },
    {
      id: 'overdue-jobs',
      title: 'Overdue Jobs',
      value: overdueJobs,
      previousValue: overdueJobsPrev,
      href: '/jobs?overdue=true',
      trendIsGood: false, // up is bad
    },
    {
      id: 'open-jobs',
      title: 'Open Jobs',
      value: openJobs,
      previousValue: openJobsPrev,
      href: '/jobs?status=created,assigned,in_progress',
      trendIsGood: false, // up is bad (growing backlog)
    },
    {
      id: 'completed',
      title: 'Completed',
      value: completed,
      previousValue: completedPrev,
      href: '/requests?status=accepted,closed',
      trendIsGood: true, // up is good (more completions = better)
    },
  ], hasError };
}

// -------------------------------------------------------------------------
// Status Distribution
// -------------------------------------------------------------------------

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  color: string;
}

export async function getRequestStatusDistribution(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  dateRange: DashboardDateRange
): Promise<{ data: StatusDistributionItem[]; hasError: boolean }> {
  const from = `${dateRange.from}T00:00:00.000Z`;
  const to = `${dateRange.to}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('requests')
    .select('status')
    .is('deleted_at', null)
    .gte('created_at', from)
    .lte('created_at', to);

  if (error || !data) return { data: [], hasError: !!error };

  // Count per status
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  // Map to display items, filter to statuses with count > 0
  return {
    data: REQUEST_STATUSES
      .map((status) => ({
        status,
        label: STATUS_LABELS[status] ?? status,
        count: counts[status] ?? 0,
        color: STATUS_HEX_COLORS[status] ?? '#9ca3af',
      }))
      .filter((item) => item.count > 0),
    hasError: false,
  };
}

export async function getJobStatusDistribution(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  dateRange: DashboardDateRange
): Promise<{ data: StatusDistributionItem[]; hasError: boolean }> {
  const from = `${dateRange.from}T00:00:00.000Z`;
  const to = `${dateRange.to}T23:59:59.999Z`;

  const jobStatuses = ['created', 'assigned', 'in_progress', 'completed', 'cancelled'] as const;

  const { data, error } = await supabase
    .from('jobs')
    .select('status')
    .is('deleted_at', null)
    .gte('created_at', from)
    .lte('created_at', to);

  if (error || !data) return { data: [], hasError: !!error };

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return {
    data: jobStatuses
      .map((status) => ({
        status,
        label: JOB_STATUS_LABELS[status] ?? status,
        count: counts[status] ?? 0,
        color: JOB_STATUS_HEX_COLORS[status] ?? '#9ca3af',
      }))
      .filter((item) => item.count > 0),
    hasError: false,
  };
}

// -------------------------------------------------------------------------
// Staff Workload
// -------------------------------------------------------------------------

export interface StaffWorkloadItem {
  staffId: string;
  staffName: string;
  activeJobs: number;
  completedThisMonth: number;
  overdue: number;
}

export async function getStaffWorkload(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<{ data: StaffWorkloadItem[]; hasError: boolean }> {
  // Fetch GA staff/leads
  const { data: staff, error: staffError } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('role', ['ga_staff', 'ga_lead'])
    .is('deleted_at', null);

  if (staffError || !staff || staff.length === 0) return { data: [], hasError: !!staffError };

  // Fetch all non-deleted jobs with assigned_to + status + created_at
  const overdueThreshold = subDays(new Date(), 7).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('assigned_to, status, created_at')
    .is('deleted_at', null)
    .in(
      'assigned_to',
      staff.map((s: { id: string }) => s.id)
    );

  if (jobsError || !jobs) return { data: [], hasError: !!jobsError };

  // Aggregate per staff member
  const staffMap = new Map<string, { full_name: string }>();
  for (const s of staff) {
    staffMap.set(s.id, { full_name: s.full_name });
  }

  const workload = new Map<
    string,
    { activeJobs: number; completedThisMonth: number; overdue: number }
  >();

  for (const s of staff) {
    workload.set(s.id, { activeJobs: 0, completedThisMonth: 0, overdue: 0 });
  }

  for (const job of jobs) {
    if (!job.assigned_to || !workload.has(job.assigned_to)) continue;
    const w = workload.get(job.assigned_to)!;

    if (['created', 'assigned', 'in_progress'].includes(job.status)) {
      w.activeJobs += 1;
      // Overdue: in_progress and older than 7 days
      if (job.status === 'in_progress' && job.created_at < overdueThreshold) {
        w.overdue += 1;
      }
    }

    if (job.status === 'completed' && job.created_at >= monthStart) {
      w.completedThisMonth += 1;
    }
  }

  return {
    data: staff.map((s: { id: string; full_name: string }) => ({
      staffId: s.id,
      staffName: s.full_name,
      ...workload.get(s.id)!,
    })),
    hasError: false,
  };
}

// -------------------------------------------------------------------------
// Request Aging
// -------------------------------------------------------------------------

export interface AgingBucket {
  bucket: string;
  count: number;
}

export async function getRequestAging(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<{ data: AgingBucket[]; hasError: boolean }> {
  const emptyBuckets: AgingBucket[] = [
    { bucket: '0-3 days', count: 0 },
    { bucket: '4-7 days', count: 0 },
    { bucket: '8-14 days', count: 0 },
    { bucket: '15+ days', count: 0 },
  ];

  // Open requests only
  const { data, error } = await supabase
    .from('requests')
    .select('created_at')
    .in('status', ['submitted', 'triaged', 'in_progress'])
    .is('deleted_at', null);

  if (error || !data) {
    return { data: emptyBuckets, hasError: !!error };
  }

  const now = new Date();
  const buckets = { '0-3': 0, '4-7': 0, '8-14': 0, '15+': 0 };

  for (const row of data) {
    const age = differenceInDays(now, new Date(row.created_at));
    if (age <= 3) buckets['0-3'] += 1;
    else if (age <= 7) buckets['4-7'] += 1;
    else if (age <= 14) buckets['8-14'] += 1;
    else buckets['15+'] += 1;
  }

  return {
    data: [
      { bucket: '0-3 days', count: buckets['0-3'] },
      { bucket: '4-7 days', count: buckets['4-7'] },
      { bucket: '8-14 days', count: buckets['8-14'] },
      { bucket: '15+ days', count: buckets['15+'] },
    ],
    hasError: false,
  };
}

// -------------------------------------------------------------------------
// Maintenance Summary
// -------------------------------------------------------------------------

export interface MaintenanceItem {
  id: string;
  assetName: string;
  templateName: string;
  dueDate: string;
  urgency: 'overdue' | 'due_this_week' | 'due_this_month';
}

export async function getMaintenanceSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<{ data: MaintenanceItem[]; hasError: boolean }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const in7Days = subDays(now, -7).toISOString(); // 7 days from now
  const in30Days = subDays(now, -30).toISOString(); // 30 days from now

  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select('id, next_due_at, assets(name), maintenance_templates(name)')
    .eq('is_active', true)
    .lte('next_due_at', in30Days)
    .order('next_due_at', { ascending: true });

  if (error || !data) return { data: [], hasError: !!error };

  const items: MaintenanceItem[] = [];

  for (const row of data) {
    const dueAt = row.next_due_at;
    if (!dueAt) continue;

    let urgency: MaintenanceItem['urgency'];
    if (dueAt < nowIso) {
      urgency = 'overdue';
    } else if (dueAt <= in7Days) {
      urgency = 'due_this_week';
    } else {
      urgency = 'due_this_month';
    }

    const assetName =
      Array.isArray(row.assets) ? row.assets[0]?.name : (row.assets as { name?: string } | null)?.name;
    const templateName =
      Array.isArray(row.maintenance_templates)
        ? row.maintenance_templates[0]?.name
        : (row.maintenance_templates as { name?: string } | null)?.name;

    items.push({
      id: row.id,
      assetName: assetName ?? 'Unknown Asset',
      templateName: templateName ?? 'Unknown Template',
      dueDate: dueAt,
      urgency,
    });
  }

  // Sort: overdue first, then due_this_week, then due_this_month
  const urgencyOrder = { overdue: 0, due_this_week: 1, due_this_month: 2 };
  items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return { data: items, hasError: false };
}

// -------------------------------------------------------------------------
// Inventory Counts
// -------------------------------------------------------------------------

export interface InventoryStatusCount {
  status: string;
  count: number;
}

export interface InventoryCategoryCount {
  category: string;
  count: number;
}

export interface InventoryCounts {
  byStatus: InventoryStatusCount[];
  byCategory: InventoryCategoryCount[];
}

const ASSET_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  under_repair: 'Under Repair',
  broken: 'Broken',
  sold_disposed: 'Sold/Disposed',
};

export async function getInventoryCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<{ data: InventoryCounts; hasError: boolean }> {
  const [statusResult, categoryResult] = await Promise.all([
    supabase
      .from('inventory_items')
      .select('status')
      .is('deleted_at', null),
    supabase
      .from('inventory_items')
      .select('categories(name)')
      .is('deleted_at', null),
  ]);

  // By status
  const statusCounts: Record<string, number> = {};
  if (statusResult.data) {
    for (const row of statusResult.data) {
      statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
    }
  }

  const byStatus: InventoryStatusCount[] = Object.entries(ASSET_STATUS_LABELS).map(
    ([status, label]) => ({
      status: label,
      count: statusCounts[status] ?? 0,
    })
  );

  // By category
  const categoryCounts: Record<string, number> = {};
  if (categoryResult.data) {
    for (const row of categoryResult.data) {
      const catName =
        Array.isArray(row.categories)
          ? row.categories[0]?.name
          : (row.categories as { name?: string } | null)?.name;
      const key = catName ?? 'Uncategorized';
      categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
    }
  }

  const byCategory: InventoryCategoryCount[] = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const hasError = !!(statusResult.error || categoryResult.error);
  return { data: { byStatus, byCategory }, hasError };
}
