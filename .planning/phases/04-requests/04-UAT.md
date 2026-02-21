---
status: testing
phase: 04-requests
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-02-19T09:10:00Z
updated: 2026-02-19T09:30:00Z
---

## Current Test

number: 2
name: Photo Upload & Preview
expected: |
  On /requests/new, click the "+" photo button. Select up to 3 images (JPEG/PNG/WebP, max 5MB each). Preview thumbnails appear in a grid. Click X on a thumbnail to remove it. The "+" button disappears when 3 photos are added.
awaiting: user response

## Tests

### 1. Submit a New Request
expected: Navigate to /requests/new. Full-page form with description textarea, location Combobox, photo upload area, and submit button. Fill in description + location, optionally add photo, submit. Redirected to /requests. New request appears with auto-generated ID (e.g., ABC-26-0001), status "New", title from description.
result: issue
reported: "I click photo + icon and it did nothing"
severity: major

### 2. Photo Upload & Preview
expected: On /requests/new, click the "+" photo button. Select up to 3 images (JPEG/PNG/WebP, max 5MB each). Preview thumbnails appear in a grid. Click X on a thumbnail to remove it. The "+" button disappears when 3 photos are added. Photos persist after form submission and appear on the request detail page.
result: [pending]

### 3. Request List & Filtering
expected: Navigate to /requests. DataTable shows columns: ID, Title, Location, Status, Priority, Category, PIC, Created. Default sort is newest first. Filter bar above the table has: Status dropdown, Priority dropdown, Category dropdown, date range (From/To), search input, and "My Assigned" toggle. Applying a filter updates the list. Filters persist in the URL (refresh keeps them). Clear filters button resets all.
result: [pending]

### 4. Triage a Request (from List)
expected: As GA Lead/Admin, find a request with status "New" in the list. Click the actions menu (three dots) and select "Triage". A modal dialog opens showing: request description (read-only), location, photo thumbnails at the top. Below: Category (searchable Combobox), Priority (dropdown: Low/Medium/High/Urgent), PIC (searchable Combobox). All three are required. Submit "Complete Triage". The request status changes to "Triaged" in the list.
result: [pending]

### 5. Reject a Request
expected: As GA Lead/Admin, find a request in the list. Click actions > "Reject". A dialog appears requiring a rejection reason (textarea, cannot be empty). Enter a reason and confirm. The request status changes to "Rejected". On the detail page, the rejection reason is visible in the timeline.
result: [pending]

### 6. Cancel Own Request
expected: As the requester who submitted a request, find your own request with status "New". Click actions > "Cancel" (or the Cancel button on the detail page). A confirmation dialog appears: "Cancel Request [ID]?" with a warning that this cannot be undone. Confirm. The request status changes to "Cancelled". The cancel option is NOT available on requests that are already Triaged.
result: [pending]

### 7. Request Detail Page & Timeline
expected: Click any request row in the list. Opens /requests/[id] with: breadcrumb "Requests > [display_id]" at top, requester name + division + created date, two-column layout (info left, timeline right — stacks on mobile). Left side: description, location, photos (thumbnails clickable for fullscreen lightbox with dark overlay, Escape/click-outside to close). Right side: vertical timeline showing creation event ("submitted this request") and any triage/status changes with timestamps in dd-MM-yyyy, HH:mm:ss format.
result: [pending]

### 8. Edit Request While New
expected: As the requester, view your own request with status "New" on the detail page. An "Edit" button is visible. Click it. Description and location become editable (textarea + Combobox). Can also add/remove photos. Save changes. Fields update. Edit button is NOT available after the request has been triaged or cancelled.
result: [pending]

## Summary

total: 8
passed: 0
issues: 1
pending: 7
skipped: 0

## Gaps

- truth: "Photo upload + button opens file picker when clicked"
  status: failed
  reason: "User reported: I click photo + icon and it did nothing"
  severity: major
  test: 1
  artifacts: []
  missing: []
  debug_session: ""
