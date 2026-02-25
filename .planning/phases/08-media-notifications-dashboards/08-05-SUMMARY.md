---
phase: 08-media-notifications-dashboards
plan: 05
subsystem: ui
tags: [recharts, dashboard, kpi, nuqs, date-fns, supabase]

# Dependency graph
requires:
  - phase: 07-preventive-maintenance
    provides: jobs table with status/created_at for overdue calculation
  - phase: 05-jobs-approvals
    provides: requests and jobs tables with statuses
  - phase: 04-requests
    provides: request status constants and RLS-scoped supabase client
provides:
  - KpiCard component with trend indicators and click navigation
  - DateRangeFilter component with presets and URL state sync
  - getDashboardKpis() query function with current vs previous period comparison
  - Operational dashboard page for ga_lead, admin, finance_approver roles
affects:
  - 08-06 (charts plan will add charts below the KPI cards section)

# Tech tracking
tech-stack:
  added: [recharts@3, shadcn/ui Card component]
  patterns: [parallel Supabase count queries, calculateTrend() utility, nuqs URL state for date range]

key-files:
  created:
    - components/dashboard/kpi-card.tsx
    - components/dashboard/date-range-filter.tsx
    - lib/dashboard/queries.ts
    - components/ui/card.tsx
  modified:
    - app/(dashboard)/page.tsx
    - package.json

key-decisions:
  - "KpiCard uses trendIsGood prop to invert color coding — up=red for backlog metrics (Open Requests, Untriaged, Overdue, Open Jobs), up=green for completion metrics"
  - "getDashboardKpis uses 10 parallel Supabase count queries for 5 KPIs (current + previous period each)"
  - "Previous period is calculated as equal duration shifted back from dateRange.from"
  - "Overdue Jobs heuristic: in_progress jobs older than 7 days (no explicit due_date column)"
  - "DateRangeFilter uses nuqs useQueryStates for from/to URL params — server component page reads them from searchParams"
  - "Operational roles (ga_lead, admin, finance_approver) see full dashboard; general_user and ga_staff see profile card"

patterns-established:
  - "KPI dashboard pattern: getDashboardKpis returns array of KpiItem with value/previousValue/href/trendIsGood"
  - "calculateTrend(current, previous) returns Trend {direction, percentage} — reusable utility"
  - "DateRangeFilter detects active preset by comparing format(range.from/to, 'yyyy-MM-dd') against stored params"

requirements-completed: [REQ-DASH-001]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 8 Plan 05: Dashboard KPI Cards Summary

**Recharts-powered operational dashboard with 5 KPI cards, trend indicators, and date range filter synced to URL via nuqs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T05:01:04Z
- **Completed:** 2026-02-25T05:04:35Z
- **Tasks:** 2
- **Files modified:** 6 (plus 1 new package install)

## Accomplishments
- Built KpiCard client component with TrendingUp/TrendingDown/Minus icons and configurable color coding via trendIsGood prop
- Built DateRangeFilter with Today/This Week/This Month/This Quarter/Custom presets synced to URL
- Created getDashboardKpis() running 10 parallel count queries for 5 KPIs with current vs previous period comparison
- Replaced placeholder dashboard with full operational dashboard for ga_lead/admin/finance_approver; simple profile card for other roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Install recharts, create KPI card and date range filter components** - `5b226f3` (feat)
2. **Task 2: Create dashboard queries and replace placeholder dashboard page** - `50f892c` (feat)

**Plan metadata:** (created in final commit)

## Files Created/Modified
- `components/dashboard/kpi-card.tsx` - Reusable KPI card with trend indicator, click navigation via router.push
- `components/dashboard/date-range-filter.tsx` - Preset + custom range filter, nuqs URL state sync
- `lib/dashboard/queries.ts` - getDashboardKpis() with parallel queries, calculateTrend() utility
- `app/(dashboard)/page.tsx` - Operational dashboard page with 5 KPI cards for admin/ga_lead/finance_approver
- `components/ui/card.tsx` - shadcn Card component (was missing, installed via shadcn add)
- `package.json` - Added recharts@3.7.0

## Decisions Made
- KpiCard uses a `trendIsGood` boolean prop to invert color semantics — for backlog metrics (Open Requests, Untriaged, Overdue Jobs, Open Jobs), "up" is red (bad); for Completed, "up" is green (good).
- Previous period is dynamically calculated as the same duration shifted back from dateRange.from — so a "This Month" date range compares to the equivalent span the month before.
- Overdue Jobs uses a 7-day age heuristic on `created_at` (no explicit due_date column in jobs table).
- shadcn Card component was not yet installed — installed via `npx shadcn@latest add card` (Rule 3 auto-fix).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing shadcn Card component**
- **Found during:** Task 1 (KpiCard component creation)
- **Issue:** `@/components/ui/card` import failed — Card was not in the installed shadcn components
- **Fix:** Ran `npx shadcn@latest add card --yes` to install the component
- **Files modified:** components/ui/card.tsx (created)
- **Verification:** TypeScript compiled without errors after installation
- **Committed in:** 5b226f3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing dependency)
**Impact on plan:** Auto-fix necessary for compilation. No scope creep.

## Issues Encountered
None beyond the missing Card component handled above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard KPI section complete and ready for 08-06 (charts) to add content below the KPI grid
- DateRangeFilter URL params (from/to) are already in place — charts plan can read the same searchParams
- KPI cards click to filtered list pages — those pages exist from phases 4 and 5

## Self-Check: PASSED

All created files verified:
- FOUND: components/dashboard/kpi-card.tsx
- FOUND: components/dashboard/date-range-filter.tsx
- FOUND: lib/dashboard/queries.ts
- FOUND: components/ui/card.tsx
- FOUND: commit 5b226f3 (Task 1)
- FOUND: commit 50f892c (Task 2)

---
*Phase: 08-media-notifications-dashboards*
*Completed: 2026-02-25*
