---
phase: 09-polish-integration
plan: 03
subsystem: UI Polish
tags: [dark-mode-removal, loading-skeletons, ux, cleanup]
dependency_graph:
  requires: []
  provides: [clean-css-no-dark-mode, loading-skeletons-all-pages]
  affects: [all-pages, all-ui-components]
tech_stack:
  added: []
  patterns: [next-loading-tsx, skeleton-components]
key_files:
  created:
    - components/skeletons/dashboard-skeleton.tsx
    - components/skeletons/request-list-skeleton.tsx
    - components/skeletons/request-detail-skeleton.tsx
    - components/skeletons/settings-skeleton.tsx
    - components/skeletons/users-skeleton.tsx
    - components/skeletons/request-new-skeleton.tsx
    - app/(dashboard)/loading.tsx
    - app/(dashboard)/requests/loading.tsx
    - app/(dashboard)/requests/[id]/loading.tsx
    - app/(dashboard)/requests/new/loading.tsx
    - app/(dashboard)/admin/settings/loading.tsx
    - app/(dashboard)/admin/users/loading.tsx
  modified:
    - app/globals.css
    - components/ui/button.tsx
    - components/ui/input.tsx
    - components/ui/textarea.tsx
    - components/ui/badge.tsx
    - components/ui/checkbox.tsx
    - components/ui/select.tsx
    - components/ui/tabs.tsx
    - components/ui/dropdown-menu.tsx
    - lib/constants/request-status.ts
    - lib/constants/job-status.ts
    - lib/constants/asset-status.ts
    - lib/constants/schedule-status.ts
    - components/sidebar.tsx
    - components/user-menu.tsx
    - components/inline-feedback.tsx
    - components/profile/profile-sheet.tsx
    - components/requests/request-timeline.tsx
    - components/requests/request-triage-dialog.tsx
    - components/requests/request-detail-info.tsx
    - components/admin/users/user-columns.tsx
    - components/admin/users/user-form-dialog.tsx
    - app/(auth)/login/page.tsx
    - app/(auth)/update-password/page.tsx
    - app/(auth)/reset-password/page.tsx
    - app/(dashboard)/page.tsx
    - app/(dashboard)/requests/[id]/page.tsx
    - app/unauthorized/page.tsx
decisions:
  - Cleaned all dark: classes from 50+ files (not just the 25 in plan) to achieve true zero-count
  - Used Python regex script to efficiently process batch of Phase 5-8 components (jobs, assets, maintenance, notifications, approvals)
  - Removed dark: from lib/constants color maps (job-status, asset-status, schedule-status) beyond original plan scope
metrics:
  duration: 14 min
  completed: 2026-02-25
  tasks_completed: 2
  files_modified: 65
---

# Phase 9 Plan 03: Dark Mode Removal & Loading Skeletons Summary

Remove all dark mode remnants from the codebase and add custom loading skeletons for all data-loading pages — zero dark: classes remain and six custom skeleton components mirror their exact page layouts.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Remove all dark mode remnants from codebase | 80fa6d3 |
| 2 | Create custom loading skeletons for all data-loading pages | 66b54a1 |

## What Was Built

### Task 1: Dark Mode Removal

Cleaned all `dark:` Tailwind classes from the codebase in two passes:

1. **globals.css**: Removed `@custom-variant dark (&:is(.dark *))` line and the entire `.dark { ... }` CSS custom property block (35 lines removed).

2. **25 files from plan**: Manually edited each file to remove dark: variants from UI components (button, input, textarea, badge, checkbox, select, tabs, dropdown-menu), auth pages, dashboard pages, sidebar, user-menu, profile sheet, request timeline/triage, user columns/form, and status color constants.

3. **30 additional files (beyond plan scope)**: Used Python regex to batch-clean dark: classes from Phase 5-8 components including jobs, assets, maintenance (templates, schedules, PM checklist), approvals, notifications, and dashboard summary widgets. Also cleaned lib/constants/job-status.ts, asset-status.ts, and schedule-status.ts.

**Result**: Zero `dark:` classes in the codebase. Build verified passing.

### Task 2: Custom Loading Skeletons

Created `components/skeletons/` directory with 6 skeleton components, each mirroring the exact layout of its corresponding page:

- **DashboardSkeleton**: Welcome header, KPI grid (5 cards), two-column charts/tables, maintenance/inventory bottom row
- **RequestListSkeleton**: Breadcrumb, header with New button, 5-filter toolbar, 8-row data table, pagination
- **RequestDetailSkeleton**: Breadcrumb, title row, two-column grid (info panel with photos + timeline with 5 events)
- **SettingsSkeleton**: Breadcrumb, header, 4-tab bar, search+add toolbar, 6-row table
- **UsersSkeleton**: Breadcrumb, header with company selector and Add button, filter toolbar, 6-row table with avatars, pagination
- **RequestNewSkeleton**: Breadcrumb, header, form card (description, location, photo upload, submit button)

Created 6 `loading.tsx` files in corresponding route directories (dashboard, requests list, request detail, request new, settings, users).

## Verification

1. `grep -r "dark:" ... | wc -l` returns **0** — zero dark: classes
2. `app/globals.css` has no `.dark` block and no `@custom-variant dark`
3. All 6 `loading.tsx` files exist in correct route directories
4. All 6 skeleton components exist in `components/skeletons/`
5. `npm run build` passes with "Compiled successfully"

## Deviations from Plan

### Auto-fixed: Additional files beyond original scope

**Found during:** Task 1

**Issue:** Original plan listed 25 files to clean, but grep revealed 30+ additional files from Phases 5-8 (jobs, assets, maintenance, approvals, notifications, dashboard components) also had dark: classes. Also found lib/constants/job-status.ts, asset-status.ts, and schedule-status.ts needed cleanup.

**Fix:** Extended scope to clean all files. Used Python regex batch processing for efficiency.

**Files modified:** 30 additional files beyond the 25 in the plan

**Rule:** Rule 1 (Auto-fix bug) / Rule 2 (Complete the stated objective: "Zero dark: classes")

## Self-Check: PASSED

All files verified present. Both task commits (80fa6d3, 66b54a1) verified in git log.
