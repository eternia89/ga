---
phase: quick-45
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-view-modal.tsx
  - components/jobs/job-modal.tsx
  - components/assets/asset-view-modal.tsx
  - components/maintenance/schedule-view-modal.tsx
  - components/maintenance/template-view-modal.tsx
autonomous: true
requirements: [QUICK-45]

must_haves:
  truths:
    - "Every view modal header shows the primary identifier (display_id or name) alone on line 1 in a large font"
    - "Every view modal header shows status badge + priority badge (if applicable) + 'Created {dd-MM-yyyy} by {name}' on line 2"
    - "Status badges appear on line 2 only, NOT alongside the display ID on line 1"
    - "Template modal shows inline active/inactive badge using consistent span classes on line 2"
    - "Asset modal shows creator name on line 2 (currently missing)"
    - "Schedule modal shows status badge on line 2 alongside created date and creator"
  artifacts:
    - path: "components/requests/request-view-modal.tsx"
      provides: "Two-line header: display_id (line 1) | status + priority + created by (line 2)"
    - path: "components/jobs/job-modal.tsx"
      provides: "Two-line header: display_id (line 1) | status + priority + PM badge + created by (line 2)"
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Two-line header: display_id (line 1) | status + created by (line 2)"
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Two-line header: template name (line 1) | status badge + created by (line 2)"
    - path: "components/maintenance/template-view-modal.tsx"
      provides: "Two-line header: template name (line 1) | active/inactive badge + created by (line 2)"
  key_links:
    - from: "Header div line 1"
      to: "display_id / name only"
      via: "h2 element — no badges in this row"
      pattern: "<h2.*font-mono"
    - from: "Header div line 2"
      to: "status badge + priority badge + date + creator"
      via: "p.text-sm.text-muted-foreground"
      pattern: "Created.*by|by.*Created"
---

<objective>
Audit and standardize the title bar across all 5 domain entity view modals (requests, jobs, assets, schedules, templates) to a consistent two-line format:
- Line 1: Primary identifier only (display_id for requests/jobs/assets; name for schedules/templates) — `h2` with `font-mono` where applicable
- Line 2: Status badge + priority badge (if entity has priority) + "Created {dd-MM-yyyy} by {name}"

Purpose: Consistent visual scanning across all modals — users know exactly where to look for status, priority, and authorship.
Output: 5 updated view modal files with identical header structure.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key facts from audit:

**Requests (request-view-modal.tsx) — PARTIALLY CORRECT**
- Line 1 row currently: display_id + status badge + priority badge (mixed)
- Line 2 currently: `requester.name · division.name · Created dd-MM-yyyy`
- Fix: Remove badges from line 1 row. Add them to line 2 before the creator text.

**Jobs (job-modal.tsx view mode) — PARTIALLY CORRECT**
- Line 1 row currently: display_id + status badge + priority badge + PM badge (mixed)
- Line 2 currently: `created_by_user.full_name · Created dd-MM-yyyy`
- Fix: Remove badges from line 1 row. Add them to line 2 before the creator text.

**Assets (asset-view-modal.tsx) — PARTIALLY CORRECT**
- Line 1 row currently: display_id + status badge (mixed, no priority badge — assets have no priority field)
- Line 2 currently: `asset.name · category · location · Created dd-MM-yyyy` — NO creator shown
- Fix: Remove status badge from line 1 row. Line 2: status badge + "Created {date} by {creator_name}". Need to fetch creator name (asset has `created_by` UUID — must add to Supabase select query).

**Schedules (schedule-view-modal.tsx) — STRUCTURALLY DIFFERENT**
- Line 1 row currently: template name (plain h2, no font-mono — schedules have no display_id) + status badge (mixed)
- Line 2 currently: `Asset: name (display_id) · interval · Created date` — no creator, no badge on line 2
- Fix: Remove status badge from line 1 row. Line 2: status badge + "Created {date} by {creator_name}". Need creator in select query.

**Templates (template-view-modal.tsx) — STRUCTURALLY DIFFERENT**
- Line 1 row currently: template name (plain h2, no font-mono) + inline active/inactive badge spans (mixed)
- Line 2 currently: `category · checklist items · Created date` — no creator
- Fix: Remove badge from line 1 row. Line 2: active/inactive badge + "Created {date} by {creator_name}". Need creator in select query.

**Assets DB field:** `inventory_items` has a `created_by` UUID column. Add `created_by_user:user_profiles!created_by(full_name)` to the select in fetchData.
**Schedules/Templates DB field:** Both tables have `created_by` UUID. Add `created_by_user:user_profiles!created_by(full_name)` to their select queries.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix request and job view modal headers</name>
  <files>components/requests/request-view-modal.tsx, components/jobs/job-modal.tsx</files>
  <action>
Apply the two-line header pattern to both request and job modals.

**request-view-modal.tsx — Header section (around line 538):**

Change the header content div from having badges on the SAME row as display_id to:

```tsx
{/* Header (non-scrollable) */}
<div className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
  {/* Prev/Next nav + line 1: display ID only */}
  <div className="flex flex-wrap items-center gap-3">
    {/* ... prev/next nav buttons unchanged ... */}
    <h2 className="text-xl font-bold tracking-tight font-mono">
      {request.display_id}
    </h2>
  </div>
  {/* Line 2: badges + creator + date */}
  <div className="flex flex-wrap items-center gap-2 mt-1">
    <RequestStatusBadge status={request.status} />
    {request.priority && <PriorityBadge priority={request.priority} />}
    <span className="text-sm text-muted-foreground">
      Created {format(new Date(request.created_at), 'dd-MM-yyyy')} by {request.requester?.name ?? 'Unknown'}
      {request.division?.name && ` · ${request.division.name}`}
    </span>
  </div>
  {/* Rejection reason callout — unchanged */}
  ...
</div>
```

