---
phase: 06-inventory
plan: 02
subsystem: ui
tags: [tanstack-table, nuqs, react-hook-form, zod, combobox, file-upload]

requires:
  - phase: 06-01
    provides: asset-actions.ts, asset-schema.ts, asset-status.ts constants, InventoryItem DB types

provides:
  - /inventory page — paginated, filterable, sortable asset list with pending transfer indicator
  - /inventory/new page — asset creation form with condition photos and invoice upload
  - AssetTable client component with URL-synced filters via nuqs
  - AssetFilters with status, category, location, and search filtering
  - AssetStatusBadge with optional In Transit overlay
  - assetColumns TanStack Table column definitions (6 columns)
  - AssetPhotoUpload reusable component with configurable maxPhotos and required validation
  - AssetSubmitForm two-step creation (createAsset -> upload photos -> upload invoices)

affects:
  - 06-03 (asset detail page builds on same data fetching patterns)

tech-stack:
  added: []
  patterns:
    - URL-synced client filtering via nuqs filterParsers (shared between AssetFilters and AssetTable)
    - Two-step file upload: create entity first, then POST files to /api/uploads/* routes
    - In Transit virtual filter: pending status in status dropdown maps to pendingTransfers map lookup
    - Server component page fetches data including pending transfers map, passes to client table component

key-files:
  created:
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/new/page.tsx
    - components/assets/asset-columns.tsx
    - components/assets/asset-table.tsx
    - components/assets/asset-filters.tsx
    - components/assets/asset-status-badge.tsx
    - components/assets/asset-submit-form.tsx
    - components/assets/asset-photo-upload.tsx
  modified: []

key-decisions:
  - "In Transit as virtual filter option (value 'in_transit_virtual') in status dropdown, not a separate filter control"
  - "pendingTransfers map passed from server component to AssetTable, propagated to column meta for per-row lookup"
  - "AssetPhotoUpload is a controlled component: photos state lives in parent (AssetSubmitForm), onPhotosChange callback syncs"
  - "Invoice upload uses separate file list UI (not thumbnail grid) since PDFs cannot show preview thumbnails"
  - "Category filter uses Select not Combobox in filter bar — filter dropdowns are simple short lists, inline"

patterns-established:
  - "Asset filter bar pattern: status + category + location + search — consistent with request/job patterns"
  - "AssetStatusBadge: status badge component with showInTransit prop for In Transit overlay"

requirements-completed:
  - REQ-INV-001
  - REQ-INV-002
  - REQ-INV-004
  - REQ-INV-008
  - REQ-INV-009
  - REQ-INV-011

duration: 4min
completed: 2026-02-25
---

# Phase 6 Plan 02: Asset List + Creation UI Summary

**TanStack Table asset list at /inventory with nuqs URL filters and two-step /inventory/new creation form with required condition photos and optional invoice upload**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T02:01:38Z
- **Completed:** 2026-02-25T02:05:12Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Asset list at /inventory with 6-column TanStack Table, client-side filtering by status/category/location/search, In Transit indicator on assets with pending transfers
- Asset creation at /inventory/new with 6-section form, Combobox selectors, required condition photos (1-5), optional invoice files (0-5, PDF + images)
- Two-step submit flow: createAsset server action -> POST condition photos -> POST invoices -> redirect to detail

## Task Commits

Each task was committed atomically:

1. **Task 1: Asset list page with columns, filters, and status badge** - `5a9b629` (feat)
2. **Task 2: Asset creation form with photo and invoice upload** - `b73f7d7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/(dashboard)/inventory/page.tsx` - Server component fetching assets + pending transfers, renders AssetTable
- `app/(dashboard)/inventory/new/page.tsx` - Server component with role guard, renders AssetSubmitForm
- `components/assets/asset-columns.tsx` - TanStack column defs: ID, Name, Category, Location (with In Transit badge), Status (AssetStatusBadge), Warranty Expiry
- `components/assets/asset-table.tsx` - Client component with nuqs filter state, client-side filtering, row click navigation
- `components/assets/asset-filters.tsx` - URL-synced filter bar with status/category/location/search; exports filterParsers
- `components/assets/asset-status-badge.tsx` - Status badge with ASSET_STATUS_LABELS/COLORS and optional In Transit overlay (Truck icon)
- `components/assets/asset-submit-form.tsx` - 6-section creation form with Combobox selectors, two-step submit, InlineFeedback
- `components/assets/asset-photo-upload.tsx` - Controlled photo upload with thumbnail previews, max file size/type validation, count indicator

## Decisions Made
- In Transit as virtual filter option (value `in_transit_virtual`) in status dropdown, not a separate filter control — keeps filter bar compact
- pendingTransfers map fetched at the server component level and passed down to AssetTable, then propagated via TanStack Table meta to column cell renderers for per-row lookup
- AssetPhotoUpload is a controlled component: photos state lives in parent (AssetSubmitForm), onPhotosChange callback syncs upward
- Invoice upload uses a file list UI (not thumbnail grid) since PDFs cannot show preview thumbnails
- Category filter in filter bar uses plain Select (not Combobox) — inline filter dropdowns are short, static lists; Combobox reserved for form fields where list grows large

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Asset list and creation UI complete; ready for Phase 6 Plan 3 (asset detail page, status change dialog, transfer dialog)
- AssetStatusBadge, assetColumns, filterParsers, and AssetPhotoUpload are reusable by the detail page plan

---
*Phase: 06-inventory*
*Completed: 2026-02-25*
