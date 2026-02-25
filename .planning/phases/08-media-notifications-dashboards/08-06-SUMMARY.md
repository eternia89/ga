---
phase: 08-media-notifications-dashboards
plan: 06
subsystem: ui
tags: [recharts, dashboard, charts, supabase, date-fns, tailwind]

# Dependency graph
requires:
  - phase: 08-05
    provides: KpiCard, DateRangeFilter, getDashboardKpis — base dashboard structure
  - phase: 05-jobs-approvals
    provides: jobs table with assigned_to, status, created_at for workload queries
  - phase: 04-requests
    provides: requests table and REQUEST_STATUSES constants
  - phase: 07-preventive-maintenance
    provides: maintenance_schedules table with next_due_at, is_active
  - phase: 06-inventory
    provides: inventory_items table with status and category_id
provides:
  - StatusBarChart component with recharts BarChart layout=vertical, click navigation
  - StaffWorkloadTable component with client-side sortable columns
  - RequestAgingTable component with 4-bucket display
  - MaintenanceSummary component with urgency-grouped list
  - InventorySummary component with by-status and by-category tables
  - getRequestStatusDistribution() query function
  - getJobStatusDistribution() query function
  - getStaffWorkload() query function
  - getRequestAging() query function
  - getMaintenanceSummary() query function
  - getInventoryCounts() query function
  - Updated dashboard page with full parallel data fetch and desktop-first grid
affects:
  - Phase 9 (polish) — all dashboard components are final output for operational roles

# Tech tracking
tech-stack:
  added: []
  patterns:
    - recharts BarChart with layout=vertical for horizontal status distribution bars
    - Parallel Promise.all server-side data fetching for 7 dashboard data sources
    - Status hex color palette (separate from Tailwind class map) for recharts Cell fills
    - Client-side sort with useState for column+direction in StaffWorkloadTable

key-files:
  created:
    - components/dashboard/status-bar-chart.tsx
    - components/dashboard/staff-workload-table.tsx
    - components/dashboard/request-aging-table.tsx
    - components/dashboard/maintenance-summary.tsx
    - components/dashboard/inventory-summary.tsx
  modified:
    - lib/dashboard/queries.ts
    - app/(dashboard)/page.tsx

key-decisions:
  - "STATUS_HEX_COLORS map added for recharts (parallel to STATUS_COLORS Tailwind map) — recharts Cell requires hex/rgb, not Tailwind class strings"
  - "Bar onClick uses any-typed barData parameter — recharts BarMouseEvent type does not include custom data fields from data array"
  - "getStaffWorkload fetches all jobs for ga_staff/ga_lead IDs in one query and aggregates in JS — avoids N+1 per-user queries"
  - "getMaintenanceSummary queries next_due_at <= 30 days from now and categorizes overdue/this_week/this_month in JS"
  - "getInventoryCounts uses two parallel queries (status group + category join) and aggregates in JS"
  - "Dashboard page fetches all 7 data sources via single Promise.all for operational roles"

patterns-established:
  - "Hex color palette pattern: maintain STATUS_HEX_COLORS alongside STATUS_COLORS for chart components that need raw color values"
  - "Dashboard layout pattern: desktop-first grid-cols-2 for charts/tables, full-width bottom row for summary cards"

requirements-completed: [REQ-DASH-002, REQ-DASH-003, REQ-DASH-004, REQ-DASH-005, REQ-DASH-006, REQ-DASH-007]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 8 Plan 06: Dashboard Visualizations Summary

**Recharts horizontal bar charts, sortable staff workload table, request aging buckets, maintenance urgency list, and inventory counts wired into a parallel-fetched operational dashboard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T05:07:53Z
- **Completed:** 2026-02-25T05:10:53Z
- **Tasks:** 2
- **Files modified:** 7 (5 new + 2 modified)

