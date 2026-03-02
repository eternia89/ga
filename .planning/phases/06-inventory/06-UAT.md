---
status: testing
phase: 06-inventory
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md]
started: 2026-03-01T12:00:00Z
updated: 2026-03-01T12:05:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 5
name: Invoice Upload on Creation
expected: |
  On the creation form, an optional invoice upload area accepts PDF and image files (up to 5 files, 10MB each). File list shows names (no thumbnail for PDFs).
awaiting: user response

## Tests

### 1. Sidebar Inventory Link
expected: Inventory nav item visible in sidebar. Clicking it navigates to /inventory.
result: pass

### 2. Asset List Page
expected: /inventory shows a table with columns: ID (AST-YY-NNNN format), Name, Category, Location, Status, and Warranty Expiry. Assets are displayed in rows with clickable rows.
result: pass

### 3. Asset List Filters
expected: Filter bar above table with Status dropdown (including "In Transit" virtual option), Category, Location, and Search text. Selecting filters updates the table and syncs to URL params.
result: pass

### 4. Create New Asset
expected: /inventory/new shows a multi-section form with Combobox selectors for category and location, text fields for name/brand/model/serial, date pickers, and a required condition photo upload area (1-5 photos). Submit creates the asset and redirects to its detail page.
result: issue
reported: "Failed to generate asset ID. Please try again."
severity: blocker

### 5. Invoice Upload on Creation
expected: On the creation form, an optional invoice upload area accepts PDF and image files (up to 5 files, 10MB each). File list shows names (no thumbnail for PDFs).
result: [pending]

### 6. Asset Detail Page Layout
expected: /inventory/[id] shows a two-column layout: left side has asset info panel (all fields, condition photo thumbnails, invoice list with download links), right side has activity timeline. Max width constrained.
result: [pending]

### 7. Inline Edit Asset
expected: Edit button on detail page switches fields to editable mode (react-hook-form). Save persists changes. Sold/disposed assets block editing.
result: [pending]

### 8. Change Asset Status
expected: Clicking the status badge opens a dialog. Dropdown shows only valid transitions for current status. Photo upload required. Submitting changes the status. Sold/disposed shows irreversibility warning. Sold/disposed is terminal (no further transitions).
result: [pending]

### 9. Initiate Asset Transfer
expected: Transfer button opens dialog with destination location Combobox (current location excluded), receiver user Combobox, notes field, and sender photo upload. Submitting creates a pending transfer. Only one pending transfer per asset allowed.
result: [pending]

### 10. Accept or Reject Transfer
expected: On an asset with pending inbound transfer, Accept button opens dialog requiring photos. Reject button opens dialog requiring reason and optional photos. Accepting moves asset to new location. Rejecting returns it to original status.
result: [pending]

### 11. Cancel Transfer
expected: On a pending outbound transfer, Cancel button shows AlertDialog confirmation (no photos/form needed). Confirming cancels the transfer.
result: [pending]

### 12. Asset Timeline
expected: Right column shows chronological timeline combining: asset creation, field edits, status changes (with condition photos as thumbnails), and transfer events (initiated, accepted, rejected, cancelled). Photo thumbnails show max 3 with "+N more" for extras.
result: [pending]

### 13. In Transit Indicator
expected: Assets with a pending transfer show an "In Transit" overlay/indicator on their status badge in both the list page and the detail page (Truck icon).
result: [pending]

## Summary

total: 13
passed: 3
issues: 1
pending: 9
skipped: 0

## Gaps

- truth: "Submit creates the asset with auto-generated AST-YY-NNNN display ID and redirects to detail page"
  status: failed
  reason: "User reported: Failed to generate asset ID. Please try again."
  severity: blocker
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
