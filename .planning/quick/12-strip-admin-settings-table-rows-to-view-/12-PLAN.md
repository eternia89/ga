---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/entity-form-dialog.tsx
  - components/admin/users/user-form-dialog.tsx
  - components/admin/companies/company-form-dialog.tsx
  - components/admin/divisions/division-form-dialog.tsx
  - components/admin/locations/location-form-dialog.tsx
  - components/admin/categories/category-form-dialog.tsx
  - components/admin/users/user-columns.tsx
  - components/admin/companies/company-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/categories/category-columns.tsx
  - components/admin/users/user-table.tsx
  - components/admin/companies/company-table.tsx
  - components/admin/divisions/division-table.tsx
  - components/admin/locations/location-table.tsx
  - components/admin/categories/category-table.tsx
autonomous: true
requirements: [QUICK-12]

must_haves:
  truths:
    - "Admin table rows show only a single Edit button per row"
    - "No Deactivate or Reactivate buttons appear in table rows"
    - "Deactivate button appears in FormDialog footer when editing an active entity"
    - "Reactivate button appears in FormDialog footer when editing a deactivated entity"
    - "Clicking Deactivate in FormDialog still triggers the confirmation dialog before proceeding"
    - "Users table uses UserDeactivateDialog with reason field; other entities use DeactivateConfirmDialog with name-type confirmation"
  artifacts:
    - path: "components/admin/entity-form-dialog.tsx"
      provides: "Optional secondary footer action for deactivate/reactivate in edit mode"
    - path: "components/admin/users/user-columns.tsx"
      provides: "Single Edit button per row, no deactivate/reactivate"
    - path: "components/admin/companies/company-columns.tsx"
      provides: "Single Edit button per row via table meta"
  key_links:
    - from: "components/admin/**/company-table.tsx (and siblings)"
      to: "components/admin/**/company-form-dialog.tsx (and siblings)"
      via: "onDeactivate/onReactivate props passed from table to form dialog"
      pattern: "onDeactivate.*onReactivate"
    - from: "components/admin/entity-form-dialog.tsx"
      to: "DeactivateConfirmDialog or UserDeactivateDialog"
      via: "secondaryAction callback triggers confirmation dialog in parent"
      pattern: "secondaryAction"
---

<objective>
Strip admin settings table rows to single Edit action and move Deactivate/Reactivate into FormDialog footer when editing.

Purpose: Simplify admin table UX -- rows have one clear action (Edit), and destructive/lifecycle actions live inside the edit dialog where context is clear.
Output: All 5 admin entity tables (Users, Companies, Divisions, Locations, Categories) show Edit-only rows; FormDialogs gain Deactivate/Reactivate as secondary footer actions in edit mode.
</objective>

<context>
@components/admin/entity-form-dialog.tsx
@components/admin/users/user-columns.tsx
@components/admin/users/user-form-dialog.tsx
@components/admin/users/user-table.tsx
@components/admin/companies/company-columns.tsx
@components/admin/companies/company-form-dialog.tsx
@components/admin/companies/company-table.tsx
@components/admin/divisions/division-columns.tsx
@components/admin/divisions/division-form-dialog.tsx
@components/admin/divisions/division-table.tsx
@components/admin/locations/location-columns.tsx
@components/admin/locations/location-form-dialog.tsx
@components/admin/locations/location-table.tsx
@components/admin/categories/category-columns.tsx
@components/admin/categories/category-form-dialog.tsx
@components/admin/categories/category-table.tsx
@components/admin/users/user-deactivate-dialog.tsx
@components/delete-confirm-dialog.tsx

<interfaces>
<!-- EntityFormDialog current footer structure (line 116-128) -->
From components/admin/entity-form-dialog.tsx:
```typescript
export interface EntityFormDialogProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  onSubmit: (data: T) => Promise<{ error?: string }>;
  onSuccess?: () => void;
  title: string;
  description?: string;
  submitLabel: string;
  submittingLabel: string;
  children: (form: UseFormReturn<T>) => React.ReactNode;
}
```

<!-- Two different column patterns -->
User columns: function-based `getUserColumns(onEdit, onDeactivate, onReactivate)` returning ColumnDef[]
Other columns: static `companyColumns` / `divisionColumns` etc. using `table.options.meta` with `{ onEdit, onDelete, onRestore }`

