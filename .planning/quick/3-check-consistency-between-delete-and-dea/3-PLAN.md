---
phase: quick-3
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  # Shared components
  - components/delete-confirm-dialog.tsx
  - components/data-table/data-table-toolbar.tsx
  # Admin entity columns (row action buttons)
  - components/admin/companies/company-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/categories/category-columns.tsx
  # Admin entity tables (handlers + feedback messages)
  - components/admin/companies/company-table.tsx
  - components/admin/divisions/division-table.tsx
  - components/admin/locations/location-table.tsx
  - components/admin/categories/category-table.tsx
  # Server actions (user-facing error messages)
  - app/actions/company-actions.ts
  - app/actions/division-actions.ts
  - app/actions/location-actions.ts
  - app/actions/category-actions.ts
  # Maintenance schedules
  - components/maintenance/schedule-detail.tsx
  - components/maintenance/schedule-list.tsx
  - components/maintenance/schedule-columns.tsx
  # Audit trail
  - components/audit-trail/audit-trail-columns.tsx
  - components/audit-trail/audit-trail-filters.tsx
  - components/audit-trail/audit-trail-table.tsx
  # E2E page objects
  - e2e/pages/shared/delete-confirm-dialog.page.ts
  - e2e/helpers/selectors.ts
autonomous: true
requirements: [QUICK-3]

must_haves:
  truths:
    - "No user-facing button says 'Delete' for soft-delete operations (only 'Deactivate')"
    - "No user-facing button says 'Restore' for soft-undelete operations (only 'Reactivate')"
    - "All success/error feedback messages use 'deactivated'/'reactivated' not 'deleted'/'restored'"
    - "Bulk action confirmation requires typing 'DEACTIVATE' not 'DELETE'"
    - "Audit trail shows 'Deactivated' label for soft-delete operations"
    - "The app builds successfully with no TypeScript errors"
  artifacts:
    - path: "components/delete-confirm-dialog.tsx"
      provides: "DeactivateConfirmDialog with Deactivate terminology"
      contains: "Deactivate"
    - path: "components/data-table/data-table-toolbar.tsx"
      provides: "Bulk deactivate with DEACTIVATE confirmation"
      contains: "DEACTIVATE"
  key_links:
    - from: "components/admin/companies/company-table.tsx"
      to: "components/delete-confirm-dialog.tsx"
      via: "DeactivateConfirmDialog import"
      pattern: "DeactivateConfirmDialog"
    - from: "components/admin/companies/company-columns.tsx"
      to: "user sees Deactivate/Reactivate buttons"
      via: "row action buttons"
      pattern: "Deactivate|Reactivate"
---

<objective>
Replace all user-facing "Delete"/"Restore" terminology with "Deactivate"/"Reactivate" for soft-delete operations across the entire UI, including buttons, dialog text, success/error messages, audit trail labels, and bulk actions.

Purpose: The project uses soft-delete (deleted_at) not hard-delete. UI language should reflect this consistently — users are deactivating/reactivating entities, not permanently deleting them. The Users and Maintenance Templates sections already use correct terminology; admin entities (Company, Division, Location, Category), shared components, schedules, and audit trail still say "Delete"/"Restore".

Output: All user-facing text updated, internal code variable names left as-is (they reference the DB pattern and renaming them would be a large refactor with no user benefit).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@components/delete-confirm-dialog.tsx
@components/data-table/data-table-toolbar.tsx
@components/admin/companies/company-columns.tsx
@components/admin/companies/company-table.tsx
@components/admin/divisions/division-columns.tsx
@components/admin/divisions/division-table.tsx
@components/admin/locations/location-columns.tsx
@components/admin/locations/location-table.tsx
@components/admin/categories/category-columns.tsx
@components/admin/categories/category-table.tsx
@components/maintenance/schedule-detail.tsx
@components/maintenance/schedule-list.tsx
@components/maintenance/schedule-columns.tsx
@components/audit-trail/audit-trail-columns.tsx
@components/audit-trail/audit-trail-filters.tsx
@components/audit-trail/audit-trail-table.tsx
@app/actions/company-actions.ts
@app/actions/division-actions.ts
@app/actions/location-actions.ts
@app/actions/category-actions.ts
@e2e/pages/shared/delete-confirm-dialog.page.ts
@e2e/helpers/selectors.ts

