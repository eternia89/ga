---
phase: quick-73
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/maintenance/schedules/[id]/page.tsx
  - components/maintenance/schedule-detail.tsx
autonomous: true
requirements: [QUICK-73]

must_haves:
  truths:
    - "Asset name is NOT visible in the page header area (below h1)"
    - "Asset name with link is visible as a read-only field in the body/details section for both managers and non-managers"
    - "Header shows only the template name (h1) with no asset subtitle"
  artifacts:
    - path: "app/(dashboard)/maintenance/schedules/[id]/page.tsx"
      provides: "Schedule detail page header without asset name"
    - path: "components/maintenance/schedule-detail.tsx"
      provides: "Schedule detail body with asset read-only field for all users"
  key_links:
    - from: "app/(dashboard)/maintenance/schedules/[id]/page.tsx"
      to: "components/maintenance/schedule-detail.tsx"
      via: "ScheduleDetail component receives schedule prop with asset data"
      pattern: "<ScheduleDetail"
---

<objective>
Move the asset name + link from the schedule detail page header into the body/details area as a read-only field.

Purpose: The asset name currently appears as a subtitle in the header. It belongs in the body section alongside other schedule fields (Company, Template, etc.) for a cleaner layout consistent with other detail pages.
Output: Updated page.tsx (header simplified) and schedule-detail.tsx (asset field added to body for all user roles).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(dashboard)/maintenance/schedules/[id]/page.tsx
@components/maintenance/schedule-detail.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move asset name from header to body section</name>
  <files>app/(dashboard)/maintenance/schedules/[id]/page.tsx, components/maintenance/schedule-detail.tsx</files>
  <action>
**In `app/(dashboard)/maintenance/schedules/[id]/page.tsx`:**
- Remove lines 128-143 (the `{schedule.item_id && assetName ? (...)` block and the `!schedule.item_id` fallback paragraph) from the header section.
- Keep only the `<h1>` with `templateName` inside the `<div>` wrapper. The header `<div>` should contain just: `<h1 className="text-2xl font-bold tracking-tight">{templateName}</h1>`.
- The breadcrumb logic (line 118-120, breadcrumbTitle) can remain as-is since it uses template+asset for breadcrumb context which is fine.

**In `components/maintenance/schedule-detail.tsx`:**
- Add a read-only "Asset" field in the body section, placed AFTER the Company field (line 143) and BEFORE the status bar section (line 145).
- The asset field should render for ALL users (both managers and non-managers), not inside the `canManage` conditional.
- Use the same disabled Input + label pattern as the Company field for consistency:
  ```
  <div className="space-y-2">
    <label className="text-sm font-medium">Asset</label>
    {schedule.item_id && schedule.asset?.name ? (
      <div className="flex items-center gap-2">
        <Input
          value={`${schedule.asset.name}${schedule.asset.display_id ? ` (${schedule.asset.display_id})` : ''}`}
          disabled
          className="bg-muted text-muted-foreground cursor-not-allowed"
        />
        <a href={`/inventory/${schedule.item_id}`} className="text-blue-600 hover:underline text-sm whitespace-nowrap shrink-0">View Asset</a>
      </div>
    ) : (
      <Input
        value="No asset (general schedule)"
        disabled
        className="bg-muted text-muted-foreground cursor-not-allowed"
      />
    )}
  </div>
  ```
- For the NON-manager read-only view (the `<>` block starting at line 260): remove the Asset `<div>` from the grid layout (lines 283-300) since the asset is now shown above in the shared section. Keep Template, Interval, Type, Auto-create Before Due, Next Due, and Last Completed in the grid.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
- Asset name no longer appears in the page header (page.tsx header contains only h1 with template name)
- Asset name with link appears as a read-only disabled Input field in the body section of schedule-detail.tsx, placed after Company field
- Asset field is visible to all users (managers and non-managers)
- Non-manager read-only grid no longer has duplicate asset field
- TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- `npm run lint` passes
- Visual: Schedule detail page header shows only template name
- Visual: Body section shows Company field, then Asset field (with "View Asset" link for asset-linked schedules, or "No asset" for general schedules), then status bar and form
</verification>

<success_criteria>
Asset name is displayed exclusively in the body/details area of the schedule detail page, not in the header. The change applies to both the manager (editable form) and non-manager (read-only) views.
</success_criteria>

<output>
After completion, create `.planning/quick/73-move-asset-name-from-schedule-detail-hea/73-SUMMARY.md`
</output>
