---
status: testing
phase: 07-preventive-maintenance
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md
started: 2026-03-02T12:00:00Z
updated: 2026-03-02T12:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Sidebar — Maintenance Section
expected: |
  Navigate to the dashboard. In the sidebar, you should see a "Maintenance" section with two links:
  - "Templates" → navigates to /maintenance/templates
  - "Schedules" → navigates to /maintenance
  Both links should be clickable (not grayed out / "Coming soon").
  Visible to: admin, ga_lead. NOT visible to: general_user, ga_staff, finance_approver.
awaiting: user response

## Tests

### 1. Sidebar — Maintenance Section
expected: Navigate to the dashboard. In the sidebar, you should see a "Maintenance" section with two links: "Templates" (→ /maintenance/templates) and "Schedules" (→ /maintenance). Both clickable, not grayed out. Visible to admin/ga_lead only.
result: [pending]

### 2. Templates List Page
expected: Click "Templates" in sidebar. Page loads with title, breadcrumb (Maintenance > Templates), and a data table. Columns: Name (clickable link), Category, Items (count), Created (dd-MM-yyyy format), Status (Active/Inactive badge), Actions. GA Lead/Admin sees a "New Template" button above the table.
result: [pending]

### 3. Create Template — Form Fields
expected: Click "New Template". Page shows form with: Name input (max 100 chars), Category combobox (only shows asset-type categories), Description textarea (max 200 chars with char counter), and an empty checklist builder area with 6 "Add" buttons: + Checkbox, + Pass/Fail, + Numeric, + Text, + Photo, + Dropdown.
result: [pending]

### 4. Template Builder — Add and Configure Checklist Items
expected: Click each of the 6 add buttons. Each adds an item with a colored type badge, label input, and type-specific config. Numeric shows a "Unit" input (e.g., PSI, °C). Dropdown shows option chips with add/remove. Items appear in order. Empty state shows a dashed border placeholder before any items are added.
result: [pending]

### 5. Template Builder — Drag-and-Drop Reorder
expected: Add 3+ checklist items. Grab the drag handle (grip icon on left of each item). Drag an item up or down. Items reorder visually during drag. After dropping, the new order is preserved. Items show reduced opacity while being dragged.
result: [pending]

### 6. Create Template — Submit
expected: Fill in Name, select a Category, add at least one checklist item with a label, and click the submit/create button. Should redirect to the templates list. The new template appears in the table with correct name, category, item count, and "Active" status.
result: [pending]

### 7. Template Detail Page — View Mode
expected: Click a template name in the list. Detail page loads with: status badge (Active/Inactive), item count, created date, info card (name, category, description), and an ordered checklist list showing each item with its type badge and label. Breadcrumb: Maintenance > Templates > {name}.
result: [pending]

### 8. Template Detail — Edit Mode
expected: On the template detail page, click the edit toggle/button. Form switches to editable mode with the TemplateBuilder (same as create form but pre-filled). Change the name or reorder items, then save. Success feedback appears. Page refreshes with updated data.
result: [pending]

### 9. Template — Deactivate and Reactivate
expected: On the template detail or list page, click Deactivate on an active template that has NO active schedules. Template status changes to "Inactive", success feedback shown. Then click Reactivate — status returns to "Active". If the template HAS active schedules, deactivate should show an error with the count of active schedules.
result: [pending]

### 10. Schedules List Page
expected: Click "Schedules" in sidebar (navigates to /maintenance). Page loads with title, breadcrumb, and data table. Columns: Template Name (linked), Asset Name (linked, shows AST-ID), Interval (N days), Type (Fixed/Floating badge), Status (4-state badge: active/green, paused_auto/amber, paused_manual/yellow, deactivated/gray), Next Due (dd-MM-yyyy, red+bold if overdue, N/A if paused), Last Completed, Actions. "New Schedule" button visible to ga_lead/admin.
result: [pending]

### 11. Create Schedule — Bidirectional Category Filter
expected: Click "New Schedule". Form shows Template combobox and Asset combobox. Select a template — the asset dropdown should filter to only show assets matching that template's category. Or select an asset first — the template dropdown filters to matching category templates. If you change one that creates a category mismatch, the other should clear.
result: [pending]

### 12. Create Schedule — Interval and Type
expected: On the create schedule form, set Interval (days, min 1 max 365) and choose between Fixed and Floating using toggle buttons with help text explaining the difference. Default is Floating. Optionally set a start date. Submit — should redirect to schedule list with the new schedule showing correct interval, type, and "Active" status.
result: [pending]

### 13. Schedule Detail Page
expected: Click a schedule row in the list. Detail page loads with: ScheduleStatusBadge, created date, info card (template name linked, asset name linked with display_id, interval, type badge, next due date with red "Overdue" label if past due, last completed). Below: a "Linked PM Jobs" section showing any generated PM jobs with display_id, status, and created date.
result: [pending]

### 14. Schedule — Activate, Deactivate, Delete
expected: On schedule detail: Deactivate → status changes to deactivated (gray badge), any open PM jobs for this schedule are cancelled. Activate → status returns to active (green badge), next_due_at recalculated. Delete → inline confirmation panel appears (not a modal), confirm → schedule soft-deleted, redirects to list.
result: [pending]

### 15. Auto-Pause on Asset Status Change
expected: Have an active schedule linked to an asset. Change the asset status to "Broken" or "Under Repair" (from the asset detail page). Go back to the schedule — it should show "Paused (Auto)" amber badge with a notice explaining the asset status caused the auto-pause. Change the asset back to "Active" — the schedule should auto-resume and show "Active" green badge again.
result: [pending]

### 16. PM Job — Checklist on Job Detail
expected: Open a PM-type job (one generated from a schedule). On the job detail page, below the standard info panel, a PM Checklist section appears with a progress bar showing X/Y items completed. Each checklist item renders according to its type: checkbox (toggle), pass/fail (Pass/Fail buttons), numeric (input with unit label), text (textarea), photo (thumbnails), dropdown (select). The checklist is editable if you are PIC or GA Lead/Admin and job status is assigned or in_progress.
result: [pending]

### 17. PM Checklist — Save-as-you-go
expected: On a PM job checklist, toggle a checkbox or click Pass/Fail — it should save immediately (no save button needed). Type in a numeric or text field — it should auto-save after a short delay (~500ms). No page reload needed. Progress bar updates as items are completed.
result: [pending]

### 18. PM Checklist — Complete
expected: Fill out all required checklist items. A "Complete Checklist" button or success state should appear when all items have values. Click it — the checklist shows a completion timestamp. Note: completing the checklist does NOT change job status; the PIC still uses the normal job status flow to mark the job complete.
result: [pending]

### 19. PM Checklist — Read-Only After Completion
expected: Open a completed or cancelled PM job. The checklist should display in read-only mode — all values shown but inputs are disabled/non-editable. The completion timestamp should be visible.
result: [pending]

### 20. PM Type Badge and Overdue Badge
expected: Open the jobs list (/jobs). PM-type jobs should show a "PM" badge next to the title. If a PM job is overdue (schedule's next_due_at is in the past and job not complete), a red "Overdue" badge should appear. Same badges should be visible on the job detail page header.
result: [pending]

### 21. Schedule Detail — Edit Interval
expected: On the schedule detail page, click edit for the interval. An inline form appears showing interval days and type (Fixed/Floating). Change the interval and save. Success feedback appears. The "Next Due" date should recalculate based on the new interval. Template and asset are NOT editable (immutable after creation).
result: [pending]

## Summary

total: 21
passed: 0
issues: 0
pending: 21
skipped: 0

## Gaps

[none yet]