<interfaces>
<!-- The DeleteConfirmDialog is imported by all 4 admin entity tables. Renaming the export affects all import sites. -->

From components/delete-confirm-dialog.tsx:
```typescript
export function DeleteConfirmDialog({ open, onOpenChange, entityName, entityType, onConfirm, dependencyCount, dependencyLabel }: DeleteConfirmDialogProps)
```

From components/data-table/data-table-toolbar.tsx:
```typescript
interface DataTableToolbarProps<TData> {
  onBulkDelete?: (ids: string[]) => Promise<void>;
  // ... other props
}
```

From admin column files (all 4 follow same pattern):
```typescript
// meta type used in row actions
onDelete?: (entity: Entity) => void;
onRestore?: (entity: Entity) => void;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update shared components and admin entity UI text</name>
  <files>
    components/delete-confirm-dialog.tsx,
    components/data-table/data-table-toolbar.tsx,
    components/admin/companies/company-columns.tsx,
    components/admin/companies/company-table.tsx,
    components/admin/divisions/division-columns.tsx,
    components/admin/divisions/division-table.tsx,
    components/admin/locations/location-columns.tsx,
    components/admin/locations/location-table.tsx,
    components/admin/categories/category-columns.tsx,
    components/admin/categories/category-table.tsx,
    e2e/pages/shared/delete-confirm-dialog.page.ts,
    e2e/helpers/selectors.ts
  </files>
  <action>
    Update all user-facing text from Delete/Restore to Deactivate/Reactivate. Internal variable/function names stay as-is to avoid a massive refactor — only string literals and export names change.

    **components/delete-confirm-dialog.tsx:**
    - Rename the exported component from `DeleteConfirmDialog` to `DeactivateConfirmDialog`
    - Rename the interface from `DeleteConfirmDialogProps` to `DeactivateConfirmDialogProps`
    - Title: `Delete {entityType}?` -> `Deactivate {entityType}?`
    - Dependency message: `Cannot delete` -> `Cannot deactivate`, `before deleting` -> `before deactivating`
    - Body: `This action cannot be undone. This will permanently delete the {entityType}` -> `This will deactivate the {entityType}` (remove "cannot be undone" and "permanently" since soft-delete IS reversible)
    - Button: `Deleting...` / `Delete` -> `Deactivating...` / `Deactivate`
    - Console error: leave as-is (developer-facing)

    **components/data-table/data-table-toolbar.tsx:**
    - The `onBulkDelete` prop name stays (internal API, renaming would touch every consumer). Only user-facing text changes:
    - Button text: `Delete` -> `Deactivate`
    - Dialog title: `Delete {N} items?` -> `Deactivate {N} items?`
    - Dialog body: `will be deleted` -> `will be deactivated`
    - Confirmation label: `Type DELETE to confirm` -> `Type DEACTIVATE to confirm`
    - Confirmation check: `bulkDeleteConfirmText !== "DELETE"` -> `bulkDeleteConfirmText !== "DEACTIVATE"`
    - Placeholder: `DELETE` -> `DEACTIVATE`
    - Button: `Deleting...` / `Delete All` -> `Deactivating...` / `Deactivate All`

    **company-columns.tsx, division-columns.tsx, location-columns.tsx, category-columns.tsx (all 4 identical pattern):**
    - Row action button text for active entities: `Delete` -> `Deactivate`
    - Row action button text for deactivated entities: `Restore` -> `Reactivate`
    - The `onDelete` / `onRestore` prop names in meta stay as-is (internal API)

    **company-table.tsx, division-table.tsx, location-table.tsx, category-table.tsx (all 4 identical pattern):**
    - Import: `DeleteConfirmDialog` -> `DeactivateConfirmDialog`
    - Usage: `<DeleteConfirmDialog` -> `<DeactivateConfirmDialog`
    - Success messages: `${name} deleted successfully` -> `${name} deactivated successfully`
    - Error messages: `Failed to delete` -> `Failed to deactivate`
    - Bulk success: `Deleted ${deleted} {entities}` -> `Deactivated ${deleted} {entities}` and `${blocked} blocked due to dependencies` stays
    - Bulk error: `Failed to bulk delete` -> `Failed to bulk deactivate`
    - Restore success: `${name} restored successfully` -> `${name} reactivated successfully`
    - Restore error: `Failed to restore` -> `Failed to reactivate`

    **e2e/pages/shared/delete-confirm-dialog.page.ts:**
    - Update button selector from `'Delete'` to `'Deactivate'` (this page object clicks the confirm button in the dialog)
    - Method names can stay as-is (internal test code)

    **e2e/helpers/selectors.ts:**
    - Update `deleteButton` selector from `'button:has-text("Delete")'` to `'button:has-text("Deactivate")'`
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All 4 admin entity tables show "Deactivate"/"Reactivate" buttons, DeactivateConfirmDialog says "Deactivate", bulk action uses "DEACTIVATE" confirmation, all success/error messages match. TypeScript compiles.</done>
</task>

<task type="auto">
  <name>Task 2: Update server actions, maintenance schedules, and audit trail</name>
  <files>
    app/actions/company-actions.ts,
    app/actions/division-actions.ts,
    app/actions/location-actions.ts,
    app/actions/category-actions.ts,
    components/maintenance/schedule-detail.tsx,
    components/maintenance/schedule-list.tsx,
    components/maintenance/schedule-columns.tsx,
    components/audit-trail/audit-trail-columns.tsx,
    components/audit-trail/audit-trail-filters.tsx,
    components/audit-trail/audit-trail-table.tsx
  </files>
  <action>
    **Server actions (4 files — user-facing error messages only):**

    In company-actions.ts:
    - `Cannot delete -- ${deps.join(", ")} assigned` -> `Cannot deactivate -- ${deps.join(", ")} assigned`
    - `Cannot restore -- an active company named` -> `Cannot reactivate -- an active company named`

    In division-actions.ts:
    - `Cannot delete -- ${count} user...` -> `Cannot deactivate -- ${count} user...`
    - `Cannot restore -- an active division named` -> `Cannot reactivate -- an active division named`

    In location-actions.ts:
    - `Cannot delete -- ${deps.join(", ")} assigned` -> `Cannot deactivate -- ${deps.join(", ")} assigned`
    - `Cannot restore -- an active location named` -> `Cannot reactivate -- an active location named`

    In category-actions.ts:
    - `Cannot delete -- ${deps.join(", ")} assigned` -> `Cannot deactivate -- ${deps.join(", ")} assigned`
    - `Cannot restore -- an active ${category.type} category named` -> `Cannot reactivate -- an active ${category.type} category named`

    NOTE: Do NOT change function names (deleteCompany, restoreCompany, etc.) — they are internal API. Only change the string literals that users see in error messages.

    **Maintenance schedules — special case:**
    Schedules have TWO operations: `is_active` toggle (pause/resume) and `deleted_at` soft-delete (remove from view). The existing "Deactivate"/"Activate" buttons control `is_active`. The "Delete" button does soft-delete. To be consistent with the rest of the app:

    In schedule-detail.tsx:
    - Remove the separate "Delete" button and its confirmation UI entirely
    - The existing "Deactivate" button (which sets `is_active = false`) stays as-is
    - Add a new "Remove" action (calls deleteSchedule) that uses "Remove" terminology to distinguish from deactivate. Actually — per the user's instruction, soft-delete = "Deactivate". Since `is_active=false` is really a "Pause" and `deleted_at` is the real "Deactivate":
      - Rename existing "Deactivate" button (is_active toggle) to "Pause"
      - Rename existing "Activate" button (is_active toggle) to "Resume"
      - Rename "Delete" button to "Deactivate"
      - Rename "Confirm Delete" to "Confirm Deactivate"
      - Change confirmation text: `Delete this schedule?` -> `Deactivate this schedule?`
      - Change body: `This will soft-delete the schedule` -> `This will deactivate the schedule`
      - Change feedback: `Deleting...` -> `Deactivating...`

    In schedule-list.tsx:
    - Success: `Schedule deleted.` -> `Schedule deactivated.`
    - Error: `Failed to delete schedule.` -> `Failed to deactivate schedule.`

    In schedule-columns.tsx:
    - Row action button: `Deactivate` -> `Pause` (for is_active toggle)
    - Row action button: `Activate` -> `Resume` (for is_active toggle)
    - Row action button: `Delete` -> `Deactivate` (for soft-delete)

    **Audit trail (3 files):**
    The audit trail shows operation labels for DB operations. Since `DELETE` operations in the audit log correspond to soft-deletes (which are actually UPDATEs setting deleted_at via trigger), and actual hard deletes are blocked by RLS — the label should reflect user action:

    In audit-trail-columns.tsx:
    - `if (operation === 'DELETE') return 'Deleted'` -> `if (operation === 'DELETE') return 'Deactivated'`
    - Badge variant switch: `case 'Deleted':` -> `case 'Deactivated':`

    In audit-trail-filters.tsx:
    - Filter option: `{ label: 'Deleted', value: 'Deleted' }` -> `{ label: 'Deactivated', value: 'Deactivated' }`

    In audit-trail-table.tsx:
    - `if (operation === 'DELETE') return 'Deleted'` -> `if (operation === 'DELETE') return 'Deactivated'`
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && echo "---" && grep -rn '"Delete"' components/admin/ components/delete-confirm-dialog.tsx components/data-table/data-table-toolbar.tsx components/maintenance/schedule-detail.tsx components/maintenance/schedule-list.tsx components/maintenance/schedule-columns.tsx 2>/dev/null | grep -v 'deleted_at\|deleteMedia\|deleteAsset\|// \|console\.\|\.delete()\|onDelete\|handleDelete\|setBulkDelete\|bulkDelete\|deletingC\|deletedP\|deletedI\|setDeleted\|deleteResult\|import.*delete' || echo "No stray Delete text found"</automated>
  </verify>
  <done>Server action error messages say "Cannot deactivate"/"Cannot reactivate". Schedule UI uses Pause/Resume for is_active toggle and Deactivate for soft-delete. Audit trail shows "Deactivated" instead of "Deleted". Full build passes with no TypeScript errors.</done>
</task>

</tasks>

<verification>
After both tasks complete, run a comprehensive check:

1. `npx tsc --noEmit` — no TypeScript errors
2. `npm run build` — production build succeeds
3. Grep for remaining user-facing "Delete" strings that should have been changed:
   - `grep -rn '"Delete"' components/admin/ components/delete-confirm-dialog.tsx` should return nothing
   - `grep -rn '"Restore"' components/admin/` should return nothing
   - `grep -rn '"Deleted"' components/audit-trail/` should return nothing
4. Verify correct new strings exist:
   - `grep -rn '"Deactivate"' components/admin/` should show hits in all 4 entity column files
   - `grep -rn '"Reactivate"' components/admin/` should show hits in all 4 entity column files
   - `grep -rn '"Deactivated"' components/audit-trail/` should show hits
</verification>

<success_criteria>
- Zero user-facing instances of "Delete" for soft-delete operations (buttons, dialogs, messages)
- Zero user-facing instances of "Restore" for soft-undelete operations (buttons, messages)
- All replaced with "Deactivate"/"Reactivate" consistently
- Schedule UI distinguishes Pause/Resume (is_active) from Deactivate (soft-delete)
- Audit trail labels updated to "Deactivated"
- TypeScript compilation and production build both succeed
- Internal code (variable names, function names, prop names) left unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/3-check-consistency-between-delete-and-dea/3-SUMMARY.md`
</output>