<!-- Two different deactivate dialog patterns -->
Users: UserDeactivateDialog with reason textarea, mode prop (deactivate|reactivate)
Others: DeactivateConfirmDialog with name-type-to-confirm input
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add secondary action support to EntityFormDialog and update all 5 FormDialogs</name>
  <files>
    components/admin/entity-form-dialog.tsx
    components/admin/users/user-form-dialog.tsx
    components/admin/companies/company-form-dialog.tsx
    components/admin/divisions/division-form-dialog.tsx
    components/admin/locations/location-form-dialog.tsx
    components/admin/categories/category-form-dialog.tsx
  </files>
  <action>
1. **EntityFormDialog** -- Add an optional `secondaryAction` prop to the interface:
   ```typescript
   secondaryAction?: {
     label: string;
     variant: 'destructive' | 'success';
     onClick: () => void;
   };
   ```
   In the footer div (currently `flex justify-end gap-3`), change to `flex justify-between` when `secondaryAction` is provided. Render the secondary action button on the LEFT side of the footer (before the Cancel/Submit group). Use `variant="ghost"` with appropriate text color: `text-destructive hover:text-destructive` for destructive, `text-green-600 hover:text-green-700` for success. The button should be `type="button"` and disabled when `isSubmitting`. Do NOT render `secondaryAction` button if the prop is not provided (footer stays right-aligned as today).

2. **CompanyFormDialog, DivisionFormDialog, LocationFormDialog, CategoryFormDialog** -- Add optional props:
   - `onDeactivate?: () => void` -- called when entity is active (no deleted_at)
   - `onReactivate?: () => void` -- called when entity is deactivated (has deleted_at)

   Each form dialog already receives the entity prop (company, division, location, category). Check `entity.deleted_at` to determine which action to show. Pass `secondaryAction` to EntityFormDialog:
   - If entity exists AND `entity.deleted_at` AND `onReactivate`: `{ label: 'Reactivate', variant: 'success', onClick: onReactivate }`
   - If entity exists AND NOT `entity.deleted_at` AND `onDeactivate`: `{ label: 'Deactivate', variant: 'destructive', onClick: onDeactivate }`
   - Otherwise: don't pass secondaryAction (create mode or no callbacks)

3. **UserFormDialog** -- Add optional props:
   - `onDeactivate?: () => void`
   - `onReactivate?: () => void`
   - `isDeactivated?: boolean` -- since UserRow's deleted_at is on the row type not the form input type

   Same logic: pass `secondaryAction` to EntityFormDialog based on isDeactivated flag and presence of callbacks.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>EntityFormDialog renders optional secondary action button in footer left side. All 5 FormDialogs accept and forward onDeactivate/onReactivate props. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Strip columns to Edit-only and rewire table components</name>
  <files>
    components/admin/users/user-columns.tsx
    components/admin/companies/company-columns.tsx
    components/admin/divisions/division-columns.tsx
    components/admin/locations/location-columns.tsx
    components/admin/categories/category-columns.tsx
    components/admin/users/user-table.tsx
    components/admin/companies/company-table.tsx
    components/admin/divisions/division-table.tsx
    components/admin/locations/location-table.tsx
    components/admin/categories/category-table.tsx
  </files>
  <action>
**Columns files (all 5):**

1. **user-columns.tsx**:
   - Remove `onDeactivate` and `onReactivate` params from `getUserColumns()` signature (keep only `onEdit`)
   - Remove `UserActionsProps` type's `onDeactivate`/`onReactivate` fields
   - Simplify `UserActions` component to render only the Edit button (remove the conditional Deactivate/Reactivate buttons)
   - The Edit button should always show regardless of `deleted_at` status (deactivated entities can still be edited)

2. **company-columns.tsx, division-columns.tsx, location-columns.tsx, category-columns.tsx**:
   - In the `actions` column cell, remove `onDelete`/`onRestore` from the meta type cast (keep only `onEdit`)
   - Render only the Edit button, always visible regardless of `deleted_at` status
   - Remove the conditional `isDeactivated ? Reactivate : (Edit + Deactivate)` branching
   - The single Edit button: `variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => meta?.onEdit?.(entity)}`

