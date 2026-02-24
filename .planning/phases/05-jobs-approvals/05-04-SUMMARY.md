---
phase: 05-jobs-approvals
plan: 04
subsystem: ui
tags: [nextjs, react, typescript, supabase, shadcn-ui, approvals, company-settings]

# Dependency graph
requires:
  - phase: 05-01
    provides: job types, approval server actions, company_settings table
  - phase: 05-02
    provides: job detail page at /jobs/[id] for approve/reject actions
  - phase: 05-03
    provides: job detail actions (Approve/Reject) on job detail page

provides:
  - Approval queue page at /approvals with pending and history tabs
  - Company Settings page at /admin/company-settings with budget threshold form
  - getCompanySettings and updateCompanySetting server actions
  - Sidebar Jobs and Approvals items activated (built: true)
  - Sidebar Company Settings nav item added under Admin section

affects: [05-05-acceptance-cycle-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Approval queue tabs pattern: server-fetched data, client-side tab navigation with Tabs component
    - Company settings upsert pattern: select-then-insert-or-update (avoids Supabase upsert limitations)
    - Badge count on tab trigger: show pending count inline on Pending tab trigger

key-files:
  created:
    - app/(dashboard)/approvals/page.tsx
    - components/approvals/approval-queue.tsx
    - app/(dashboard)/admin/company-settings/page.tsx
    - components/admin/company-settings/company-settings-form.tsx
    - app/actions/company-settings-actions.ts
  modified:
    - components/sidebar.tsx
    - app/(dashboard)/requests/[id]/page.tsx

key-decisions:
  - "Approval queue uses simple HTML table (not TanStack) since data is pre-sorted server-side and no client filtering needed"
  - "updateCompanySetting uses select-then-insert/update pattern instead of Supabase upsert to avoid INSERT ON CONFLICT limitations"
  - "Company Settings page uses extensible card layout with sections for future settings to be added below budget threshold"
  - "LinkedJobRow type fix in requests/[id]/page.tsx: Supabase returns FK relations as arrays, cast via unknown to handle polymorphic type"

requirements-completed:
  - REQ-APR-001
  - REQ-APR-002
  - REQ-APR-004

# Metrics
duration: 4min
completed: 2026-02-25
---

# Phase 5 Plan 4: Approval Queue UI Summary

**Approval queue page at /approvals with pending/history tabs, budget threshold Company Settings page, and sidebar navigation activated for Jobs, Approvals, and Company Settings**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T22:49:24Z
- **Completed:** 2026-02-24T22:53:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Approval queue page at `/approvals` (finance_approver/admin only): fetches pending_approval jobs and approved/rejected history, displays with Tabs UI
- Pending tab shows job ID, title, IDR-formatted cost (prominent), PIC, linked request display IDs, submission date; row click navigates to /jobs/[id]
- History tab shows job ID, title, IDR cost, Approved/Rejected badge, decided-by name, decision date; rejection reason displayed below title
- Company Settings page at `/admin/company-settings` with budget threshold form using react-hook-form + zod validation
- `updateCompanySetting` server action with admin role check; `getCompanySettings` returns all settings as Record<string, string>
- Sidebar Jobs and Approvals items set to `built: true`; Company Settings nav item added to Admin section

## Task Commits

1. **Task 1: Approval queue page with pending and history tabs** - `4035246` (feat)
2. **Task 2: Company settings page, actions, and sidebar activation** - `fd27715` (feat)

## Files Created/Modified

- `app/(dashboard)/approvals/page.tsx` - Server component with role guard, parallel data fetch (pending + history jobs), breadcrumb
- `components/approvals/approval-queue.tsx` - Client component with Tabs (Pending/History), IDR formatting, row navigation to /jobs/[id]
- `app/(dashboard)/admin/company-settings/page.tsx` - Server component with admin role guard, fetches company settings, breadcrumb
- `components/admin/company-settings/company-settings-form.tsx` - Budget threshold form with Rp prefix, react-hook-form, InlineFeedback
- `app/actions/company-settings-actions.ts` - getCompanySettings + updateCompanySetting server actions (admin only)
- `components/sidebar.tsx` - Jobs built:false -> true, Approvals built:false -> true, added Company Settings nav item
- `app/(dashboard)/requests/[id]/page.tsx` - Fixed LinkedJobRow type to handle Supabase array return for FK relations

## Decisions Made

- Approval queue uses simple shadcn Table (not TanStack Table) since data is pre-sorted server-side and no client filtering is needed per the plan spec
- `updateCompanySetting` implements select-then-insert/update rather than Supabase `upsert()` for explicit control and error handling
- Company Settings form uses card layout with sections header to enable future settings to be added below the budget threshold section

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed LinkedJobRow type cast in requests/[id]/page.tsx**
- **Found during:** Task 2 (build verification)
- **Issue:** TypeScript error: `Conversion of type '{ job: { id: any; display_id: any; title: any; status: any; }[]; }' to type 'LinkedJobRow'` — Supabase returns FK relation fields as arrays when using `select('job:jobs(...)')` syntax, but the type expected a single object
- **Fix:** Changed `LinkedJobRow` type to accept `LinkedJobItem | LinkedJobItem[] | null` and handle array case in the map with `Array.isArray(job) ? job[0] ?? null : job`
- **Files modified:** app/(dashboard)/requests/[id]/page.tsx
- **Verification:** `npx tsc --noEmit` passes clean, `npm run build` succeeds
- **Committed in:** fd27715 (included in task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Critical fix for build to succeed. The pre-existing type error was introduced by Phase 5 background agent work. Fix is minimal and correct.

## Issues Encountered

- Several pre-existing TypeScript errors existed from background agent modifications (acceptance/feedback dialog components). These were in-scope blocking build errors. The LinkedJobRow fix resolved the final type error. All other changes (acceptance dialogs, feedback) were already correctly typed by the time this plan ran.

## Next Phase Readiness

- `/approvals` page ready for Finance Approver role
- `/admin/company-settings` ready for Admin to configure budget threshold
- Sidebar navigation fully activated for Jobs, Approvals, and Company Settings
- Ready for Phase 05-05: Acceptance Cycle UI (requester accept/reject completed work)

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-25*
