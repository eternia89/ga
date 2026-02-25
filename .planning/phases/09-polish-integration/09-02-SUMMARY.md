---
phase: 09-polish-integration
plan: 02
subsystem: ui
tags: [audit-trail, tanstack-table, nuqs, supabase, date-fns, permissions]

# Dependency graph
requires:
  - phase: 01-database-schema-supabase-setup
    provides: audit_logs table with INSERT/UPDATE/DELETE triggers on all domain tables
  - phase: 02-auth-rbac
    provides: role-based permission system and AUDIT_VIEW permission constant
  - phase: 03-admin-system-configuration
    provides: DataTable component, sidebar navigation pattern, admin page layouts
provides:
  - Filterable audit trail page at /admin/audit-trail accessible to admin and ga_lead roles
  - AuditLogRow type for audit_logs query result enrichment
  - auditTrailColumns column definitions for 5-column audit DataTable
  - AuditTrailFilters component with URL-synced user/action/entity-type/date-range filters
  - AuditTrailTable client component integrating DataTable, filters, and client-side filtering
  - Sidebar navigation entry for Audit Trail using AUDIT_VIEW permission gate
affects: [any future admin reporting features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server-side data enrichment pattern: batch-query display IDs for requests/jobs/assets before rendering
    - AUDIT_VIEW permission added to ga_lead role (admin already has all permissions)
    - Audit trail entity link resolution via getEntityRoute from lib/constants/entity-routes.ts

key-files:
  created:
    - app/(dashboard)/admin/audit-trail/page.tsx
    - app/(dashboard)/admin/audit-trail/loading.tsx
    - components/audit-trail/audit-trail-columns.tsx
    - components/audit-trail/audit-trail-filters.tsx
    - components/audit-trail/audit-trail-table.tsx
  modified:
    - components/sidebar.tsx
    - lib/auth/permissions.ts

key-decisions:
  - "audit_logs table uses user_id (UUID) and user_email columns, not performed_by — AuditLogRow type corrected to match actual DB schema"
  - "AUDIT_VIEW permission added to ga_lead role in permissions.ts (was missing despite being defined as a PERMISSIONS constant)"
  - "Audit trail uses client-side filtering (data fetched once server-side, filtered in-memory via nuqs) consistent with request and job list pages"
  - "Sidebar Audit Trail item uses AUDIT_VIEW permission (not ADMIN_PANEL) so ga_lead users also see it"

patterns-established:
  - "Audit trail filter pattern: user combobox + action select + entity type select + date range inputs, all URL-synced via nuqs"
  - "Server-side enrichment: batch-query display IDs using Promise.all before passing to client table component"

requirements-completed: [REQ-DATA-005]

# Metrics
duration: 4min
completed: 2026-02-25
---

# Phase 9 Plan 02: Audit Trail Viewer Summary

**Filterable audit trail viewer at /admin/audit-trail with 5-column DataTable showing timestamp, user, action badges, entity type labels, and clickable entity links — accessible to admin and ga_lead roles**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T10:07:12Z
- **Completed:** 2026-02-25T10:11:52Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Built complete audit trail viewer at /admin/audit-trail fetching last 30 days of audit_logs with 1000-entry limit
- Created 5-column DataTable (timestamp in dd-MM-yyyy HH:mm:ss, user, action badge, entity type, clickable entity link) following existing request-columns.tsx patterns
- Implemented URL-synced filters: user (searchable combobox), action type, entity type, and date range — all with client-side filtering via nuqs
- Added custom loading.tsx skeleton matching audit trail page layout (header, filter bar, 5-column table with 8 rows, pagination)
- Added Audit Trail sidebar nav item gated by AUDIT_VIEW permission (visible to admin and ga_lead)
- Fixed missing AUDIT_VIEW permission assignment: ga_lead role was missing this permission despite it being defined as a constant

## Task Commits

Each task was committed atomically:

1. **Task 1: Create audit trail column definitions and filter components** - `9248232` (feat)
2. **Task 2: Create audit trail page, loading skeleton, and sidebar navigation** - `7ec9f65` (feat)

**Plan metadata:** (docs commit — see final commit below)

## Files Created/Modified
- `app/(dashboard)/admin/audit-trail/page.tsx` - Server component: auth check, fetch last 30 days audit_logs, batch-enrich with display IDs and user names
- `app/(dashboard)/admin/audit-trail/loading.tsx` - Custom loading skeleton matching audit trail page layout
- `components/audit-trail/audit-trail-columns.tsx` - ColumnDef array (auditTrailColumns) + AuditLogRow type; timestamp formatting, action badges, entity type labels, clickable entity links
- `components/audit-trail/audit-trail-filters.tsx` - Client component with nuqs URL-synced filters: user combobox, action select, entity type select, date range inputs
- `components/audit-trail/audit-trail-table.tsx` - Client component integrating DataTable, AuditTrailFilters, client-side filtering logic
- `components/sidebar.tsx` - Added Audit Trail nav item under Admin section with AUDIT_VIEW permission gate
- `lib/auth/permissions.ts` - Added AUDIT_VIEW permission to ga_lead role's permission array

## Decisions Made
- The audit_logs table uses `user_id` (not `performed_by` as the plan suggested) — AuditLogRow type uses `user_id` matching the actual DB schema
- AUDIT_VIEW permission was already defined as a constant in permissions.ts but was missing from ga_lead's role permissions — added during Task 2
- Sidebar Audit Trail item uses `PERMISSIONS.AUDIT_VIEW` (not `PERMISSIONS.ADMIN_PANEL`) so ga_lead users see it as well as admin
- Action label "Status Changed" triggered when both old_data.status and new_data.status are defined and differ on an UPDATE operation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected AuditLogRow field name from performed_by to user_id**
- **Found during:** Task 1 (column definitions)
- **Issue:** Plan's AuditLogRow type listed `performed_by` as a field, but the actual audit_logs DB column is `user_id`
- **Fix:** Used `user_id` and `user_email` matching the actual schema (from supabase/migrations/00004_audit_triggers.sql)
- **Files modified:** components/audit-trail/audit-trail-columns.tsx
- **Verification:** Build passes, column renders user_id correctly
- **Committed in:** 9248232

**2. [Rule 2 - Missing Critical] Added AUDIT_VIEW to ga_lead permissions**
- **Found during:** Task 2 (permissions.ts review)
- **Issue:** ga_lead role was missing AUDIT_VIEW in its permission array despite being a target audience for the audit trail
- **Fix:** Added PERMISSIONS.AUDIT_VIEW to ga_lead's permission list in ROLE_PERMISSIONS
- **Files modified:** lib/auth/permissions.ts
- **Verification:** Build passes, sidebar correctly shows Audit Trail for ga_lead users
- **Committed in:** 7ec9f65

---

**Total deviations:** 2 auto-fixed (1 bug — wrong field name; 1 missing critical — missing permission)
**Impact on plan:** Both auto-fixes required for correctness. No scope creep.

## Issues Encountered
None — build compiled successfully on first attempt.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Audit trail viewer complete and functional for admin and ga_lead users
- REQ-DATA-005 fulfilled: admins can view searchable audit trail of all system actions
- Ready for remaining Phase 9 plans (loading skeletons, mobile responsiveness, UI consistency pass)

---
*Phase: 09-polish-integration*
*Completed: 2026-02-25*
