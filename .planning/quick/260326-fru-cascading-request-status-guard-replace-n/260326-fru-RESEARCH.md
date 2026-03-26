# Quick Task: Cascading Request Status Guard Fix - Research

**Researched:** 2026-03-26
**Domain:** Request status lifecycle / cascading updates
**Confidence:** HIGH

## Summary

When a job completes (either directly via `updateJobStatus` or via `approveCompletion`), linked requests are cascaded to `pending_acceptance`. The current filter `.neq('status', 'cancelled')` is too broad -- it excludes only `cancelled` requests but would happily transition requests in terminal states like `accepted`, `closed`, or `rejected` back to `pending_acceptance`, which is an invalid state resurrection.

The direct `completeRequest` action in `request-actions.ts` already enforces the correct guard: it only allows transition from `['triaged', 'in_progress']` (line 335). The cascading paths in `job-actions.ts` and `approval-actions.ts` should match this same constraint.

**Primary recommendation:** Replace `.neq('status', 'cancelled')` with `.in('status', ['triaged', 'in_progress'])` in both locations.

## Request Status Lifecycle

All 8 request statuses from `lib/constants/request-status.ts`:

```
submitted -> triaged -> in_progress -> pending_acceptance -> accepted -> closed
                                    \-> rejected (if work rejected, reverts to in_progress)
                                    \-> cancelled (user/admin cancels)
```

### Valid source states for `pending_acceptance` transition

From the existing `completeRequest` action (`request-actions.ts:335`):
```typescript
if (!['triaged', 'in_progress'].includes(request.status)) {
  throw new Error('Request can only be completed when in Triaged or In Progress status');
}
```

This is the authoritative guard. Only `triaged` and `in_progress` requests should transition to `pending_acceptance`.

### States that `.neq('status', 'cancelled')` incorrectly allows

| Status | Should transition? | Why |
|--------|-------------------|-----|
| `submitted` | NO | Not yet triaged -- premature |
| `triaged` | YES | Valid pre-completion state |
| `in_progress` | YES | Valid pre-completion state |
| `pending_acceptance` | NO | Already pending -- would overwrite `completed_at` |
| `accepted` | NO | Terminal -- work already accepted |
| `closed` | NO | Terminal -- request closed |
| `rejected` | NO | Terminal -- request was rejected |
| `cancelled` | NO | Only one currently excluded |

The `.neq('status', 'cancelled')` filter permits 5 invalid transitions (submitted, pending_acceptance, accepted, closed, rejected).

## Exact Locations to Fix

### Location 1: `app/actions/approval-actions.ts` line 204

Context: `approveCompletion` action -- when job creator approves a job's completion.

```typescript
// BEFORE (line 196-204):
const { error: reqUpdateError } = await supabase
  .from('requests')
  .update({
    status: 'pending_acceptance',
    completed_at: now,
    updated_at: now,
  })
  .in('id', requestIds)
  .neq('status', 'cancelled');  // <-- TOO BROAD

// AFTER:
  .in('status', ['triaged', 'in_progress']);  // <-- ALLOWLIST
```

### Location 2: `app/actions/job-actions.ts` line 589

Context: `updateJobStatus` action -- when a job is directly completed (no completion approval required).

```typescript
// BEFORE (line 581-589):
await supabase
  .from('requests')
  .update({
    status: 'pending_acceptance',
    completed_at: now,
    updated_at: now,
  })
  .in('id', requestIds)
  .neq('status', 'cancelled');  // <-- TOO BROAD

// AFTER:
  .in('status', ['triaged', 'in_progress']);  // <-- ALLOWLIST
```

## Bug Fix Protocol: Similar Patterns Scan

### Other `.neq('status', ...)` in action files

Scanned all `app/actions/*.ts` files. Results:

| File | Line | Pattern | Verdict |
|------|------|---------|---------|
| `approval-actions.ts:204` | `.neq('status', 'cancelled')` | **BUG -- fix** |
| `job-actions.ts:589` | `.neq('status', 'cancelled')` | **BUG -- fix** |
| `maintenance/page.tsx:87` | `.neq('status', 'sold_disposed')` | OK -- inventory item filter, not a cascading status update |
| `company-actions.ts:59,160` | `.neq('id', id)` | OK -- duplicate name check |
| `category-actions.ts:81,188` | `.neq('id', id)` | OK -- duplicate name check |
| `division-actions.ts:82,163` | `.neq('id', id)` | OK -- duplicate name check |
| `location-actions.ts:63,153` | `.neq('id', id)` | OK -- duplicate name check |
| `user-actions.ts:232` | `.neq('id', parsedInput.id)` | OK -- duplicate email check |
| `job-actions.ts:274` | `.neq('job_id', id)` | OK -- rule 3 duplicate link check |

**Only 2 instances of the bug exist** -- both are the cascading request status updates identified in the task.

### Already-correct patterns in the codebase

The codebase already uses allowlist `.in('status', [...])` for other cascading updates:

1. **Job creation** (`job-actions.ts:175`): `.in('status', ['triaged'])` -- moves triaged requests to in_progress
2. **Job update / link new requests** (`job-actions.ts:303`): `.in('status', ['triaged'])` -- same pattern
3. **Job cancellation** (`job-actions.ts:695`): `.in('status', ['in_progress', 'pending_acceptance'])` -- reverts to triaged

These demonstrate the correct allowlist approach is already the project convention.

## Common Pitfall

The `completed_at` timestamp overwite is a secondary concern: if a request is already in `pending_acceptance` (from an earlier completion), the current code would overwrite its `completed_at` with a new timestamp. The `.in('status', ['triaged', 'in_progress'])` fix also prevents this because `pending_acceptance` is not in the allowlist.

## Sources

### Primary (HIGH confidence)
- `lib/constants/request-status.ts` -- all 8 request statuses
- `app/actions/request-actions.ts:335` -- authoritative guard for `pending_acceptance` transition
- `app/actions/approval-actions.ts:196-204` -- bug location 1
- `app/actions/job-actions.ts:581-589` -- bug location 2
- `app/actions/job-actions.ts:175,303,695` -- correct allowlist patterns already in use
