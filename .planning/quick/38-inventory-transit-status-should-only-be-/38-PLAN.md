---
phase: quick-38
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "'In Transit' badge appears exactly once per asset row — in the Status column only"
    - "Location column shows location name (or dash) with no transit indicator"
    - "Status column continues to show 'In Transit' badge via AssetStatusBadge when a pending transfer exists"
  artifacts:
    - path: "components/assets/asset-columns.tsx"
      provides: "Asset table column definitions"
      contains: "location_name column without transit badge"
  key_links:
    - from: "asset-columns.tsx location_name cell"
      to: "pendingTransfers meta"
      via: "pendingTransfer lookup"
      pattern: "pendingTransfer && .*Transit"
---

<objective>
Remove the duplicate "Transit" chip from the Location column in the asset table.

Purpose: "In Transit" status is already shown in the Status column via AssetStatusBadge. Showing a second indicator in the Location column is redundant and confusing.
Output: asset-columns.tsx with the Transit chip removed from location_name cell.
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
  <name>Task 1: Remove transit badge from Location column</name>
  <files>components/assets/asset-columns.tsx</files>
  <action>
    In the `location_name` column cell (around lines 70–95), remove the block that renders the "Transit" chip when a pending transfer exists. Specifically, delete:

    ```tsx
    {pendingTransfer && (
      <span
        className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 shrink-0"
        title={`In Transit to ${pendingTransfer.to_location?.name ?? 'unknown'}`}
      >
        Transit
      </span>
    )}
    ```

    After removal, the cell should only render the locationName span (or the muted-foreground dash). If `pendingTransfer` is no longer used anywhere else in the location cell after removal, also remove the `pendingTransfer` variable declaration from that cell. The `pendingTransfers` meta lookup in the `status` column (lines ~100–111) must remain untouched — that drives the correct AssetStatusBadge display.

    The wrapper `<div className="flex items-center gap-1.5">` can be simplified to just return the span directly since there is no longer a flex sibling, but keeping the div is also acceptable to minimize diff.
  </action>
  <verify>
    <automated>npm run lint -- --max-warnings=0</automated>
  </verify>
  <done>
    - Location column cell contains no reference to "Transit" text or the blue transit chip
    - Status column still renders AssetStatusBadge with showInTransit for pending transfers
    - No TypeScript or lint errors
  </done>
</task>

</tasks>

<verification>
After the change: open the asset inventory table with an asset that has a pending transfer. The "In Transit" badge should appear only in the Status column beside the active status badge. The Location column should display the location name with no transit chip.
</verification>

<success_criteria>
"In Transit" indicator appears exactly once per row (Status column) for assets with a pending transfer. Location column shows location name only.
</success_criteria>

<output>
After completion, create `.planning/quick/38-inventory-transit-status-should-only-be-/38-SUMMARY.md`
</output>
