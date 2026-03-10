---
phase: quick-36
plan: 36
subsystem: jobs
tags: [timeline, formatting, IDR, currency]
key-files:
  modified:
    - components/jobs/job-timeline.tsx
decisions:
  - FIELD_LABELS map added for extensibility — future field renames only need one line here
metrics:
  duration: "3 min"
  completed: "2026-03-10"
  tasks: 1
  files: 1
---

# Quick Task 36: Estimated Cost in Job Timeline — IDR Formatting

**One-liner:** Format estimated_cost field_update events as IDR currency (Rp 1.500.000) and display "Estimated Cost" label instead of raw DB column name.

## What Was Done

### Task 1: Format estimated_cost values and humanize field name in job timeline

Updated `components/jobs/job-timeline.tsx` with three additions:

1. Added `formatIDR` to the import from `@/lib/utils` (alongside existing `formatDateTime`).

2. Added `FIELD_LABELS` constant mapping raw DB field names to user-facing labels:
   - `estimated_cost` -> `'Estimated Cost'`

3. Added `formatFieldValue` module-level helper that applies `formatIDR` when the field is `estimated_cost`, returning the value unchanged for all other fields.

4. Updated the `field_update` case in `EventContent` to:
   - Use `FIELD_LABELS[field ?? ''] ?? field ?? 'a field'` for the label display
   - Apply `formatFieldValue` to both `old_value` and `new_value` before rendering

**Before:** "John updated estimated_cost from "500000" to "1500000""
**After:** "John updated Estimated Cost from "Rp 500.000" to "Rp 1.500.000""

**Commit:** 74eb908

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `components/jobs/job-timeline.tsx` modified with correct changes
- [x] Build passes: `npm run build` completed with no TypeScript errors
- [x] Commit 74eb908 exists

## Self-Check: PASSED
