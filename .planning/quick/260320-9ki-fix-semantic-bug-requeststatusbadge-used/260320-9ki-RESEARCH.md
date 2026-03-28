# Quick Task: Fix Semantic Bug — RequestStatusBadge Used for Job Status

**Researched:** 2026-03-20
**Domain:** Status badge components
**Confidence:** HIGH

## Summary

In `components/requests/request-detail-info.tsx` line 368, `RequestStatusBadge` is used to render `job.status` for linked jobs in the "Linked Jobs" section. Jobs have a different status lifecycle than requests, so job-specific statuses like `created`, `assigned`, `completed`, `pending_approval`, and `pending_completion_approval` are not in the request status map -- they fall through to the raw DB value as the label and the fallback gray color.

The fix is a one-line change: replace `RequestStatusBadge` with `JobStatusBadge` and update the import.

**This is the only instance of this bug.** The `request-view-modal.tsx` also imports `RequestStatusBadge` but uses it correctly (for `request.status` only). It passes `linkedJobs` into `request-detail-info.tsx`, where the bug occurs.

## Bug Details

### Status Lifecycle Mismatch

**Request statuses** (from `lib/constants/request-status.ts`):
`submitted`, `triaged`, `in_progress`, `pending_acceptance`, `accepted`, `closed`, `rejected`, `cancelled`

**Job statuses** (from `lib/constants/job-status.ts`):
`created`, `assigned`, `in_progress`, `pending_approval`, `pending_completion_approval`, `completed`, `cancelled`

Only `in_progress` and `cancelled` overlap. The remaining 5 job statuses (`created`, `assigned`, `pending_approval`, `pending_completion_approval`, `completed`) have no entry in the request status map. The `StatusBadge` base component falls back to showing the raw DB value as the label and `bg-gray-100 text-gray-700` as the color -- so a completed job would show "completed" instead of "Completed" and miss its green color.

### Affected File

**`components/requests/request-detail-info.tsx`**
- Line 15: `import { RequestStatusBadge } from './request-status-badge';` (existing import)
- Line 368: `<RequestStatusBadge status={job.status} />` (the bug)

### Fix

1. Replace import on line 15: change `import { RequestStatusBadge } from './request-status-badge';` to `import { JobStatusBadge } from '@/components/jobs/job-status-badge';`
2. Line 368: Replace `<RequestStatusBadge status={job.status} />` with `<JobStatusBadge status={job.status} />`

### Checking if RequestStatusBadge import is still needed

`RequestStatusBadge` is NOT used anywhere else in `request-detail-info.tsx` -- it only appears on line 368 for the linked jobs. The request status itself is rendered by the parent component (detail page header or view modal header). So the `RequestStatusBadge` import on line 15 can be removed entirely and replaced with the `JobStatusBadge` import.

## Component Reference

### JobStatusBadge (`components/jobs/job-status-badge.tsx`)
```typescript
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
// Props: { status: string }
```

### RequestStatusBadge (`components/requests/request-status-badge.tsx`)
```typescript
import { RequestStatusBadge } from './request-status-badge';
// Props: { status: string }
```

Both delegate to `StatusBadge` base component -- same API, different label/color maps.

## Scope Confirmation

**Only one file affected:** `components/requests/request-detail-info.tsx` line 368.

Other files checked (all correct usage):
- `components/requests/request-view-modal.tsx` -- uses `RequestStatusBadge` for `request.status` only (line 575, correct)
- `components/requests/request-columns.tsx` -- uses `RequestStatusBadge` for request column rendering (correct)
- `components/jobs/job-columns.tsx` -- uses `JobStatusBadge` (correct)
- `components/jobs/job-modal.tsx` -- uses `JobStatusBadge` (correct)
- `components/jobs/job-detail-info.tsx` -- uses `RequestStatusBadge` for `request.status` in its linked requests section (correct -- request badge for request data)

## Sources

- `components/requests/request-detail-info.tsx` -- bug location confirmed
- `components/requests/request-status-badge.tsx` -- component source
- `components/jobs/job-status-badge.tsx` -- replacement component source
- `lib/constants/request-status.ts` -- request status enum
- `lib/constants/job-status.ts` -- job status enum
- `components/status-badge.tsx` -- base component fallback behavior
