---
phase: quick
plan: 260319-nye
subsystem: codebase-consistency
tags: [refactor, roles, display-id, created-at-cell]
dependency_graph:
  requires: []
  provides: [lib/constants/roles.ts, GA_ROLES, LEAD_ROLES, ROLES]
  affects: [actions, components, pages, api-routes]
tech_stack:
  added: []
  patterns: [centralized-role-constants, shared-ui-components]
key_files:
  created:
    - lib/constants/roles.ts
  modified:
    - app/actions/asset-actions.ts
    - app/actions/job-actions.ts
    - app/actions/pm-job-actions.ts
    - app/actions/request-actions.ts
    - app/actions/template-actions.ts
    - lib/safe-action.ts
    - app/api/exports/inventory/route.ts
    - app/api/exports/maintenance/route.ts
    - app/api/uploads/asset-photos/route.ts
    - app/api/uploads/asset-invoices/route.ts
    - app/api/uploads/job-photos/route.ts
    - components/assets/asset-columns.tsx
    - components/assets/asset-detail-actions.tsx
    - components/assets/asset-detail-client.tsx
    - components/assets/asset-detail-info.tsx
    - components/assets/asset-view-modal.tsx
    - components/assets/asset-transfer-dialog.tsx
    - components/assets/asset-transfer-respond-modal.tsx
    - components/assets/asset-status-change-dialog.tsx
    - components/requests/request-columns.tsx
    - components/requests/request-filters.tsx
    - components/requests/request-detail-actions.tsx
    - components/requests/request-detail-info.tsx
    - components/requests/request-view-modal.tsx
    - components/jobs/job-columns.tsx
    - components/jobs/job-filters.tsx
    - components/jobs/job-detail-info.tsx
    - components/jobs/job-detail-client.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-modal.tsx
    - components/jobs/job-form.tsx
    - components/maintenance/schedule-columns.tsx
    - components/maintenance/schedule-detail.tsx
    - components/maintenance/schedule-list.tsx
    - components/maintenance/schedule-view-modal.tsx
    - components/maintenance/template-detail.tsx
    - components/maintenance/template-list.tsx
    - components/maintenance/template-view-modal.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/new/page.tsx
    - app/(dashboard)/maintenance/page.tsx
    - app/(dashboard)/maintenance/templates/page.tsx
decisions:
  - "Role arrays typed as readonly with (X as readonly string[]).includes() for compatibility with string profile.role"
  - "Audit-trail font-mono on timestamps/entity IDs intentionally not migrated to DisplayId -- mixed use of UUIDs and display IDs"
  - "CreatedAtCell migration scoped to table column cells only -- embedded prose dates (Created X by Y) left as-is to preserve text flow styling"
metrics:
  duration: 13min
  completed: 2026-03-19
---

# Quick Task 260319-nye: Extract Role Constants, Migrate DisplayId, Adopt CreatedAtCell

Centralized 60+ inline role arrays into GA_ROLES/LEAD_ROLES constants, adopted DisplayId component for 10 display_id renders, and migrated remaining CreatedAtCell usage in schedule columns.

## Fix 1: Extract Role Constants (HIGH priority)

Created `lib/constants/roles.ts` with:
- `ROLES` -- enum-like const object for all 5 roles
- `Role` -- union type derived from ROLES values
- `GA_ROLES` -- `[ga_staff, ga_lead, admin]` for operational role checks
- `LEAD_ROLES` -- `[ga_lead, admin]` for leadership role checks

Replaced inline role arrays across **36 files**:
- 6 server action files (asset, job, pm-job, request, template actions + safe-action.ts)
- 3 API export routes (inventory, maintenance + job-photos upload)
- 2 API upload routes (asset-photos, asset-invoices)
- 11 component files (assets, jobs, requests, maintenance)
- 4 page files (inventory, inventory/new, maintenance, maintenance/templates)

Used `(GA_ROLES as readonly string[]).includes(profile.role)` pattern for type compatibility with the `string` type from profile.role.

## Fix 2: DisplayId Component Adoption

Replaced 10 inline `<span className="font-mono ...">` renders with `<DisplayId>` component:

| File | Context |
|------|---------|
| asset-columns.tsx | Table ID column |
| request-columns.tsx | Table ID column |
| job-columns.tsx | Table ID column |
| asset-transfer-dialog.tsx | Transfer dialog asset info |
| asset-transfer-respond-modal.tsx | Respond modal asset info |
| asset-status-change-dialog.tsx | Status change dialog asset info |
| job-form.tsx | Linked request chips |
| schedule-columns.tsx | Asset display_id in parens |
| schedule-detail.tsx | PM job list display_id |
| schedule-view-modal.tsx | PM job list display_id |

## Fix 3: CreatedAtCell Adoption

Migrated `last_completed_at` column in `schedule-columns.tsx` from inline `format(new Date(date), 'dd-MM-yyyy')` to `<CreatedAtCell date={date} />`.

Audit-trail `performed_at` column intentionally kept as-is: uses datetime format (`dd-MM-yyyy, HH:mm:ss`) with `font-mono text-xs` styling, which differs from CreatedAtCell's date-only format.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| # | Hash | Description |
|---|------|-------------|
| 1 | 062fed3 | Extract role constants to lib/constants/roles.ts |
| 2 | b969e4a | Adopt DisplayId component for all display_id renders |
| 3 | 4b015c6 | Adopt CreatedAtCell for remaining date column |

## Self-Check: PASSED

All key files exist and all 3 commits verified.