The key change: badges move from the first `<div>` row (with display_id) into a NEW second `<div>` row, alongside the creator/date `<p>` (now converted to a flex row). Division name stays as context but moves to end of the text span.

**job-modal.tsx — Header section (around line 975, inside the view mode content block):**

Same pattern — find the header `<div className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">` for view mode and apply:
- Row 1: prev/next nav + h2 display_id only (remove JobStatusBadge, PriorityBadge, PM badge from this row)
- Row 2 (new div): `<JobStatusBadge />` + `{job.priority && <PriorityBadge />}` + PM badge span (if job_type === 'preventive_maintenance') + `<span className="text-sm text-muted-foreground">Created {format(...)} by {job.created_by_user?.full_name ?? 'Unknown'}</span>`

The existing `<p className="text-sm text-muted-foreground mt-1">` with creator+date gets replaced by this new flex div that contains the badges followed by the text span.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>Request and job view modals show display_id alone on line 1; status badge + priority badge + PM badge (jobs) + "Created {date} by {name}" appear together on line 2</done>
</task>

<task type="auto">
  <name>Task 2: Fix asset, schedule, and template view modal headers + add missing creator data</name>
  <files>components/assets/asset-view-modal.tsx, components/maintenance/schedule-view-modal.tsx, components/maintenance/template-view-modal.tsx</files>
  <action>
Apply two-line header pattern to the three remaining modals. All three need creator data added to their Supabase fetch queries.

**asset-view-modal.tsx:**
1. In `fetchData`, update the inventory_items select to add `created_by_user:user_profiles!created_by(full_name)`:
   ```
   '*, category:categories(name), location:locations(name), company:companies(name), created_by_user:user_profiles!created_by(full_name)'
   ```
2. Update `InventoryItemWithRelations` type usage — the fetched data will include `created_by_user: { full_name: string } | null`. Since this is cast via `unknown`, add a local type or use optional chaining: `(fetchedAsset as any).created_by_user?.full_name ?? 'Unknown'`. Store as a local state `const [creatorName, setCreatorName] = useState<string>('')` and set it after fetching.
3. Header: Row 1 = display_id only (remove AssetStatusBadge from this row). Row 2 = `<AssetStatusBadge status={asset.status} showInTransit={!!pendingTransfer} />` + `<span className="text-sm text-muted-foreground">Created {format(new Date(asset.created_at), 'dd-MM-yyyy')} by {creatorName}</span>`.

**schedule-view-modal.tsx:**
1. In fetchData, the maintenance_schedules select already has all fields — add `created_by_user:user_profiles!created_by(full_name)` to the select string.
2. Add `const [creatorName, setCreatorName] = useState<string>('')` state. After setting schedule, extract: `setCreatorName((scheduleResult.data as any).created_by_user?.full_name ?? 'Unknown')`.
3. Reset creatorName to '' in the else branch of the useEffect.
4. Header: Row 1 = template name only (remove ScheduleStatusBadge from this row). Row 2 (new flex div) = `<ScheduleStatusBadge schedule={{is_active: schedule.is_active, is_paused: schedule.is_paused, paused_reason: schedule.paused_reason}} />` + `<span className="text-sm text-muted-foreground">Created {format(new Date(schedule.created_at), 'dd-MM-yyyy')} by {creatorName}</span>`.
5. The old `<p>` with asset name + interval can stay as a third line for context, or optionally fold interval info into line 2 text. Keep it as a separate `<p className="text-sm text-muted-foreground mt-0.5">` below line 2 with just the asset/interval context.

**template-view-modal.tsx:**
1. In fetchData, add `created_by_user:user_profiles!created_by(full_name)` to the maintenance_templates select.
2. Add `const [creatorName, setCreatorName] = useState<string>('')` state. After setting template, extract creator name.
3. Reset creatorName to '' in else branch.
4. Header: Row 1 = template name only (h2, no font-mono — names not IDs). Row 2 (new flex div with `items-center gap-2 mt-1`) = active/inactive badge span + `<span className="text-sm text-muted-foreground">Created {format(new Date(template.created_at), 'dd-MM-yyyy')} by {creatorName}</span>`.
5. Remove the badge spans from the h2 row. The old `<p>` with category + checklist count can remain as a third line for context.

For all three files: ensure creatorName state is added at the top of the component near other state declarations, and reset properly on modal close.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>Asset, schedule, and template view modals show primary identifier on line 1; status badge + "Created {date} by {name}" on line 2. Build passes with no TypeScript errors.</done>
</task>

</tasks>

<verification>
After both tasks:
- `npm run build` passes with zero TypeScript errors
- Visually verify one of each modal type to confirm: line 1 = identifier only (no badges), line 2 = badge(s) + date + creator name
- Confirm request modal line 2 has: RequestStatusBadge, PriorityBadge (if set), "Created dd-MM-yyyy by Name · Division"
- Confirm job modal line 2 has: JobStatusBadge, PriorityBadge (if set), PM badge (if PM job), "Created dd-MM-yyyy by Name"
- Confirm asset modal line 2 has: AssetStatusBadge, "Created dd-MM-yyyy by Name"
- Confirm schedule modal line 2 has: ScheduleStatusBadge, "Created dd-MM-yyyy by Name"
- Confirm template modal line 2 has: active/inactive badge, "Created dd-MM-yyyy by Name"
</verification>

<success_criteria>
All 5 view modals implement identical two-line header structure. No badges appear alongside the display ID / name on line 1. Creator name is visible in all modals. Build is clean.
</success_criteria>

<output>
After completion, create `.planning/quick/45-all-view-modals-should-implement-a-consi/45-SUMMARY.md`
</output>
