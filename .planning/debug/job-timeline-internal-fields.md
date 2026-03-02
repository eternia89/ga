---
status: resolved
trigger: "The job timeline shows internal database field changes like 'Samuela updated updated_at from ...' These internal field updates should be filtered out."
created: 2026-02-27T00:00:00.000Z
updated: 2026-02-27T00:01:00.000Z
---

## Current Focus

hypothesis: CONFIRMED - The "Generic field update" fallthrough in the audit log processor has no blocklist for internal DB fields
test: Read jobs/[id]/page.tsx audit log processing loop
expecting: Found the exact lines responsible
next_action: DONE - root cause found

## Symptoms

expected: Timeline shows only meaningful user-driven changes (status, PIC, description, etc.)
actual: Timeline shows internal DB fields like updated_at with raw ISO timestamps
errors: None (it renders but shows noise)
reproduction: Open any job detail page and view the activity/timeline section
started: Unknown - likely always present

## Eliminated

- hypothesis: filtering done in job-timeline.tsx component
  evidence: job-timeline.tsx just renders whatever events array it receives - no filtering at all
  timestamp: 2026-02-27

## Evidence

- timestamp: 2026-02-27
  checked: components/jobs/job-timeline.tsx
  found: Component is a pure renderer - takes events[] prop and renders them. No field filtering logic at all.
  implication: Filtering must happen upstream where events are built.

- timestamp: 2026-02-27
  checked: app/(dashboard)/jobs/[id]/page.tsx lines 398-411
  found: "Generic field update" fallthrough block takes changedFields[0] and emits a field_update event with no blocklist. Any DB field not matched by earlier specific checks (status, assigned_to, approved_at, etc.) falls through here, including updated_at, created_at, deleted_at, etc.
  implication: This is the root cause.

- timestamp: 2026-02-27
  checked: app/(dashboard)/requests/[id]/page.tsx lines 312-324
  found: Identical pattern - same "Generic field update" fallthrough with no blocklist.
  implication: Same bug exists in the requests timeline.

- timestamp: 2026-02-27
  checked: components/assets/asset-timeline.tsx line 328
  found: Asset timeline ALREADY has a partial fix: filters out 'status', 'notes', 'updated_at' before emitting field_update. But it also skips the entire event if nonStatusFields is empty (good pattern).
  implication: Asset timeline is the reference implementation to model the fix on.

## Resolution

root_cause: |
  In app/(dashboard)/jobs/[id]/page.tsx (lines 398-411) and app/(dashboard)/requests/[id]/page.tsx (lines 312-324),
  the audit log processing loop has a "Generic field update" fallthrough that emits a field_update timeline event
  for ANY field in changedFields[0] that wasn't caught by the earlier specific checks (status, assigned_to, etc.).
  Internal database management fields like updated_at, created_at, deleted_at are stored in changedFields by the
  Supabase trigger/audit system. When an UPDATE touches only updated_at (or alongside other changes), they pass
  through to the generic fallthrough and become visible timeline events.

fix: Add a BLOCKLIST of internal fields before the generic fallthrough. Skip the event entirely (continue) if
  changedFields after filtering is empty. Model on the asset-timeline pattern.

verification: N/A - diagnosis only mode
files_changed:
  - app/(dashboard)/jobs/[id]/page.tsx
  - app/(dashboard)/requests/[id]/page.tsx
