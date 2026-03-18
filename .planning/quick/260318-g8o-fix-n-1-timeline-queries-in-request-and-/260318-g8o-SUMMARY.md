---
task_id: 260318-g8o
title: "Fix N+1 sequential database queries in timeline processing"
type: performance
completed: 2026-03-18T04:44:11Z
duration: "2min"
key_files:
  modified:
    - app/(dashboard)/requests/[id]/page.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
---

# Quick Task 260318-g8o: Fix N+1 Timeline Query Performance

Batch-replaced sequential per-audit-log DB queries with pre-scanned lookup maps in both request and job detail pages.

## Changes Made

### Request Detail Page (`requests/[id]/page.tsx`)

**Before:** Inside the timeline processing loop, two sequential `await` calls happened per triage audit log entry:
1. `await supabase.from('categories').select('name').eq('id', category_id)` -- one per log with category change
2. `await supabase.from('user_profiles').select('name:full_name').eq('id', assigned_to)` -- one per log with PIC change

**After:** Pre-scan all audit logs before the loop to collect unique `category_id` and `assigned_to` values. Batch-fetch both in parallel with `.in('id', ids)`. Use lookup maps (`categoryMap`, merged `userMap`) inside the loop.

### Job Detail Page (`jobs/[id]/page.tsx`)

**Fix 1 -- Assignment timeline events:**
- **Before:** Per-log sequential lookups for `newPicId` and `oldPicId` inside the assignment handler
- **After:** Pre-scan all audit logs for `assigned_to` changes (both new_data and old_data), batch-fetch unique user IDs with `.in()`, merge into `userMap` before the loop

**Fix 2 -- Approval user lookups:**
- **Before:** Two sequential `.eq('id', ...)` queries after `Promise.all` -- one for `approved_by`, one for `approval_rejected_by`
- **After:** Collect both IDs, filter those not in `userMap`, batch-fetch with single `.in('id', missingIds)` query

## Performance Impact

- **Request detail:** Worst case reduces from N+1 queries to 2 batched queries (1 categories + 1 user_profiles)
- **Job detail (timeline):** Worst case reduces from 2N queries (N new PIC + N old PIC) to 1 batched query
- **Job detail (approval):** Reduces from 2 sequential queries to 1 batched query

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 49a41b1 | perf(quick-260318-g8o): batch N+1 sequential DB queries in timeline processing |

## Self-Check: PASSED
