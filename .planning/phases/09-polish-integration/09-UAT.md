---
status: testing
phase: 09-polish-integration
source: [09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md, 09-04-SUMMARY.md]
started: 2026-03-03T15:00:00Z
updated: 2026-03-03T15:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 18
name: No dark: Classes in Codebase
expected: |
  All dark: Tailwind classes removed. Application uses light mode only.
awaiting: complete

## Tests

### 1. Breadcrumbs — Requests Page
expected: /requests shows breadcrumb nav with "Dashboard > Requests". Dashboard link navigates to /.
result: pass
e2e: pass — `breadcrumbs.spec.ts` (verifies nav[aria-label="breadcrumb"] visible, "Dashboard" and "Requests" text present)

### 2. Breadcrumbs — Jobs Page
expected: /jobs shows breadcrumb nav with "Dashboard > Jobs".
result: pass
e2e: pass — `breadcrumbs.spec.ts` (verifies breadcrumb with "Dashboard" and "Jobs")

### 3. Breadcrumbs — Inventory Page
expected: /inventory shows breadcrumb with "Inventory" visible.
result: pass
e2e: pass — `breadcrumbs.spec.ts` (verifies breadcrumb with "Inventory")

### 4. Breadcrumbs — Settings Page
expected: /admin/settings shows breadcrumb with "Dashboard > Settings".
result: pass
e2e: pass — `breadcrumbs.spec.ts` (verifies breadcrumb with "Dashboard" and "Settings")

### 5. Breadcrumbs — Notifications Page
expected: /notifications shows breadcrumb with "Notifications".
result: pass
e2e: pass — `breadcrumbs.spec.ts` (verifies breadcrumb with "Notifications")

### 6. Breadcrumbs — Dashboard Link Works
expected: Clicking "Dashboard" in any breadcrumb navigates to /.
result: pass
e2e: pass — `breadcrumbs.spec.ts` (verifies Dashboard link has href="/")

### 7. Audit Trail — Admin Access
expected: Admin user can navigate to /admin/audit-trail. Page shows "Audit Trail" heading and a data table with columns: Timestamp, User, Action, Entity Type, Entity.
result: pass
e2e: pass — `audit-trail.spec.ts` (navigates to /admin/audit-trail, verifies heading, table visible, all 5 column headers present)

### 8. Audit Trail — GA Lead Blocked by Layout
expected: GA Lead sees "Audit Trail" in sidebar but is blocked by admin/layout.tsx when navigating to /admin/audit-trail. Shows "Access Denied".
result: issue
e2e: pass — `audit-trail.spec.ts` (sidebar shows Audit Trail link for ga_lead, navigating to page shows "Access Denied" heading)
note: "BUG: admin/layout.tsx line 28 has overly restrictive role check (profile.role !== 'admin'). GA Lead should be able to access /admin/audit-trail since they have AUDIT_VIEW permission."
severity: major

### 9. Audit Trail — General User Hidden
expected: General user does not see "Audit Trail" in sidebar.
result: pass
e2e: pass — `audit-trail.spec.ts` (verifies Audit Trail nav item is hidden for general user)

### 10. Audit Trail — Filters Work
expected: Filter controls (entity type, action, user, date range) update displayed rows.
result: pass
e2e: pass — `audit-trail.spec.ts` (verifies table visible, applies entity type filter, confirms filtered row count <= initial)

### 11. CTA Buttons — Request List Above Table
expected: "New Request" button is positioned above the data table on /requests.
result: pass
e2e: pass — `cta-export-positions.spec.ts` (verifies "New Request" link visible, bounding box y < table y)

### 12. CTA Buttons — Job List Above Table
expected: "New Job" button is positioned above the data table on /jobs.
result: pass
e2e: pass — `cta-export-positions.spec.ts` (verifies "New Job" link visible, bounding box y < table y)

