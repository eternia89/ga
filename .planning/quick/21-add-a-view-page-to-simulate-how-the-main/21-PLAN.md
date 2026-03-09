---
phase: quick-21
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/maintenance/pm-checklist-preview.tsx
  - app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx
  - components/maintenance/schedule-detail.tsx
autonomous: true
requirements: [QUICK-21]

must_haves:
  truths:
    - "GA Lead can click 'Preview Form' on schedule detail page and see the checklist form"
    - "All 6 checklist item types render with interactive input controls"
    - "Header shows asset name, template name, due date, and assigned user"
    - "No submit/save button exists — form is purely ephemeral"
    - "Values entered are not persisted anywhere"
  artifacts:
    - path: "components/maintenance/pm-checklist-preview.tsx"
      provides: "Preview checklist component with local-only state"
    - path: "app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx"
      provides: "Server page that loads schedule data and renders preview"
  key_links:
    - from: "components/maintenance/schedule-detail.tsx"
      to: "/maintenance/schedules/[id]/preview"
      via: "Preview Form button link"
      pattern: "Preview Form"
    - from: "app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx"
      to: "components/maintenance/pm-checklist-preview.tsx"
      via: "imports and renders PMChecklistPreview"
      pattern: "PMChecklistPreview"
---

<objective>
Add a "Preview Form" page accessible from the schedule detail page that simulates how a technician will experience filling out the PM checklist when the schedule is due.

Purpose: Let GA Leads evaluate the checklist UX with real schedule context (asset, template, due date, assignee) before schedules go live.
Output: New preview page + preview checklist component + "Preview Form" button on schedule detail.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@lib/types/maintenance.ts
@components/maintenance/pm-checklist-item.tsx
@components/maintenance/pm-checklist.tsx
@components/maintenance/schedule-detail.tsx
@app/(dashboard)/maintenance/schedules/[id]/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PMChecklistPreview component and preview page</name>
  <files>
    components/maintenance/pm-checklist-preview.tsx
    app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx
  </files>
  <action>
**Create `components/maintenance/pm-checklist-preview.tsx`:**

A client component that renders the template checklist items with fully interactive inputs but NO server persistence. Reuse the same 6 input control types from `pm-checklist-item.tsx` but without the `savePMChecklistItem` server action call. Instead, all state is local via useState.

Props:
- `templateName: string`
- `checklist: ChecklistItem[]` (from `lib/types/maintenance.ts`)
- `assetName: string`
- `assetDisplayId: string`
- `nextDueAt: string | null`
- `assignedUserName: string | null`

Structure:
1. **Info header card** — rounded-lg border p-6:
   - Template name as h2 font-semibold
   - Grid (2 cols desktop, 1 col max-md) showing: Asset (name + display_id), Due Date (formatted dd-MM-yyyy or "Not scheduled"), Assigned To (user name or "Unassigned")
   - Yellow info banner: "This is a preview — values entered here are not saved."

2. **Checklist items section** — reuse the visual pattern from `pm-checklist.tsx`:
   - Progress bar (completedCount / totalCount) tracking local state
   - Each checklist item rendered with type-appropriate interactive input:
     - `checkbox`: Checkbox toggle (local boolean state)
     - `pass_fail`: Pass/Fail button pair (local 'pass'|'fail'|null state)
     - `numeric`: Number Input with unit label if present (local number state)
     - `text`: Textarea (local string state)
     - `photo`: File input area with thumbnail preview (local File[] state, no upload — just show selected files as object URLs)
     - `dropdown`: Select with options from the ChecklistItem.options array (local string state)
   - Each item shows label, type badge, completion indicator (green check when filled)
   - NO "Saving..." or "Saved" indicators — replace with nothing since state is local

3. **No submit button** — the bottom of the form should have a muted text: "End of checklist — {N} items total"

Convert ChecklistItem[] to ChecklistResponse[] shape for rendering by mapping: `{ item_id: item.id, type: item.type, label: item.label, value: null, ...(item.type === 'numeric' ? { unit: item.unit } : {}), ...(item.type === 'dropdown' ? { options: item.options } : {}) }`

For the individual item rendering, create a `PreviewChecklistItem` sub-component that mirrors `PMChecklistItem` structure but calls a local `onValueChange(itemId, value)` callback instead of the server action. Reuse the same visual controls (Checkbox, Pass/Fail buttons, Input, Textarea, Select) and the same Tailwind classes from pm-checklist-item.tsx for visual consistency.

**Create `app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx`:**

Server component page that:
1. Auth check (getUser + profile fetch, redirect if not authenticated)
2. Fetch schedule with template + asset joins (same query as schedules/[id]/page.tsx)
3. Fetch assigned user's full_name from user_profiles if assigned_to is set: `supabase.from('user_profiles').select('full_name').eq('id', schedule.assigned_to).single()`
4. Render breadcrumbs: Maintenance > Schedules > {templateName} - {assetName} > Preview Form
5. Page header: "Preview Form" as h1 with a "Back to Schedule" link button pointing to `/maintenance/schedules/{id}`
6. Render `<PMChecklistPreview>` with the real schedule data

Import pattern: `import { SetBreadcrumbs } from '@/lib/breadcrumb-context'`
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>Preview page renders at /maintenance/schedules/[id]/preview with all 6 checklist item types interactive and no persistence. Header shows real schedule context.</done>
</task>

<task type="auto">
  <name>Task 2: Add "Preview Form" button to schedule detail page</name>
  <files>
    components/maintenance/schedule-detail.tsx
  </files>
  <action>
In `components/maintenance/schedule-detail.tsx`, add a "Preview Form" button in the status bar section (the `flex items-center justify-between` div at the top of the component, around line 130-142).

Add the button next to the existing action buttons (Pause/Resume/Deactivate), visible to `canManage` roles (ga_lead, admin). Use a Link component from next/link:

```tsx
import Link from 'next/link';
```

Inside the `{canManage && !showDeleteConfirm && (` block, before the existing Pause/Deactivate buttons, add:

```tsx
<Link href={`/maintenance/schedules/${schedule.id}/preview`}>
  <Button type="button" variant="outline" size="sm">
    Preview Form
  </Button>
</Link>
```

The button should only render when the schedule has a template with checklist items: `schedule.template?.checklist?.length > 0`. Wrap the Link in this condition.

Also add the same "Preview Form" button to the `schedule-view-modal.tsx` sticky action bar (the bottom bar with Pause/Resume/Deactivate). Add it as the first button in the canManage action group, same condition (checklist items exist). In the modal, clicking it should navigate to the preview page and close the modal, so use `router.push` + `onOpenChange(false)` instead of Link.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>"Preview Form" button appears on schedule detail page and schedule view modal for ga_lead/admin users when the template has checklist items.</done>
</task>

</tasks>

<verification>
- TypeScript compilation passes with no errors
- Preview page loads at `/maintenance/schedules/[id]/preview` for any schedule with checklist items
- All 6 input types are interactive (checkbox toggles, pass/fail selects, numeric accepts numbers, text accepts input, photo shows file picker, dropdown shows options)
- No network calls are made when interacting with checklist items (all local state)
- "Preview Form" button visible on schedule detail page for ga_lead/admin roles
- Header displays real asset name, template name, due date, assigned user
</verification>

<success_criteria>
GA Lead can navigate to any schedule, click "Preview Form", and interact with a fully functional checklist form that mirrors the technician experience without persisting any data.
</success_criteria>

<output>
After completion, create `.planning/quick/21-add-a-view-page-to-simulate-how-the-main/21-SUMMARY.md`
</output>
