import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  FileText,
  AlertCircle,
  Clock,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';
import { StatusBarChart } from '@/components/dashboard/status-bar-chart';
import { StaffWorkloadTable } from '@/components/dashboard/staff-workload-table';
import { RequestAgingTable } from '@/components/dashboard/request-aging-table';
import { MaintenanceSummary } from '@/components/dashboard/maintenance-summary';
import { InventorySummary } from '@/components/dashboard/inventory-summary';
import {
  getDashboardKpis,
  calculateTrend,
  getRequestStatusDistribution,
  getJobStatusDistribution,
  getStaffWorkload,
  getRequestAging,
  getMaintenanceSummary,
  getInventoryCounts,
} from '@/lib/dashboard/queries';

// Operational roles that see the full dashboard
const OPERATIONAL_ROLES = ['ga_lead', 'admin', 'finance_approver'];

const KPI_ICONS: Record<string, React.ReactNode> = {
  'open-requests': <FileText className="h-4 w-4" />,
  untriaged: <AlertCircle className="h-4 w-4" />,
  'overdue-jobs': <Clock className="h-4 w-4" />,
  'open-jobs': <Wrench className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
};

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  // Get user profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, divisions(name), companies(name)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Format role display
  const roleDisplay = profile.role
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Role badge color
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    ga_lead: 'bg-blue-100 text-blue-700',
    ga_staff: 'bg-green-100 text-green-700',
    finance_approver:
      'bg-yellow-100 text-yellow-700',
    general_user: 'bg-gray-100 text-gray-700',
  };

  const roleColor = roleColors[profile.role] || roleColors.general_user;
  const isOperational = OPERATIONAL_ROLES.includes(profile.role);

  // Parse date range from searchParams (default: This Month)
  const resolvedParams = await searchParams;
  const dateFrom =
    resolvedParams.from ?? format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const dateTo =
    resolvedParams.to ?? format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const dateRange = { from: dateFrom, to: dateTo };

  // Fetch all dashboard data in parallel for operational roles
  const [
    kpis,
    requestStatusData,
    jobStatusData,
    staffWorkloadData,
    agingData,
    maintenanceData,
    inventoryData,
  ] = isOperational
    ? await Promise.all([
        getDashboardKpis(supabase, dateRange),
        getRequestStatusDistribution(supabase, dateRange),
        getJobStatusDistribution(supabase, dateRange),
        getStaffWorkload(supabase),
        getRequestAging(supabase),
        getMaintenanceSummary(supabase),
        getInventoryCounts(supabase),
      ])
    : [[], [], [], [], [], [], { byStatus: [], byCategory: [] }];

  return (
    <div className="space-y-6 py-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4 max-md:flex-col">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isOperational
              ? 'Here is the current operational overview'
              : 'Welcome back to your dashboard'}
          </p>
        </div>

        {/* Date range filter — only for operational roles */}
        {isOperational && (
          <div className="shrink-0">
            <DateRangeFilter />
          </div>
        )}
      </div>

      {/* Operational dashboard */}
      {isOperational && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-5 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-4">
            {kpis.map((kpi) => {
              const trend = calculateTrend(kpi.value, kpi.previousValue);
              return (
                <KpiCard
                  key={kpi.id}
                  title={kpi.title}
                  value={kpi.value}
                  trend={trend}
                  href={kpi.href}
                  icon={KPI_ICONS[kpi.id]}
                  trendIsGood={kpi.trendIsGood}
                />
              );
            })}
          </div>

          {/* Two-column: charts + tables */}
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-6">
            {/* Left column: Request Status chart + Job Status chart */}
            <div className="space-y-6">
              <StatusBarChart
                data={requestStatusData}
                entityPath="requests"
                title="Request Status Distribution"
              />
              <StatusBarChart
                data={jobStatusData}
                entityPath="jobs"
                title="Job Status Distribution"
              />
            </div>

            {/* Right column: Staff Workload + Request Aging */}
            <div className="space-y-6">
              <StaffWorkloadTable data={staffWorkloadData} />
              <RequestAgingTable data={agingData} />
            </div>
          </div>

          {/* Full-width row: Maintenance + Inventory side by side */}
          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-6">
            <MaintenanceSummary data={maintenanceData} />
            <InventorySummary data={inventoryData} />
          </div>
        </>
      )}

      {/* Simple welcome card for general users and GA staff */}
      {!isOperational && (
        <div className="bg-muted/40 border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Your Profile
          </h2>
          <dl className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="text-sm font-medium text-foreground">
                {profile.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Role</dt>
              <dd>
                <span
                  className={`text-sm px-2 py-1 rounded ${roleColor} inline-block`}
                >
                  {roleDisplay}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Company</dt>
              <dd className="text-sm font-medium text-foreground">
                {profile.companies?.name || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Division</dt>
              <dd className="text-sm font-medium text-foreground">
                {profile.divisions?.name || 'Not assigned'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
