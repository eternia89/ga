---
phase: quick-57
verified: 2026-03-12T00:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Quick Task 57: Separate ID and Status into First Two Columns — Verification Report

**Task Goal:** In all entity table-list views (requests, jobs, assets/inventory, schedules, templates), separate the ID and Status into their own dedicated columns and place them as the first and second column respectively.
**Verified:** 2026-03-12
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Requests table shows ID as column 1 (mono text only, no status badge inline) and Status as column 2 (badge only) | VERIFIED | `request-columns.tsx` lines 26–45: `display_id` col renders `<span className="font-mono text-xs">` only; `status` col immediately follows with `<RequestStatusBadge status={row.original.status} />` |
| 2 | Assets table shows ID as column 1 and Status as column 2 (immediately after ID, before photo) | VERIFIED | `asset-columns.tsx` lines 33–58: `display_id` col at index 0 (lines 34–43), `status` col at index 1 (lines 44–58), `photo` col at index 2 (lines 59–98). `AssetStatusBadge` with `showInTransit` logic preserved exactly |
| 3 | Jobs table is unchanged — it already has ID col 1, Status col 2 | VERIFIED | `job-columns.tsx` lines 26–45: `display_id` col 1 (font-mono span), `status` col 2 (`<JobStatusBadge>`), unchanged |
| 4 | Schedules and Templates tables are unchanged — they have no display_id column | VERIFIED | `components/maintenance/schedule-columns.tsx` — no standalone `display_id` accessor column (only references display_id as a nested property inside a cell). No template columns file exists. Both correctly scoped out of this task |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/requests/request-columns.tsx` | Requests table columns with ID and Status separated | VERIFIED | File exists, substantive (188 lines), display_id col renders font-mono span only, separate status col with RequestStatusBadge at position 2 |
| `components/assets/asset-columns.tsx` | Assets table columns with Status moved to position 2 | VERIFIED | File exists, substantive (222 lines), display_id at index 0, status at index 1 (with AssetStatusBadge + showInTransit logic intact), photo at index 2 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/requests/request-columns.tsx` | `RequestStatusBadge` | status column cell render | WIRED | `RequestStatusBadge` import present (line 9); used exclusively inside the `status` accessorKey column (line 41); NOT present in the `display_id` column cell |
| `components/assets/asset-columns.tsx` | `AssetStatusBadge` | status column cell render at position 2 | WIRED | `AssetStatusBadge` import present (line 9); used in the `status` column at array index 1 (lines 51–54) with `showInTransit` prop correctly wired to `pendingTransfers` meta lookup |

### Anti-Patterns Found

No anti-patterns detected in either modified file. No TODOs, FIXMEs, placeholders, or empty implementations found.

### Human Verification Required

None. The changes are column array reordering and cell content split — fully verifiable via static analysis.

### Summary

Both tasks completed correctly:

- **Requests table:** The `display_id` column (position 1) now renders only `<span className="font-mono text-xs">` — no `RequestStatusBadge` inline. A separate `status` column (position 2) renders `<RequestStatusBadge status={row.original.status} />`. Column order is: display_id → status → photo → title → location → priority → PIC → created_at → actions.

- **Assets table:** The `status` column was moved from position 6 (after location) to position 2 (immediately after display_id and before photo). The `AssetStatusBadge` with its `showInTransit` prop and `pendingTransfers` meta lookup is preserved exactly. Column order is: display_id → status → photo → name → category → location → warranty_expiry → actions.

- **Jobs table:** Confirmed already correct — display_id col 1, status col 2, no changes needed.

- **Schedules and Templates:** Confirmed no standalone display_id column — correctly excluded from scope.

---

_Verified: 2026-03-12_
_Verifier: Claude (gsd-verifier)_
