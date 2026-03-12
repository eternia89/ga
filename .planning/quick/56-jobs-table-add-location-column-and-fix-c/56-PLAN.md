---
phase: quick-56
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-columns.tsx
autonomous: true
requirements:
  - QUICK-56
must_haves:
  truths:
    - "Jobs table shows ID and Status as two distinct separate columns"
    - "Status column width is fixed to fit the longest status label (no wrapping)"
    - "Jobs table shows a Location column with the job's location name"
    - "Column order is: ID, Status, Photo, Title, Location, Priority, PIC, Created, Actions"
  artifacts:
    - path: "components/jobs/job-columns.tsx"
      provides: "Updated jobColumns array with separated ID/Status and new Location column"
      contains: "accessorKey: 'status'"
  key_links:
    - from: "job-columns.tsx status column"
      to: "JobWithRelations.status"
      via: "row.getValue('status')"
      pattern: "accessorKey.*status"
    - from: "job-columns.tsx location column"
      to: "JobWithRelations.location"
      via: "row.original.location?.name"
      pattern: "location.*name"
---

<objective>
Restructure the Jobs table columns to: (1) split the combined ID+Status cell into two distinct columns, (2) add a Location column, and (3) fix column order to match the Requests table pattern.

Purpose: Consistent table layout across Requests and Jobs, making Status scannable as its own column and surfacing Location as a first-class visible field.
Output: Updated job-columns.tsx with new column structure.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Key types the executor needs. No codebase exploration required. -->

From lib/types/database.ts:
```typescript
export interface JobWithRelations extends Job {
  location?: { name: string } | null;
  category?: { name: string } | null;
  pic?: { full_name: string } | null;
  created_by_user?: { full_name: string } | null;
  job_requests?: Array<{ request: { id: string; display_id: string; ... } }>;
  maintenance_schedule?: { id: string; next_due_at: string | null; ... } | null;
}
// Job.status is a string (e.g., 'created', 'assigned', 'in_progress', 'pending_approval',
// 'approved', 'pending_completion_approval', 'completed', 'accepted', 'closed', 'cancelled')
```

The data query in app/(dashboard)/jobs/page.tsx already selects `location:locations(name)` so
`row.original.location` is populated at runtime — no query changes needed.

Existing imports in job-columns.tsx already include:
- JobStatusBadge (from './job-status-badge') — use for the new standalone Status column
- PM_BADGE_CLASS, OverdueBadge — keep in Title column
- PriorityBadge, DataTableColumnHeader — unchanged
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure job-columns.tsx — split ID/Status, add Location, fix order</name>
  <files>components/jobs/job-columns.tsx</files>
  <action>
Rewrite the `jobColumns` array in components/jobs/job-columns.tsx with the following column order and structure:

1. **ID column** (`accessorKey: 'display_id'`, `size: 160`):
   Cell renders only `<span className="font-mono text-xs">{row.getValue('display_id')}</span>` — no status badge here.

2. **Status column** (`accessorKey: 'status'`, `size: 150`):
   Header is plain text "Status" (no sortable header needed).
   Cell renders `<JobStatusBadge status={row.getValue('status') as string} />`.
   Size 150 to accommodate the longest label without wrapping (e.g., "Pending Completion Approval").
   `enableSorting: false`.

3. **Photo column** — keep exactly as-is (no changes).

4. **Title column** (`accessorKey: 'title'`, `size: 220`, `meta: { grow: true }`):
   Keep the existing PM badge + OverdueBadge rendering logic exactly as-is.

5. **Location column** (`id: 'location_name'`, `size: 130`):
   `accessorFn: (row) => row.original.location?.name ?? null` — wait, use:
   ```tsx
   accessorFn: (row) => row.location?.name ?? null,
   ```
   Header: plain text "Location".
   Cell:
   ```tsx
   cell: ({ row }) => {
     const name = row.original.location?.name;
     return name ? (
       <span className="truncate block max-w-[130px]" title={name}>{name}</span>
     ) : (
       <span className="text-muted-foreground">—</span>
     );
   },
   ```
   `enableSorting: false`.

6. **Priority column** — keep exactly as-is (`size: 90`).

7. **PIC column** (`id: 'pic_name'`) — keep exactly as-is (`size: 120`).

8. **Created column** (`accessorKey: 'created_at'`) — keep exactly as-is (`size: 130`).

9. **Actions column** (`id: 'actions'`) — keep exactly as-is.

REMOVE the "Linked Requests" column entirely — it is not part of the target column pattern and clutters the table.

Do NOT change any imports beyond what is needed. The existing imports already cover all needed components.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Build passes with no TypeScript errors
    - jobColumns array has 9 columns in order: display_id, status, photo, title, location_name, priority, pic_name, created_at, actions
    - Status column is separate from ID column
    - Location column renders location name or "—" dash
    - Linked Requests column is gone
  </done>
</task>

</tasks>

<verification>
After task completes:
1. `npm run build` exits 0 with no TS errors
2. Visually inspect jobs table at /jobs — confirm columns appear in correct order with Status as its own badge column
3. Confirm location names appear in Location column for jobs that have a location assigned
</verification>

<success_criteria>
Jobs table column structure matches the specified pattern: ID | Status | (photo) | Title | Location | Priority | PIC | Created | Actions — each as a distinct column with appropriate fixed widths.
</success_criteria>

<output>
After completion, create `.planning/quick/56-jobs-table-add-location-column-and-fix-c/56-SUMMARY.md`
</output>
