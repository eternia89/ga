---
phase: quick-26
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/users/user-columns.tsx
autonomous: true
requirements: [QUICK-26]

must_haves:
  truths:
    - "Role badge appears beside the user name in the same table cell"
    - "Division column is no longer visible in the users table"
    - "Last Login column is no longer visible in the users table"
    - "Name cell still shows email below the name"
  artifacts:
    - path: "components/admin/users/user-columns.tsx"
      provides: "Updated user table column definitions"
      contains: "roleColors"
  key_links:
    - from: "components/admin/users/user-columns.tsx"
      to: "components/admin/users/user-table.tsx"
      via: "getUserColumns import"
      pattern: "getUserColumns"
---

<objective>
Refine the users table columns: move role badge inline with user name, remove Division and Last Login columns.

Purpose: Reduce table width and surface role information more prominently alongside the user's name.
Output: Updated user-columns.tsx with fewer columns and role badge in name cell.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/admin/users/user-columns.tsx
@components/admin/users/user-table.tsx
</context>

<interfaces>
<!-- Reference pattern from request-columns.tsx for inline badge in cell -->
From components/requests/request-columns.tsx:
```tsx
cell: ({ row }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-xs">{row.getValue('display_id')}</span>
    <RequestStatusBadge status={row.original.status} />
  </div>
),
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Move role badge to name cell and remove Division + Last Login columns</name>
  <files>components/admin/users/user-columns.tsx</files>
  <action>
In `getUserColumns` within `user-columns.tsx`:

1. **Move role badge into the `full_name` column cell.** Update the cell renderer to show the name with the role badge beside it (using `flex items-center gap-2` wrapper around name+badge), and email below on its own line. Keep the existing `roleColors` and `roleDisplay` maps. The structure should be:
   ```
   <div>
     <div className="flex items-center gap-2">
       <span className="font-medium">{name}</span>
       <Badge variant="secondary" className={roleColors[role]}>
         {roleDisplay[role]}
       </Badge>
     </div>
     <span className="block text-xs text-muted-foreground">{email}</span>
   </div>
   ```

2. **Remove the standalone `role` column definition** (the one with `accessorKey: 'role'` around line 80-91). The role info is now in the name cell.

3. **Remove the `division` column definition** (the one with `accessorKey: 'division'` around line 93-99).

4. **Remove the `last_sign_in_at` column definition** (the one with `accessorKey: 'last_sign_in_at'` around line 137-144).

Keep all other columns (select, location, deleted_at/Status, company_id hidden, company_name, created_at, actions) unchanged.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Users table shows role badge beside user name in same cell; Division and Last Login columns are removed; TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- Visual check: users table has columns: checkbox, Name (with role badge + email), Location, Status, Company, Created, Actions
</verification>

<success_criteria>
- Role badge renders inline beside user name in the Name column cell
- No separate Role, Division, or Last Login columns exist
- No TypeScript or build errors
</success_criteria>

<output>
After completion, create `.planning/quick/26-users-table-role-beside-name-remove-divi/26-SUMMARY.md`
</output>
