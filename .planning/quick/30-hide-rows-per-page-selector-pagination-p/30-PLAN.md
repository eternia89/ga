---
phase: quick-30
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/data-table/data-table-pagination.tsx
autonomous: true
requirements: [QUICK-30]

must_haves:
  truths:
    - "Pagination footer is completely hidden when total data fits within one page"
    - "Pagination footer appears normally when data exceeds the current page size"
    - "All tables using DataTable automatically inherit this behavior"
  artifacts:
    - path: "components/data-table/data-table-pagination.tsx"
      provides: "Conditional pagination rendering"
      contains: "return null"
  key_links:
    - from: "components/data-table/data-table.tsx"
      to: "components/data-table/data-table-pagination.tsx"
      via: "DataTablePagination component"
      pattern: "DataTablePagination"
---

<objective>
Hide the entire pagination footer (rows-per-page selector, page numbers, Previous/Next buttons, page info text) when the total data count does not exceed the current page size — i.e., when there is only one page of data.

Purpose: Reduce visual clutter on tables with few rows. The pagination controls are meaningless when all data fits on one page.
Output: Updated DataTablePagination component with early return when totalPages <= 1.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/data-table/data-table.tsx
@components/data-table/data-table-pagination.tsx
</context>

<interfaces>
From components/data-table/data-table-pagination.tsx:
```typescript
interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}
```

From components/data-table/data-table.tsx:
- DataTable renders `<DataTablePagination table={table} />` unconditionally at line 183
- Default pageSize is 50
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Hide pagination footer when data fits on one page</name>
  <files>components/data-table/data-table-pagination.tsx</files>
  <action>
Add an early return at the top of the DataTablePagination component body, after the existing variable declarations (totalRows, totalPages, etc.).

The condition: if `totalPages <= 1`, return `null`. This hides the entire pagination footer — rows-per-page selector, page number buttons, Previous/Next buttons, and the "Showing X to Y of Z rows" text.

Place the guard after the `totalPages` variable is computed (line 23) so it has access to the value. Specifically, add after line 27 (`const endRow = ...`):

```typescript
// Hide entire pagination footer when all data fits on one page
if (totalPages <= 1) {
  return null;
}
```

No changes needed to data-table.tsx — it already renders DataTablePagination unconditionally, and returning null from the child is the cleanest approach.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Pagination footer hidden when totalPages <= 1. Tables with data count at or below pageSize (default 50) show no pagination. Tables exceeding pageSize show full pagination as before.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors
2. `npm run build` succeeds
</verification>

<success_criteria>
- Pagination footer is completely absent when data fits on one page
- Pagination footer renders normally when data exceeds one page
- No TypeScript errors
- Change applies to ALL tables automatically (single component modification)
</success_criteria>

<output>
After completion, create `.planning/quick/30-hide-rows-per-page-selector-pagination-p/30-SUMMARY.md`
</output>
