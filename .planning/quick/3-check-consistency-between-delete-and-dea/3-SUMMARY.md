---
phase: quick-3
plan: 1
subsystem: ui-terminology
tags: [refactor, terminology, consistency, soft-delete]
dependency_graph:
  requires: []
  provides: [consistent-deactivate-reactivate-terminology]
  affects: [admin-entities, maintenance-schedules, audit-trail, shared-components]
tech_stack:
  added: []
  patterns: [deactivate-reactivate-for-soft-delete, pause-resume-for-is-active-toggle]
key_files:
  created: []
  modified:
    - components/delete-confirm-dialog.tsx
    - components/data-table/data-table-toolbar.tsx
    - components/admin/companies/company-columns.tsx
    - components/admin/companies/company-table.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/divisions/division-table.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/locations/location-table.tsx
    - components/admin/categories/category-columns.tsx
    - components/admin/categories/category-table.tsx
    - app/actions/company-actions.ts
    - app/actions/division-actions.ts
    - app/actions/location-actions.ts
    - app/actions/category-actions.ts
    - components/maintenance/schedule-detail.tsx
    - components/maintenance/schedule-list.tsx
    - components/maintenance/schedule-columns.tsx
    - components/audit-trail/audit-trail-columns.tsx
    - components/audit-trail/audit-trail-filters.tsx
    - components/audit-trail/audit-trail-table.tsx
    - e2e/pages/shared/delete-confirm-dialog.page.ts
    - e2e/helpers/selectors.ts
decisions:
  - "Renamed DeleteConfirmDialog export to DeactivateConfirmDialog; file name unchanged to minimize import path churn"
  - "Schedule UI: Deactivate/Activate (is_active toggle) renamed to Pause/Resume; Delete (soft-delete) renamed to Deactivate"
  - "Internal code names (onDelete, handleDelete, deletingCompany, etc.) left unchanged -- they reference the DB pattern"
metrics:
  duration: 8min
  completed: 2026-03-03
---

# Quick Task 3: Consistent Deactivate/Reactivate Terminology Summary

Replaced all user-facing Delete/Restore terminology with Deactivate/Reactivate for soft-delete operations; schedule UI uses Pause/Resume for is_active toggle

## What Changed

### Shared Components (Task 1)

**DeactivateConfirmDialog** (renamed from DeleteConfirmDialog):
- Title: "Delete {entityType}?" -> "Deactivate {entityType}?"
- Body: Removed "cannot be undone" / "permanently" language (soft-delete IS reversible)
- Dependency message: "Cannot delete" -> "Cannot deactivate"
- Button: "Deleting..." / "Delete" -> "Deactivating..." / "Deactivate"

**DataTableToolbar bulk actions:**
- Button: "Delete" -> "Deactivate"
- Dialog: "Delete N items?" -> "Deactivate N items?"
- Confirmation: Type "DELETE" -> Type "DEACTIVATE"
- Button: "Delete All" -> "Deactivate All"

### Admin Entity Columns (4 files)

All four (company, division, location, category) columns:
- Row action button for active entities: "Delete" -> "Deactivate"
- Row action button for deactivated entities: "Restore" -> "Reactivate"

### Admin Entity Tables (4 files)

All four table components:
- Import: DeleteConfirmDialog -> DeactivateConfirmDialog
- Success messages: "deleted successfully" -> "deactivated successfully"
- Error messages: "Failed to delete" -> "Failed to deactivate"
- Bulk success: "Deleted N entities" -> "Deactivated N entities"
- Bulk error: "Failed to bulk delete" -> "Failed to bulk deactivate"
- Restore success: "restored successfully" -> "reactivated successfully"
- Restore error: "Failed to restore" -> "Failed to reactivate"

### Server Actions (Task 2, 4 files)

All four action files:
- "Cannot delete -- N assigned" -> "Cannot deactivate -- N assigned"
- "Cannot restore -- an active entity named..." -> "Cannot reactivate -- an active entity named..."

### Maintenance Schedules (3 files)

Schedules have two distinct operations that previously used confusing terminology:
- **is_active toggle** (pause/resume the schedule): renamed from "Deactivate"/"Activate" to **"Pause"/"Resume"**
- **deleted_at soft-delete** (remove schedule from view): renamed from "Delete" to **"Deactivate"**

This makes terminology consistent: soft-delete = Deactivate everywhere.

### Audit Trail (3 files)

- Operation label for DELETE: "Deleted" -> "Deactivated"
- Filter option: "Deleted" -> "Deactivated"
- Badge variant case: "Deleted" -> "Deactivated"

### E2E Test Infrastructure (2 files)

- Page object button selector: 'Delete' -> 'Deactivate'
- Selectors helper: deleteButton text updated

## Deviations from Plan

None -- plan executed exactly as written.

## Pre-existing Issues (Out of Scope)

- `app/actions/job-actions.ts:279` -- TypeScript error: `'approval_needed'` type not in notification type union. Pre-existing, unrelated to this task. Build fails due to this error.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 67bde00 | Shared components + admin entity UI text |
| 2 | 6f91547 | Server actions, schedules, audit trail |

## Self-Check: PASSED

All 22 modified files verified present. Both commits (67bde00, 6f91547) verified in git log.
