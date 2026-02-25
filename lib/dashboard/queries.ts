import { type SupabaseClient } from '@supabase/supabase-js';
import { subDays } from 'date-fns';

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
): Promise<KpiItem[]> {
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
      .in('status', ['accepted', 'completed'])
      .is('deleted_at', null)
      .gte('updated_at', currentFrom)
      .lte('updated_at', currentTo),

    // Completed Previous Period
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['accepted', 'completed'])
      .is('deleted_at', null)
      .gte('updated_at', prevFrom)
      .lte('updated_at', prevTo),
  ]);

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

  return [
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
      href: '/requests?status=accepted,completed',
      trendIsGood: true, // up is good (more completions = better)
    },
  ];
}
