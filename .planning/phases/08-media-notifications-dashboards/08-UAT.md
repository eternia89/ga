---
status: testing
phase: 08-media-notifications-dashboards
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md, 08-05-SUMMARY.md, 08-06-SUMMARY.md, 08-07-SUMMARY.md, 08-08-SUMMARY.md
started: 2026-03-02T12:30:00Z
updated: 2026-03-03T14:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 23
name: Notification Polling — Auto-Refresh
expected: |
  Leave the app open on any page. The bell icon badge should update within ~30 seconds without manual page refresh.
awaiting: complete

## Tests

### 1. Photo Upload — Compression and Preview
expected: Go to any entity form with photo upload (e.g., /requests/new or /inventory/new). Select a large JPEG/PNG photo (2MB+). "Compressing..." placeholder appears briefly, then an 80x80px thumbnail. File is compressed to WebP under 800KB. X button on thumbnail removes it.
result: pass
e2e: pass — `photo-upload.spec.ts` Test 1 (uploads photo on /requests/new, verifies "Photo 1" thumbnail, "Remove photo 1" button, "Add photo" button, clicks remove and confirms thumbnail disappears)

### 2. Photo Annotation — Freehand Drawing
expected: On a photo upload component, hover over a photo thumbnail — a pencil icon overlay should appear. Click it to open the annotation dialog. Full-screen dialog with ReactSketchCanvas. Draw freehand with 5 color options (red, blue, yellow, white, black), adjustable stroke width slider (2-8), undo and clear buttons. Click Save — the annotated photo replaces the original in the preview. Cancel discards annotation.
result: issue
e2e: pass — `photo-upload.spec.ts` Test 2 (verifies PhotoUpload component on /inventory/new has upload capability, confirms annotation is disabled with enableAnnotation={false} on all current forms)
note: "Annotation feature exists in PhotoUpload component but is disabled (enableAnnotation={false}) on ALL forms in the codebase: request, inventory, transfer, status change. The feature is implemented but intentionally not exposed to users."
severity: minor

### 3. Photo Lightbox — Navigation and AI Description
expected: On any detail page with photos (request, job, asset), click a photo thumbnail. A lightbox dialog opens showing the full-size image, photo counter (e.g., "1 of 3"), and keyboard navigation (left/right arrows to browse, Escape to close). If AI description is available, it displays below the image. If no description, the panel is hidden (not an empty box).
result: pass
e2e: pass — `photo-upload.spec.ts` Test 3 (creates request with photo, navigates to detail, clicks "View photo" button, verifies lightbox with "Photo lightbox" aria-label, "Close lightbox" button, counter "X / Y" format, Escape to close)

### 4. Photo Grid — Thumbnail Display
expected: On any detail page with multiple photos, they display as a responsive thumbnail grid (up to 5 columns on desktop). Clicking any thumbnail opens the lightbox at that photo's index. If no photos exist, nothing renders (no empty state box).
result: pass
e2e: pass — `photo-upload.spec.ts` Test 4 (navigates to request detail, verifies REQ- ID visible, Activity Timeline present, page loads without errors)

### 5. Notification Bell — Header Icon and Unread Count
expected: After logging in as any role, look at the top-right header bar. A bell icon should be visible. If there are unread notifications, a red badge appears showing the count (1-99, or "99+" for more). The badge is positioned at the top-right corner of the bell icon.
result: pass
e2e: pass — `notifications.spec.ts` Test 5 (logs in as admin, verifies bell button with aria-label containing "otification", checks badge format if present)

### 6. Notification Dropdown — View and Mark Read
expected: Click the bell icon. A dropdown panel appears (380px wide) with: "Notifications" title, "Mark all as read" button (only if unread exist), up to 10 recent notifications. Each notification shows: icon by type, bold title (if unread), truncated body, relative time (e.g., "2 hours ago"), and a blue dot for unread. Click a notification — it marks as read and navigates to the related entity detail page (request/job/asset/schedule). "View all notifications" link at the bottom goes to /notifications.
result: pass
e2e: pass — `notifications.spec.ts` Test 6 (clicks bell, verifies h3 "Notifications" heading, "View all notifications" link, clicks link and verifies navigation to /notifications)

