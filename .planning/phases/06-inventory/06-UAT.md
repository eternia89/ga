---
status: testing
phase: 06-inventory
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md]
started: 2026-03-01T12:00:00Z
updated: 2026-03-03T12:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 13
name: In Transit Indicator
expected: |
  Assets with a pending transfer show an "In Transit" overlay/indicator on their status badge in both the list page and the detail page (Truck icon).
awaiting: complete

## Tests

### 1. Sidebar Inventory Link
expected: Inventory nav item visible in sidebar. Clicking it navigates to /inventory.
result: pass
e2e: pass — `asset-crud.spec.ts` Test 1

### 2. Asset List Page
expected: /inventory shows a table with columns: ID (AST-YY-NNNN format), Name, Category, Location, Status, and Warranty Expiry. Assets are displayed in rows with clickable rows.
result: pass
e2e: pass — `asset-crud.spec.ts` Test 2

### 3. Asset List Filters
expected: Filter bar above table with Status dropdown (including "In Transit" virtual option), Category, Location, and Search text. Selecting filters updates the table and syncs to URL params.
result: pass
e2e: pass — `asset-crud.spec.ts` Test 3

### 4. Create New Asset
expected: /inventory/new shows a multi-section form with Combobox selectors for category and location, text fields for name/brand/model/serial, date pickers, and a required condition photo upload area (1-5 photos). Submit creates the asset and redirects to its detail page.
result: pass
e2e: pass — `asset-crud.spec.ts` Test 4 (creates asset, fills all fields, uploads photo, submits, verifies redirect to detail page with AST- heading)
note: "Fixed — root cause was migrations 00008-00013 not pushed to remote DB. Pushed all migrations."

### 5. Invoice Upload on Creation
expected: On the creation form, an optional invoice upload area accepts PDF and image files (up to 5 files, 10MB each). File list shows names (no thumbnail for PDFs).
result: issue
e2e: pass — `asset-crud.spec.ts` Test 5 (navigates to asset detail/edit page, uploads invoice via hidden file input, verifies "New" label appears, saves, verifies success feedback)
reported: "after I input invoice, and click save changes, the invoice didn't get listed instantly. i need to refresh the page to see the uploaded invoice"
severity: major

### 6. Asset Detail Page Layout
expected: /inventory/[id] shows a two-column layout: left side has asset info panel (all fields, condition photo thumbnails, invoice list with download links), right side has activity timeline. Max width constrained.
result: pass
e2e: pass — `asset-crud.spec.ts` Test 6 (verifies AST- heading, max-w-[1000px] grid container, status badge with click-to-change, Activity Timeline section, Asset Details edit form, name field value)

### 7. Inline Edit Asset
expected: Edit button on detail page switches fields to editable mode (react-hook-form). Save persists changes. Sold/disposed assets block editing.
result: pass
e2e: pass — `asset-crud.spec.ts` Test 7 (detail page IS edit page — changes name field, saves, reloads page, verifies new name persisted)

### 8. Change Asset Status
expected: Clicking the status badge opens a dialog. Dropdown shows only valid transitions for current status. Photo upload required. Submitting changes the status. Sold/disposed shows irreversibility warning. Sold/disposed is terminal (no further transitions).
result: pass
e2e: pass — `asset-status-transfer.spec.ts` Test 8 (clicks status badge, selects "Under Repair" from dropdown, uploads condition photo, submits, verifies dialog closes, reloads and confirms badge shows "Under Repair")

### 9. Initiate Asset Transfer
expected: Transfer button opens dialog with destination location Combobox (current location excluded), receiver user Combobox, notes field, and sender photo upload. Submitting creates a pending transfer. Only one pending transfer per asset allowed.
result: pass
e2e: pass — `asset-status-transfer.spec.ts` Test 9 (clicks Transfer button, selects destination location via combobox, selects receiver via combobox, uploads sender condition photo, submits, verifies "In Transit"/"Transfer in Progress" indicator and Cancel Transfer button appear)

### 10. Accept or Reject Transfer
expected: On an asset with pending inbound transfer, Accept button opens dialog requiring photos. Reject button opens dialog requiring reason and optional photos. Accepting moves asset to new location. Rejecting returns it to original status.
result: pass
e2e: pass — `asset-status-transfer.spec.ts` Test 10 (verifies Accept and Reject buttons visible for receiver, clicks Accept, uploads received condition photo, submits, verifies "In Transit" gone and Transfer button available again)

### 11. Cancel Transfer
expected: On a pending outbound transfer, Cancel button shows AlertDialog confirmation (no photos/form needed). Confirming cancels the transfer.
result: pass
e2e: pass — `asset-status-transfer.spec.ts` Test 11 (creates pending transfer via admin API, clicks Cancel Transfer, confirms AlertDialog, verifies "In Transit" gone and Transfer button available again)

### 12. Asset Timeline
expected: Right column shows chronological timeline combining: asset creation, field edits, status changes (with condition photos as thumbnails), and transfer events (initiated, accepted, rejected, cancelled). Photo thumbnails show max 3 with "+N more" for extras.
result: pass
e2e: pass — `asset-timeline.spec.ts` Test 12 (creates asset via admin API, navigates to detail page, verifies Activity Timeline heading in bordered container, creation event visible, two-column grid layout)

### 13. In Transit Indicator
expected: Assets with a pending transfer show an "In Transit" overlay/indicator on their status badge in both the list page and the detail page (Truck icon).
result: pass
e2e: pass — `asset-status-transfer.spec.ts` Test 13 (creates pending transfer via admin API, verifies "In Transit" text on list page, navigates to detail page and verifies "In Transit" badge + "Transfer in Progress" banner)

## Summary

total: 13
passed: 12
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Submit creates the asset with auto-generated AST-YY-NNNN display ID and redirects to detail page"
  status: resolved
  reason: "Migrations 00008-00013 were not pushed to remote Supabase DB. generate_asset_display_id function did not exist."
  severity: blocker
  test: 4
  root_cause: "Migrations not deployed to remote database"
  artifacts:
    - path: "supabase/migrations/00008_jobs_phase5.sql"
      issue: "Made CREATE POLICY statements idempotent with DROP IF EXISTS"
    - path: "supabase/migrations/00009_inventory_phase6.sql"
      issue: "Made storage policy statements idempotent"
    - path: "supabase/migrations/00012_jobs_add_category_id.sql"
      issue: "Made ADD COLUMN idempotent with IF NOT EXISTS"
  missing: []
  debug_session: ""

- truth: "After uploading an invoice and saving, the invoice appears in the list immediately without page refresh"
  status: failed
  reason: "User reported: after I input invoice, and click save changes, the invoice didn't get listed instantly. i need to refresh the page to see the uploaded invoice"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
