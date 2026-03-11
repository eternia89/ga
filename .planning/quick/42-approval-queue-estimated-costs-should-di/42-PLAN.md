---
phase: quick-42
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/approvals/approval-queue.tsx
autonomous: true
requirements:
  - QUICK-42
must_haves:
  truths:
    - "Estimated cost in the approval queue table renders at the same font size as other table cells"
    - "Estimated cost text remains bold/semibold (font weight is preserved)"
  artifacts:
    - path: "components/approvals/approval-queue.tsx"
      provides: "Approval queue table with corrected cost cell styling"
      contains: "font-semibold"
  key_links:
    - from: "components/approvals/approval-queue.tsx"
      to: "TableCell (estimated cost)"
      via: "className on span wrapping formatIDR output"
      pattern: "font-semibold"
---

<objective>
Remove the oversized `text-base` class from the estimated cost cell in the approval queue table, reducing it to the default table cell font size while keeping `font-semibold` intact.

Purpose: The cost value was visually larger than all other cell content, breaking the visual rhythm of the table.
Output: Updated approval-queue.tsx with the corrected span className.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove text-base from estimated cost cell</name>
  <files>components/approvals/approval-queue.tsx</files>
  <action>
    In `components/approvals/approval-queue.tsx`, find the `<TableCell>` that renders `estimated_cost` (around line 195-199). The span currently reads:

    ```tsx
    <span className="font-semibold text-base">
    ```

    Change it to:

    ```tsx
    <span className="font-semibold">
    ```

    This removes `text-base` so the cost inherits the table's default text size (text-sm, matching all other cells), while `font-semibold` is preserved so the value still stands out visually.

    No other changes needed — do not touch font-weight, cell width, or any other styling.
  </action>
  <verify>
    <automated>grep -n "estimated_cost" /Users/melfice/code/ga-refactor/components/approvals/approval-queue.tsx</automated>
  </verify>
  <done>The span wrapping `formatIDR(job.estimated_cost)` has className `"font-semibold"` only (no `text-base`). Running `npm run build` produces no type errors.</done>
</task>

</tasks>

<verification>
Run `npm run build` — build must complete without errors.
Visually confirm: in the approval queue table, the Estimated Cost column text size matches the PIC, Date, and other text columns.
</verification>

<success_criteria>
- `text-base` removed from the estimated cost span
- `font-semibold` retained on the estimated cost span
- `npm run build` passes
</success_criteria>

<output>
After completion, create `.planning/quick/42-approval-queue-estimated-costs-should-di/42-SUMMARY.md`
</output>
