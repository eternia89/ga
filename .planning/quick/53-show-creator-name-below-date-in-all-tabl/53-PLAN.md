---
phase: quick-53
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-columns.tsx
  - components/jobs/job-columns.tsx
autonomous: true
requirements: [QUICK-53]

must_haves:
  truths:
    - "In the Requests table, the Created column shows the date on line 1 and 'by {requester name}' in muted xs text on line 2"
    - "In the Jobs table, the Created column shows the date on line 1 and 'by {creator name}' in muted xs text on line 2"
    - "If the creator name is unavailable, only the date is shown (no 'by —' fallback)"
  artifacts:
    - path: "components/requests/request-columns.tsx"
      provides: "Two-line Created cell for requests table"
      contains: "by.*requester"
    - path: "components/jobs/job-columns.tsx"
      provides: "Two-line Created cell for jobs table"
      contains: "by.*created_by_user"
  key_links:
    - from: "components/requests/request-columns.tsx"
      to: "row.original.requester?.name"
      via: "RequestWithRelations (already in query select)"
      pattern: "requester\\?\\."
    - from: "components/jobs/job-columns.tsx"
      to: "row.original.created_by_user?.full_name"
      via: "JobWithRelations (already in query select)"
      pattern: "created_by_user\\?\\."
---

<objective>
Add a second line "by {creator name}" below the date in the Created column of all domain entity tables that currently show a Created column: Requests and Jobs.

Purpose: Makes it immediately visible who created each row without opening the detail view — reduces context-switching for power users scanning tables.
Output: Two-line Created cells in request-columns.tsx and job-columns.tsx.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Creator fields already fetched — no query changes needed. -->

From components/requests/request-columns.tsx (RequestWithRelations):
```typescript
// requester is already selected in app/(dashboard)/requests/page.tsx:
// 'requester:user_profiles!requester_id(name:full_name, email)'
row.original.requester?.name  // string | undefined
```

From components/jobs/job-columns.tsx (JobWithRelations):
```typescript
// created_by_user is already selected in app/(dashboard)/jobs/page.tsx:
// 'created_by_user:user_profiles!created_by(full_name)'
row.original.created_by_user?.full_name  // string | undefined
```

Tables NOT in scope:
- asset-columns.tsx: no "Created" column exists
- schedule-columns.tsx: no "Created" column exists
- template-columns.tsx: maintenance_templates DB table has no created_by FK column — cannot show creator
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add creator second line to Requests Created column</name>
  <files>components/requests/request-columns.tsx</files>
  <action>
In the `created_at` column cell (around line 145-149), replace the plain date return with a `<div>` block containing two lines:
- Line 1: date formatted as `dd-MM-yyyy` (existing logic, no change)
- Line 2: conditionally render `<span className="text-xs text-muted-foreground">by {requester.name}</span>` only when `row.original.requester?.name` is truthy

The final cell render should look like:
```tsx
cell: ({ row }) => {
  const date = row.getValue('created_at') as string;
  const creatorName = row.original.requester?.name;
  return (
    <div className="flex flex-col gap-0.5">
      <span>{format(new Date(date), 'dd-MM-yyyy')}</span>
      {creatorName && (
        <span className="text-xs text-muted-foreground">by {creatorName}</span>
      )}
    </div>
  );
},
```

Increase `size` from `100` to `130` to accommodate the wider two-line cell.

Do NOT change the `accessorKey`, header, or any other column definition.
  </action>
  <verify>
    <automated>npm run build 2>&1 | grep -E "error|Error" | grep -v "^warn" || echo "BUILD OK"</automated>
  </verify>
  <done>Created column in requests table renders date + "by {name}" on separate line with muted xs text. If requester is null, only the date appears.</done>
</task>

<task type="auto">
  <name>Task 2: Add creator second line to Jobs Created column</name>
  <files>components/jobs/job-columns.tsx</files>
  <action>
In the `created_at` column cell (around line 165-169), replace the existing `<span className="text-sm">` return with a `<div>` block containing two lines:
- Line 1: date formatted as `dd-MM-yyyy` with `text-sm` styling (preserve existing)
- Line 2: conditionally render `<span className="text-xs text-muted-foreground">by {creatorName}</span>` only when `row.original.created_by_user?.full_name` is truthy

The final cell render should look like:
```tsx
cell: ({ row }) => {
  const date = row.getValue('created_at') as string;
  const creatorName = row.original.created_by_user?.full_name;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>
      {creatorName && (
        <span className="text-xs text-muted-foreground">by {creatorName}</span>
      )}
    </div>
  );
},
```

Increase `size` from `100` to `130` to accommodate the wider two-line cell.

Do NOT change the `accessorKey`, header, or any other column definition.
  </action>
  <verify>
    <automated>npm run build 2>&1 | grep -E "error|Error" | grep -v "^warn" || echo "BUILD OK"</automated>
  </verify>
  <done>Created column in jobs table renders date + "by {name}" on separate line with muted xs text. If created_by_user is null, only the date appears.</done>
</task>

</tasks>

<verification>
After both tasks:
1. `npm run build` completes with no TypeScript errors
2. Visit `/requests` — Created column shows date on line 1, "by {name}" in muted small text on line 2 for each row
3. Visit `/jobs` — same two-line pattern appears in the Created column
4. Rows where creator data is missing show only the date (no broken fallback)
</verification>

<success_criteria>
- `npm run build` passes with zero errors
- Both request and job tables show "by {creator}" below the date in the Created column
- Creator name uses `text-xs text-muted-foreground` for visual hierarchy (subtler than date)
- No changes to server data fetching (creator data is already in the existing Supabase select queries)
</success_criteria>

<output>
After completion, create `.planning/quick/53-show-creator-name-below-date-in-all-tabl/53-SUMMARY.md`
</output>