## Accomplishments
- StatusBarChart: recharts BarChart with layout=vertical renders horizontal bars per status, Cell fills from STATUS_HEX_COLORS map, click navigates to filtered list page
- StaffWorkloadTable: sortable client component with Active Jobs, Completed (Month), Overdue columns — overdue count shown in red when > 0
- RequestAgingTable: 4-bucket server component (0-3, 4-7, 8-14, 15+ days) with red emphasis on 15+ bucket if count > 0
- MaintenanceSummary: urgency-grouped list (overdue=red bg, due this week=yellow bg, due this month=normal) with dd-MM-yyyy dates
- InventorySummary: two-column grid with By Status and By Category tables
- 6 new query functions added to lib/dashboard/queries.ts
- Dashboard page upgraded to fetch all 7 data sources in parallel with Promise.all, full desktop-first responsive grid

## Task Commits

Each task was committed atomically:

1. **Task 1: Status bar charts, staff workload table, and query functions** - `c3daaf4` (feat)
2. **Task 2: Aging table, maintenance summary, inventory summary, dashboard wiring** - `404c377` (feat)

**Plan metadata:** (created in final commit)

## Files Created/Modified
- `components/dashboard/status-bar-chart.tsx` - Recharts horizontal bar chart with click navigation, per-bar Cell colors
- `components/dashboard/staff-workload-table.tsx` - Sortable table with useState for column/direction, red overdue count
- `components/dashboard/request-aging-table.tsx` - 4-bucket aging table, 15+ bucket red when non-zero
- `components/dashboard/maintenance-summary.tsx` - Urgency-grouped list with color-coded border/bg per urgency level
- `components/dashboard/inventory-summary.tsx` - Two-column grid: byStatus table + byCategory table
- `lib/dashboard/queries.ts` - Added 6 new query functions: getRequestStatusDistribution, getJobStatusDistribution, getStaffWorkload, getRequestAging, getMaintenanceSummary, getInventoryCounts
- `app/(dashboard)/page.tsx` - Full operational dashboard with 7 parallel data fetches and two-column + bottom-row layout

## Decisions Made
- STATUS_HEX_COLORS added alongside STATUS_COLORS: recharts Cell requires hex/rgb not Tailwind class strings, so a separate hex color map was needed.
- Bar onClick uses `any`-typed barData: recharts BarMouseEvent typing does not expose custom data array fields (status, label) at the type level, so `any` cast with runtime guard is the pragmatic solution.
- getStaffWorkload aggregates in JS after one bulk query (not N individual user queries) to avoid N+1 pattern.
- getMaintenanceSummary: urgency thresholds computed in JS relative to now — avoids complex DB date math.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed recharts Tooltip formatter type incompatibility**
- **Found during:** Task 1 (StatusBarChart creation)
- **Issue:** TypeScript error — formatter prop type was `(value: number) => [number, 'Count']` but recharts expects value to be `number | undefined`
- **Fix:** Removed explicit type annotation, let TypeScript infer from recharts' Formatter type
- **Files modified:** components/dashboard/status-bar-chart.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** c3daaf4 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed recharts Bar onClick type incompatibility**
- **Found during:** Task 1 (StatusBarChart onClick handler)
- **Issue:** TypeScript error — Bar onClick expects BarMouseEvent but custom StatusBarChartItem type was not assignable
- **Fix:** Used `any`-typed barData parameter with runtime status string guard
- **Files modified:** components/dashboard/status-bar-chart.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** c3daaf4 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — recharts TypeScript type incompatibilities)
**Impact on plan:** Both fixes necessary for compilation. No scope creep — same runtime behavior as planned.

## Issues Encountered
- recharts v3 TypeScript types for Bar.onClick and Tooltip.formatter are strict — needed minor adjustments to satisfy type checker while preserving intended runtime behavior.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete operational dashboard: KPI cards + status charts + staff workload + aging + maintenance + inventory
- All 6 DASH requirements (DASH-002 through DASH-007) addressed
- Dashboard is Phase 8 final output — Phase 9 (Polish & UAT) can proceed

## Self-Check: PASSED

All created files verified:
- FOUND: components/dashboard/status-bar-chart.tsx
- FOUND: components/dashboard/staff-workload-table.tsx
- FOUND: components/dashboard/request-aging-table.tsx
- FOUND: components/dashboard/maintenance-summary.tsx
- FOUND: components/dashboard/inventory-summary.tsx
- FOUND: commit c3daaf4 (Task 1)
- FOUND: commit 404c377 (Task 2)

---
*Phase: 08-media-notifications-dashboards*
*Completed: 2026-02-25*