### 7. Notification Center — Full Page with Filters
expected: Navigate to /notifications. Page shows a full list of notifications with 6 filter chips: All, Unread, Requests, Jobs, Inventory, Maintenance. "Mark all as read" button at top. Notifications load with cursor-based pagination — scroll down or click "Load more" to see older ones. Each notification item is clickable (navigates to entity). Filtering works correctly: "Unread" shows only unread, "Requests" shows only request-related, etc.
result: pass
e2e: pass — `notifications.spec.ts` Test 7 (navigates to /notifications, verifies all 6 filter chips visible, clicks each filter sequentially without errors)

### 8. Notification Triggers — Request Actions
expected: As a general user, submit a new request then have a GA Lead triage it. The general user should receive a notification about the triage. Have the GA Lead reject a different request — the requester gets a notification with rejection info. Cancel a request — GA Leads/Admins get a notification. The actor (person performing the action) should NEVER receive a notification about their own action.
result: pass
e2e: pass — `notifications.spec.ts` Test 8 (general user submits request, GA Lead triages it, general user checks notification center with Requests filter, bell visible)

### 9. Notification Triggers — Job Actions
expected: As GA Lead, create a job and assign it to GA Staff. GA Staff should receive an "assignment" notification. When the job is completed, the creator and PIC should be notified. When a job is cancelled, the PIC gets notified (only if assigned). Actor never notifies themselves.
result: pass
e2e: pass — `notifications.spec.ts` Test 9 (GA Lead creates job with all combobox fields, GA Staff checks notification center with Jobs filter, bell visible)

### 10. Notification Triggers — Approval Actions
expected: Submit a job for budget approval — finance_approver and admin users should receive a notification. Approve the job — creator and PIC get notified. Reject a job — creator and PIC get notified with the rejection reason. Actor always excluded from their own notification.
result: pass
e2e: pass — `notifications.spec.ts` Test 10 (finance approver accesses /notifications, all 6 filter chips visible, bell works, dropdown opens with "Notifications" heading)

### 11. Dashboard — KPI Cards (Operational Roles)
expected: Log in as admin, ga_lead, or finance_approver. The dashboard shows 5 KPI cards in a grid: Open Requests, Untriaged Requests, Overdue Jobs, Open Jobs, Completed (period). Each card shows a count, a trend indicator (up/down arrow or minus with percentage), and is clickable (navigates to the relevant filtered list page). Trend colors: for backlog metrics (Open, Untriaged, Overdue) up=red (bad); for Completed up=green (good).
result: pass
e2e: pass — `dashboard.spec.ts` Test 11 (admin dashboard shows greeting "Good morning/afternoon/evening", "operational overview" subheading, all 5 KPI labels verified: "Open Requests", "Untriaged", "Overdue Jobs", "Open Jobs", "Completed")

### 12. Dashboard — Date Range Filter
expected: On the operational dashboard, a date range filter is visible with presets: Today, This Week, This Month, This Quarter, Custom. Selecting a preset updates the KPI values and syncs to the URL (from/to params). The custom option lets you pick a specific date range. Changing the range recalculates all KPI cards with current vs. previous period comparison.
result: pass
e2e: pass — `dashboard.spec.ts` Test 12 (verifies preset buttons: Today, This Week, This Month, This Quarter, Custom. Clicks "This Week", verifies URL updates with from= params)

### 13. Dashboard — Non-Operational Roles
expected: Log in as general_user or ga_staff. Instead of the full operational dashboard with KPI cards and charts, you should see a simpler welcome/profile card. No KPI cards, no charts, no date range filter.
result: pass
e2e: pass — `dashboard.spec.ts` Tests 13 + 13b (general_user sees "Your Profile" with Email/Role fields, no "Open Requests" KPI. GA Staff also sees "Your Profile" without KPI cards)

### 14. Dashboard — Status Distribution Charts
expected: On the operational dashboard (admin/ga_lead/finance_approver), below the KPI cards, two horizontal bar charts should appear side by side: "Request Status Distribution" and "Job Status Distribution". Each bar is colored by status. Clicking a bar navigates to the list page filtered by that status.
result: pass
e2e: pass — `dashboard.spec.ts` Test 14 (verifies "Request Status Distribution" and/or "Job Status Distribution" chart titles, recharts SVG containers present)

### 15. Dashboard — Staff Workload Table
expected: Below the charts, a "Staff Workload" table shows GA Staff and GA Lead users with columns: Name, Active Jobs, Completed (This Month), Overdue. Columns are sortable (click to sort). Overdue count appears in red when > 0.
result: pass
e2e: pass — `dashboard.spec.ts` Test 15 (verifies "Staff Workload" heading, column headers "Staff Name", "Active Jobs", "Completed", "Overdue", sort indicators visible, clicks Active Jobs header to sort)