**Table files:**

3. **company-table.tsx, division-table.tsx, location-table.tsx, category-table.tsx** (same pattern for all 4):
   - Remove `deletingEntity` state (`deletingCompany`, `deletingDivision`, etc.)
   - Remove `handleDelete` function
   - Remove `handleRestore` function
   - Remove `handleConfirmDelete` function
   - Remove `<DeactivateConfirmDialog>` render
   - Remove `onDelete` and `onRestore` from DataTable `meta` prop (keep only `onEdit`)
   - Keep `handleEdit` as-is
   - Add to the EDIT FormDialog instance (the one that uses `!!editingEntity` for open):
     - `onDeactivate={() => { setDeletingEntity(editingEntity); }}` -- wait, we removed deletingEntity state.

   Actually, the approach: Instead of removing all deactivate state, KEEP the confirmation dialog and its state, but trigger it FROM the FormDialog instead of from the table row. Specifically:

   - Keep `deletingEntity` state and `handleConfirmDelete` and `<DeactivateConfirmDialog>`
   - Remove `handleDelete` (was called from table row)
   - Remove `handleRestore` (was called from table row) -- replace with a new inline `handleRestore` that is called from FormDialog
   - Remove `onDelete`/`onRestore` from DataTable meta
   - On the edit FormDialog, add:
     - `onDeactivate={() => setDeletingEntity(editingEntity)}` -- opens DeactivateConfirmDialog
     - `onReactivate={async () => { await restoreEntity({ id: editingEntity.id }); setFeedback({ type: 'success', message: '... reactivated successfully' }); setEditingEntity(null); }}`
   - In `handleConfirmDelete` success path, also close the edit dialog: `setEditingEntity(null)` after `setDeletingEntity(null)`

4. **user-table.tsx**:
   - Remove `handleDeactivate` and `handleReactivate` (were called from table row)
   - Remove `onDeactivate` and `onReactivate` from `getUserColumns()` call -- now just `getUserColumns(handleEdit)`
   - Keep `deactivateDialogOpen`, `deactivatingUser`, `reactivateDialogOpen`, `reactivatingUser` state and `handleDeactivateConfirm`/`handleReactivateConfirm` and `<UserDeactivateDialog>` renders
   - On the edit UserFormDialog, add:
     - `onDeactivate={() => { setDeactivatingUser(editingUser || null); setDeactivateDialogOpen(true); }}`
     - `onReactivate={() => { setReactivatingUser(editingUser || null); setReactivateDialogOpen(true); }}`
     - `isDeactivated={!!editingUser?.deleted_at}`
   - In `handleDeactivateConfirm` success path, also close the form: `setFormOpen(false); setEditingUser(undefined);`
   - In `handleReactivateConfirm` success path, also close the form: `setFormOpen(false); setEditingUser(undefined);`
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>All 5 admin table rows show only Edit button. Deactivate/Reactivate accessible only through FormDialog footer in edit mode. Confirmation dialogs still appear before deactivate/reactivate actions. Build passes clean.</done>
</task>

</tasks>

<verification>
1. TypeScript compilation passes: `npx tsc --noEmit`
2. Build succeeds: `npm run build`
3. Grep confirms no Deactivate/Reactivate in column files: `grep -r "Deactivate\|Reactivate" components/admin/*/company-columns.tsx components/admin/*/division-columns.tsx components/admin/*/location-columns.tsx components/admin/*/category-columns.tsx components/admin/*/user-columns.tsx` should return nothing
4. Grep confirms secondaryAction in EntityFormDialog: `grep "secondaryAction" components/admin/entity-form-dialog.tsx` should return matches
</verification>

<success_criteria>
- All 5 admin table rows render only a single "Edit" button
- No Deactivate/Reactivate buttons in any table row
- Edit FormDialog footer shows Deactivate (red, left-aligned) for active entities
- Edit FormDialog footer shows Reactivate (green, left-aligned) for deactivated entities
- Create FormDialog footer unchanged (no secondary action)
- Confirmation dialogs still fire before deactivate/reactivate proceeds
- TypeScript and build pass clean
</success_criteria>

<output>
After completion, create `.planning/quick/12-strip-admin-settings-table-rows-to-view-/12-SUMMARY.md`
</output>
