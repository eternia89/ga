---
phase: quick-74
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/types/maintenance.ts
  - app/(dashboard)/maintenance/page.tsx
  - components/maintenance/schedule-columns.tsx
  - components/maintenance/schedule-view-modal.tsx
autonomous: true
requirements: [QUICK-74]

must_haves:
  truths:
    - "Multi-company admin sees a Company column in the schedules table identifying which company each schedule belongs to"
    - "Company name is populated from the companies table via a join, not just a raw UUID"
    - "View modal client-side fetch also includes company data for consistency"
  artifacts:
    - path: "lib/types/maintenance.ts"
      provides: "MaintenanceSchedule type with company join"
      contains: "company?: { name: string } | null"
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "Company column in schedule table"
      contains: "company_name"
    - path: "app/(dashboard)/maintenance/page.tsx"
      provides: "Server-side company join in schedule query"
      contains: "company:companies(name)"
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Client-side company join in modal fetch"
      contains: "company:companies(name)"
  key_links:
    - from: "app/(dashboard)/maintenance/page.tsx"
      to: "companies table"
      via: "Supabase FK join in select"
      pattern: "company:companies\\(name\\)"
    - from: "components/maintenance/schedule-columns.tsx"
      to: "MaintenanceSchedule.company"
      via: "row.original.company?.name"
      pattern: "company\\?\\.name"
---

<objective>
Add a Company column to the maintenance schedules table so multi-company admins can distinguish which company each schedule belongs to.

Purpose: Multi-company users currently see schedules from all their accessible companies mixed together with no way to tell them apart. Adding a Company column resolves this UX issue.
Output: Updated type, query, column definition, and view modal fetch.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/types/maintenance.ts
@app/(dashboard)/maintenance/page.tsx
@components/maintenance/schedule-columns.tsx
@components/maintenance/schedule-view-modal.tsx

<interfaces>
<!-- Existing pattern from division-columns.tsx for Company column rendering -->
From components/admin/divisions/division-columns.tsx:
```typescript
{
  accessorKey: "company.name",
  id: "company_name",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Company" />
  ),
  cell: ({ row }) => {
    const division = row.original;
    return division.company?.name ? <span>{division.company.name}</span> : <span className="text-muted-foreground">—</span>;
  },
  size: 160,
},
```

From lib/types/maintenance.ts (MaintenanceSchedule type, lines 84-114):
```typescript
export type MaintenanceSchedule = {
  id: string;
  company_id: string;
  // ... other fields
  template?: { name: string; checklist: ChecklistItem[] } | null;
  asset?: { name: string; display_id: string } | null;
  category?: { name: string } | null;
  // NOTE: no company join yet
};
```

Supabase FK normalization pattern used in page.tsx (lines 122-140):
```typescript
const templateRaw = Array.isArray(s.template) ? s.template[0] : s.template;
const assetRaw = Array.isArray(s.asset) ? s.asset[0] : s.asset;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add company join to type, queries, and normalization</name>
  <files>lib/types/maintenance.ts, app/(dashboard)/maintenance/page.tsx, components/maintenance/schedule-view-modal.tsx</files>
  <action>
1. In `lib/types/maintenance.ts`, add `company?: { name: string } | null;` to `MaintenanceSchedule` type after the existing `category` optional join (around line 113).

2. In `app/(dashboard)/maintenance/page.tsx`:
   - Add `company:companies(name)` to the schedule select query (line 67, after the `asset:inventory_items(name, display_id)` line).
   - In the scheduleList mapping (line 122-140), add FK array normalization for company using the same pattern as template/asset:
     ```
     const companyRaw = Array.isArray(s.company) ? s.company[0] : s.company;
     ```
   - Include `company: companyRaw ? { name: companyRaw.name } : null` in the return object.

3. In `components/maintenance/schedule-view-modal.tsx`:
   - Add `company:companies(name)` to the client-side schedule fetch select query (around line 126, after the `asset:inventory_items(name, display_id)` line).
   - In the normalization block (around line 148-159), add:
     ```
     const companyRaw = Array.isArray(raw.company) ? raw.company[0] : raw.company;
     ```
   - Include `company: companyRaw ? { name: companyRaw.name } : null` in the `normalized` object.
  </action>
  <verify>npx tsc --noEmit 2>&1 | head -30</verify>
  <done>MaintenanceSchedule type includes company join, both server-side page query and client-side modal fetch include company:companies(name) with proper FK normalization</done>
</task>

<task type="auto">
  <name>Task 2: Add Company column to schedule table</name>
  <files>components/maintenance/schedule-columns.tsx</files>
  <action>
Add a Company column to `scheduleColumns` array in `schedule-columns.tsx`. Insert it after the `asset_name` column (after line 67) and before `interval_days`. Use the same pattern as `division-columns.tsx`:

```typescript
{
  accessorKey: 'company.name',
  id: 'company_name',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Company" />
  ),
  cell: ({ row }) => {
    const schedule = row.original;
    return schedule.company?.name ? (
      <span>{schedule.company.name}</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  },
  size: 160,
},
```

Show for all users (not conditionally) — keeps it simple and consistent. Single-company users will just see the same company name on every row.
  </action>
  <verify>npx tsc --noEmit 2>&1 | head -30</verify>
  <done>Company column appears in the schedule table between Asset and Interval columns, showing the company name from the joined relation</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npm run build` succeeds
- Schedule table renders with Company column showing company names
</verification>

<success_criteria>
- MaintenanceSchedule type includes `company?: { name: string } | null`
- Server-side schedule query joins `company:companies(name)`
- Client-side modal fetch query joins `company:companies(name)`
- Both queries normalize FK arrays for company using established pattern
- Schedule table has a Company column between Asset and Interval columns
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/74-fix-schedule-company-scoping-duplication/74-SUMMARY.md`
</output>
