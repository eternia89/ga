---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/companies/company-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/categories/category-columns.tsx
  - components/assets/asset-columns.tsx
  - components/maintenance/template-columns.tsx
  - components/maintenance/schedule-columns.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "All data tables show row actions as direct ghost text buttons, not inside a dropdown menu"
    - "No MoreHorizontal / three-dot icon trigger exists in any column file"
    - "Action button styling is consistent across all tables (h-7 px-2 text-xs ghost variant)"
  artifacts:
    - path: "components/admin/companies/company-columns.tsx"
      provides: "Ghost button row actions for companies"
      contains: "variant=\"ghost\""
    - path: "components/admin/divisions/division-columns.tsx"
      provides: "Ghost button row actions for divisions"
      contains: "variant=\"ghost\""
    - path: "components/admin/locations/location-columns.tsx"
      provides: "Ghost button row actions for locations"
      contains: "variant=\"ghost\""
    - path: "components/admin/categories/category-columns.tsx"
      provides: "Ghost button row actions for categories"
      contains: "variant=\"ghost\""
    - path: "components/assets/asset-columns.tsx"
      provides: "Ghost button row actions for assets"
      contains: "variant=\"ghost\""
    - path: "components/maintenance/template-columns.tsx"
      provides: "Consistent ghost button row actions for templates"
      contains: "variant=\"ghost\""
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "Consistent ghost button row actions for schedules"
      contains: "variant=\"ghost\""
  key_links: []
---

<objective>
Replace all dropdown/context menu row actions and inconsistent plain button row actions with direct ghost text buttons matching the user-columns.tsx pattern.

Purpose: Consistent, faster-to-discover row actions across all data tables -- no hidden menus, one click instead of two.
Output: 7 updated column files, zero DropdownMenu imports remaining in column files.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/admin/users/user-columns.tsx (REFERENCE -- this is the target pattern)
@components/requests/request-columns.tsx (already correct -- another reference)
@components/jobs/job-columns.tsx (already correct -- another reference)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert admin settings tables (company, division, location, category) from DropdownMenu to ghost buttons</name>
  <files>
    components/admin/companies/company-columns.tsx
    components/admin/divisions/division-columns.tsx
    components/admin/locations/location-columns.tsx
    components/admin/categories/category-columns.tsx
  </files>
  <action>
For each of the 4 admin settings column files, replace the DropdownMenu-based actions column with direct ghost text buttons.

**Pattern to follow** (from user-columns.tsx):
```tsx
<div className="flex items-center gap-1">
  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={...}>
    Edit
  </Button>
  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={...}>
    Delete
  </Button>
</div>
```

**For each file specifically:**

1. **company-columns.tsx**: Remove DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, MoreHorizontal imports. Keep Button import. In actions cell: show "Edit" + "Delete" buttons when active (!isDeactivated), show "Restore" button (text-green-600 hover:text-green-700) when deactivated. Increase actions column size from implicit to `size: 120`.

2. **division-columns.tsx**: Same pattern as company. Remove all DropdownMenu imports and MoreHorizontal. Show "Edit" + "Delete" when active, "Restore" when deactivated. Add `size: 120`.

3. **location-columns.tsx**: Same pattern as company/division. Remove all DropdownMenu imports and MoreHorizontal. Show "Edit" + "Delete" when active, "Restore" when deactivated. Add `size: 120`.

4. **category-columns.tsx**: Same pattern. Remove all DropdownMenu imports and MoreHorizontal. Show "Edit" + "Delete" when active, "Restore" when deactivated. Add `size: 120`.

**Destructive actions** (Delete) use: `className="h-7 px-2 text-xs text-destructive hover:text-destructive"`
**Positive actions** (Restore) use: `className="h-7 px-2 text-xs text-green-600 hover:text-green-700"`
**Neutral actions** (Edit) use: `className="h-7 px-2 text-xs"`

All buttons: `variant="ghost" size="sm"`
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no TypeScript errors. Grep all 4 files to confirm zero DropdownMenu or MoreHorizontal references remain.</verify>
  <done>All 4 admin settings column files use direct ghost text buttons for row actions with no dropdown menus.</done>
</task>

<task type="auto">
  <name>Task 2: Convert asset-columns from DropdownMenu and normalize maintenance columns to use shadcn Button</name>
  <files>
    components/assets/asset-columns.tsx
    components/maintenance/template-columns.tsx
    components/maintenance/schedule-columns.tsx
  </files>
  <action>
**asset-columns.tsx** -- Full conversion from DropdownMenu to ghost buttons:
- Remove DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, MoreHorizontal, Eye, Edit imports.
- Replace actions cell with direct ghost text buttons matching user-columns.tsx pattern:
  - "View" button (always shown, calls `meta?.onView?.(asset)`)
  - "Edit" button (shown when canEdit, calls `meta?.onEdit?.(asset)`)
- Both buttons: `variant="ghost" size="sm" className="h-7 px-2 text-xs"`
- Update column `size` from 60 to 120.

**template-columns.tsx** -- Normalize plain `<button>` to shadcn `<Button>`:
- Add `import { Button } from '@/components/ui/button';`
- Replace the plain `<button>` elements with `<Button variant="ghost" size="sm" className="h-7 px-2 text-xs ...">` matching the established pattern.
- Deactivate button: add `text-destructive hover:text-destructive` class.
- Reactivate button: add `text-green-600 hover:text-green-700` class.
- Change wrapper from `gap-2` to `gap-1` for consistency.

**schedule-columns.tsx** -- Normalize plain `<button>` to shadcn `<Button>`:
- Add `import { Button } from '@/components/ui/button';`
- Replace the plain `<button>` elements with `<Button variant="ghost" size="sm" className="h-7 px-2 text-xs ...">` matching the established pattern.
- Deactivate button: add `text-destructive hover:text-destructive` class.
- Activate button: add `text-green-600 hover:text-green-700` class.
- Delete button: add `text-destructive hover:text-destructive` class.
- Change wrapper from `gap-2` to `gap-1` for consistency.
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no TypeScript errors. Grep all column files for DropdownMenu and MoreHorizontal -- should return zero matches. Grep for `variant="ghost"` in actions cells of all 7 modified files -- should match.</verify>
  <done>All 7 column files use consistent shadcn Button ghost text pattern for row actions. Zero DropdownMenu usage remains in any column file. Template and schedule columns use proper Button components instead of plain HTML buttons.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. Zero `MoreHorizontal` imports across all *-columns.tsx files
4. Zero `DropdownMenu` imports across all *-columns.tsx files
5. All action buttons use `variant="ghost" size="sm" className="h-7 px-2 text-xs"` pattern
</verification>

<success_criteria>
Every data table in the application shows row actions as direct ghost text buttons in the row. No dropdown/context menus remain for row actions. Styling is consistent across all tables: h-7 height, px-2 padding, text-xs size, ghost variant, with destructive coloring for dangerous actions and green for restore/activate actions.
</success_criteria>

<output>
After completion, create `.planning/quick/1-extract-context-menu-to-be-shown-directl/1-SUMMARY.md`
</output>
