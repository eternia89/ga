---
phase: quick-21
plan: 01
subsystem: maintenance
tags: [preview, checklist, pm]
dependency-graph:
  requires: [maintenance-schedules, maintenance-templates]
  provides: [pm-checklist-preview-page]
  affects: [schedule-detail, schedule-view-modal]
tech-stack:
  patterns: [local-state-only-preview, ephemeral-form]
key-files:
  created:
    - components/maintenance/pm-checklist-preview.tsx
    - app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx
  modified:
    - components/maintenance/schedule-detail.tsx
    - components/maintenance/schedule-view-modal.tsx
decisions:
  - PreviewChecklistItem mirrors PMChecklistItem visual structure with local-only callbacks instead of server actions
  - Photo type uses object URLs for local preview without any upload
  - Type badge shown on each item to help GA Leads identify item types during preview
metrics:
  duration: 2min
  completed: 2026-03-09
---

# Quick Task 21: PM Checklist Preview Form Summary

**PM checklist preview page with local-only interactive form for all 6 item types, accessible from schedule detail and view modal**

## What Was Done

### Task 1: Create PMChecklistPreview component and preview page (5489b74)

Created `PMChecklistPreview` client component that renders template checklist items with fully interactive inputs but zero server persistence. All state is local via useState. Supports all 6 checklist item types:

- **checkbox**: Toggle with "Mark as done" / "Done" label
- **pass_fail**: Pass/Fail button pair with active state highlighting
- **numeric**: Number input with optional unit label
- **text**: Textarea with 1000 char limit
- **photo**: File input with object URL thumbnail previews (no upload)
- **dropdown**: Select with options from ChecklistItem.options array

Info header card shows template name, asset (name + display_id), due date (dd-MM-yyyy), and assigned user name. Yellow warning banner clarifies values are not saved. Progress bar tracks completion count. Footer shows "End of checklist -- N items total".

Server page at `/maintenance/schedules/[id]/preview` handles auth, fetches schedule with template + asset joins, looks up assigned user's full_name, renders breadcrumbs (Maintenance > Schedules > {template} - {asset} > Preview Form), and provides a "Back to Schedule" link.

### Task 2: Add Preview Form button to schedule detail and modal (ae2b673)

Added "Preview Form" button to the schedule detail page action bar, visible only when `canManage` (ga_lead/admin) and the template has checklist items. Uses Next.js Link for navigation.

Added the same button to the schedule view modal sticky action bar. In the modal, clicking navigates via `router.push` and closes the modal via `onOpenChange(false)`.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compilation passes (no errors in new/modified files)
- Preview page renders at /maintenance/schedules/[id]/preview
- All 6 input types are interactive with local-only state
- No network calls on checklist item interaction
- "Preview Form" button appears on schedule detail and modal for ga_lead/admin
- Header displays real asset name, template name, due date, assigned user

## Commits

| Task | Commit  | Description                                         |
|------|---------|-----------------------------------------------------|
| 1    | 5489b74 | PM checklist preview component and page              |
| 2    | ae2b673 | Preview Form button on schedule detail and modal     |
