---
phase: quick-73
plan: 01
subsystem: maintenance-schedules
tags: [ui, layout, schedule-detail]
dependency_graph:
  requires: []
  provides: [schedule-detail-asset-in-body]
  affects: [schedule-detail-page, schedule-detail-component]
tech_stack:
  added: []
  patterns: [read-only-input-field-pattern]
key_files:
  created: []
  modified:
    - app/(dashboard)/maintenance/schedules/[id]/page.tsx
    - components/maintenance/schedule-detail.tsx
decisions:
  - Asset field placed in shared section (outside canManage conditional) so both managers and non-managers see it
  - Removed unused Link import from page.tsx after header simplification
metrics:
  duration_minutes: 2
  completed: "2026-03-14T04:44:21Z"
---

# Quick Task 73: Move Asset Name from Schedule Detail Header to Body Section

Asset name relocated from page header subtitle to body section as a read-only disabled Input field, consistent with the Company field pattern.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Move asset name from header to body section | 98257dd | page.tsx, schedule-detail.tsx |

## What Changed

### page.tsx (Header Simplified)
- Removed the asset name subtitle block (Link with asset name + display ID, or "General schedule" fallback)
- Header now contains only `<h1>` with the template name
- Removed unused `Link` import from next/link
- Breadcrumb logic preserved (still shows template + asset name for context)

### schedule-detail.tsx (Asset Field in Body)
- Added read-only "Asset" field after Company field, visible to ALL users (outside `canManage` conditional)
- For asset-linked schedules: disabled Input showing "Asset Name (DISPLAY-ID)" + "View Asset" link
- For general schedules: disabled Input showing "No asset (general schedule)"
- Removed duplicate Asset entry from the non-manager read-only grid to avoid duplication

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused Link import**
- **Found during:** Task 1
- **Issue:** After removing the asset Link from the header, the `Link` import from `next/link` became unused, which would cause a lint error
- **Fix:** Removed the import
- **Files modified:** page.tsx
- **Commit:** 98257dd

## Verification

- TypeScript: `npx tsc --noEmit` passes (no errors in modified files; 1 pre-existing error in e2e test file)
- Lint: `npx eslint` passes on both modified files
- Header shows only template name (h1)
- Asset field appears in body after Company field for all user roles
- Non-manager grid no longer has duplicate Asset entry

## Self-Check: PASSED