### 13. CTA Buttons — Request CTA Links to /requests/new
expected: "New Request" button is a link with href="/requests/new".
result: pass
e2e: pass — `cta-export-positions.spec.ts` Retest 1

### 14. CTA Buttons — Job CTA Links to /jobs/new
expected: "New Job" button is a link with href="/jobs/new".
result: pass
e2e: pass — `cta-export-positions.spec.ts` Retest 2

### 15. CTA Buttons — Inventory CTA Links to /inventory/new
expected: "New Asset" button is a link with href="/inventory/new".
result: pass
e2e: pass — `cta-export-positions.spec.ts` Retest 3

### 16. Export Button Position
expected: Export button on request list is positioned above the table.
result: pass
e2e: pass — `cta-export-positions.spec.ts` Test 6 (verifies Export button bounding box y < table y)

### 17. Export Button — Jobs
expected: Export button visible on /jobs for GA Lead.
result: pass
e2e: pass — `cta-export-positions.spec.ts` Retest 4

### 18. Row Actions — Text Labels
expected: Row action buttons on request, job, and inventory lists use text labels (not icon-only).
result: pass
e2e: pass — `row-actions.spec.ts` Tests 2, 4 + Retests 5-7 (verifies buttons/links exist in first table row for requests, jobs, and inventory)

### 19. Pagination — Default 50 Rows
expected: Request and job lists default to 50 rows per page.
result: pass
e2e: pass — `pagination-defaults.spec.ts` Tests 5 + 5b (verifies select value is "50" on both /requests and /jobs)

### 20. Date Range — Jobs List
expected: /jobs has a date range picker. Clicking opens a calendar popover.
result: pass
e2e: pass — `date-range.spec.ts` Test 7 (clicks date range button, verifies calendar dialog opens)

### 21. Date Range — Requests List
expected: /requests has a date range picker. Clicking opens a calendar popover.
result: pass
e2e: pass — `date-range.spec.ts` Test 8 (clicks date range button, verifies calendar dialog opens)

### 22. 404 Page
expected: Navigating to an invalid route shows a 404 page with "not found" text and a "Go to Dashboard" link with href="/".
result: pass
e2e: pass — `not-found.spec.ts` (navigates to /this-page-does-not-exist-at-all, verifies "not found" text, Dashboard link with href="/")

### 23. Loading Skeletons
expected: All data-fetching pages have loading.tsx skeletons (dashboard, requests list/detail/new, settings, users, audit trail). Skeletons match the page layout structure.
result: pass
note: "Verified by presence of loading.tsx files in route directories and skeleton components in components/skeletons/. Not directly testable via E2E (skeletons flash too fast on local dev)."

### 24. Dark Mode Removal
expected: Zero dark: Tailwind classes in the codebase. Application uses light mode only.
result: pass
note: "Verified by grep — zero dark: classes across all files. globals.css has no .dark block."

## Summary

total: 24
passed: 23
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "GA Lead users can access /admin/audit-trail with AUDIT_VIEW permission"
  status: failed
  reason: "admin/layout.tsx line 28 has overly restrictive role check: profile.role !== 'admin'. This blocks ga_lead from accessing any /admin/* route including audit-trail, despite ga_lead having AUDIT_VIEW permission and the sidebar correctly showing the link."
  severity: major
  test: 8
  root_cause: "admin/layout.tsx role gate is too restrictive — checks for admin-only instead of allowing ga_lead for audit-trail subroute"
  artifacts:
    - path: "app/(dashboard)/admin/layout.tsx"
      issue: "Line 28: profile.role !== 'admin' blocks all non-admin roles"
    - path: "lib/auth/permissions.ts"
      issue: "AUDIT_VIEW correctly assigned to ga_lead — not the source of the bug"
    - path: "components/sidebar.tsx"
      issue: "Sidebar correctly shows Audit Trail for ga_lead (AUDIT_VIEW gate) — not the source of the bug"
  missing: []
  debug_session: ""