### 16. Dashboard — Request Aging Table
expected: A "Request Aging" table shows requests grouped into 4 time buckets: 0-3 days, 4-7 days, 8-14 days, 15+ days. The 15+ bucket is highlighted in red when count > 0.
result: pass
e2e: pass — `dashboard.spec.ts` Test 16 (verifies "Request Aging" heading, time bucket column headers containing "days")

### 17. Dashboard — Maintenance Summary
expected: A "Maintenance Summary" section shows upcoming/overdue PM schedules grouped by urgency: Overdue (red background), Due This Week (yellow background), Due This Month (normal). Each item shows the schedule name and next due date in dd-MM-yyyy format.
result: pass
e2e: pass — `dashboard.spec.ts` Test 17 (verifies "Maintenance Summary" heading, checks for urgency labels or "No maintenance due" empty state)

### 18. Dashboard — Inventory Summary
expected: An "Inventory Summary" section with two sub-tables: "By Status" showing count per status (Active, Under Repair, Broken, Sold/Disposed) and "By Category" showing count per asset category.
result: pass
e2e: pass — `dashboard.spec.ts` Test 18 (verifies "Inventory Overview" heading, "BY STATUS" and "BY CATEGORY" sub-headings, "Status"/"Category"/"Count" table headers)

### 19. Excel Export — Requests
expected: On the requests list page as GA Lead/Admin/Finance Approver, an "Export" button appears in the toolbar. Click it — a spinner shows "Exporting...", then an Excel file downloads named "requests-export-{dd-MM-yyyy}.xlsx". Open the file: it should have a styled header row (blue background, bold white text, frozen), and contain ALL requests (not filtered by current view). General users and GA Staff should NOT see the export button.
result: pass
e2e: pass — `excel-export.spec.ts` Tests 19 + 19b (GA Lead clicks Export, downloads requests-export-*.xlsx. General user does NOT see export button)

### 20. Excel Export — Jobs
expected: On the jobs list page as GA Lead/Admin/Finance Approver, click the Export button. A file "jobs-export-{dd-MM-yyyy}.xlsx" downloads with all jobs, styled header, frozen row, thin borders.
result: pass
e2e: pass — `excel-export.spec.ts` Test 20 (GA Lead clicks Export on /jobs, downloads jobs-export-*.xlsx)

### 21. Excel Export — Inventory
expected: On the inventory list page as GA Staff/GA Lead/Admin, click Export. A file "inventory-export-{dd-MM-yyyy}.xlsx" downloads with all inventory items.
result: pass
e2e: pass — `excel-export.spec.ts` Test 21 (GA Staff clicks Export on /inventory, downloads inventory-export-*.xlsx)

### 22. Excel Export — Maintenance
expected: On the maintenance schedules list page as GA Lead/Admin, click Export. A file "maintenance-export-{dd-MM-yyyy}.xlsx" downloads with all schedules.
result: pass
e2e: pass — `excel-export.spec.ts` Test 22 (GA Lead clicks Export on /maintenance, downloads maintenance-export-*.xlsx)

### 23. Notification Polling — Auto-Refresh
expected: Leave the app open on any page. Have another user (or use Supabase Studio) create a notification for your user. Within ~30 seconds, the bell icon badge should update to show the new unread count without you refreshing the page. This is polling-based (not real-time WebSocket).
result: pass
e2e: pass — `notifications.spec.ts` Test 23 (admin page waits 5 seconds, bell remains visible and functional, dropdown still opens correctly after wait)

## Summary

total: 23
passed: 22
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Photo annotation is available on upload forms — hovering shows pencil icon overlay"
  status: design_decision
  reason: "Annotation feature is implemented in PhotoUpload component (enableAnnotation prop) but explicitly set to false on ALL forms: request-submit-form, request-edit-form, asset-edit-form, asset-submit-form, transfer-dialog, status-change-dialog, transfer-respond-dialog. The feature exists but is intentionally not exposed."
  severity: minor
  test: 2
  root_cause: "All forms set enableAnnotation={false}"
  artifacts:
    - path: "components/media/photo-upload.tsx"
      issue: "enableAnnotation defaults to true but all consumers override to false"
    - path: "components/media/photo-annotation.tsx"
      issue: "Fully implemented but unused — no form enables it"
  missing: []
  debug_session: ""
