---
phase: quick-55
plan: 01
subsystem: ui/status-badges
tags: [colors, badges, constants, consistency]
key-files:
  created:
    - lib/constants/approval-status.ts
  modified:
    - lib/constants/request-status.ts
    - lib/constants/job-status.ts
    - components/approvals/approval-queue.tsx
    - components/jobs/job-columns.tsx
    - components/jobs/job-modal.tsx
    - components/maintenance/schedule-status-badge.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
    - lib/dashboard/queries.ts
    - components/requests/request-timeline.tsx
    - components/assets/asset-timeline.tsx
decisions:
  - "PM_BADGE_CLASS uses px-2 (not px-1.5) consistently across all three render sites"
  - "Timeline event decorator colors (acceptance, transfer_initiated, transfer_accepted) also updated to canonical palette for full color hygiene"
  - "Non-status-badge purple-100 usages (admin role badge, checklist item type badge, schedule interval type badge) left unchanged — out of scope per plan definition of status badges"
metrics:
  duration: 12min
  completed: "2026-03-12"
  tasks: 2
  files: 10
---

# Phase quick-55 Plan 01: Fix Inconsistent Status Badge Colors Summary

Single source of truth for all status badge colors — emerald/slate/purple retired, canonical green/stone/violet enforced everywhere, approval queue and PM badges driven from constants.

## Canonical Color Mapping (Final)

| Semantic meaning | Canonical Tailwind class | Applies to |
|---|---|---|
| Neutral / initial / not yet processed | `bg-gray-100 text-gray-700` | request:submitted, job:created |
| Informational / assigned / triaged | `bg-blue-100 text-blue-700` | request:triaged, job:assigned, asset:in_transit |
| In-flight / active work | `bg-amber-100 text-amber-700` | request:in_progress, job:in_progress, asset:under_repair |
| Awaiting human review (pending) | `bg-violet-100 text-violet-700` | request:pending_acceptance, job:pending_approval, job:pending_completion_approval, approval:decision=pending |
| Positive outcome / done / active | `bg-green-100 text-green-700` | request:accepted, job:completed, asset:active, schedule:active, approval:decision=approved |
| Terminal failure / rejected | `bg-red-100 text-red-700` | request:rejected, asset:broken, approval:decision=rejected |
| Archived / closed / disposed | `bg-stone-100 text-stone-600` | request:cancelled, request:closed, job:cancelled, asset:sold_disposed |
| Manual-paused | `bg-yellow-100 text-yellow-700` | schedule:paused_manual |
| Approval type: budget | `bg-violet-100 text-violet-700` | approval_queue: approval_type=budget |
| Approval type: completion | `bg-orange-100 text-orange-700` | approval_queue: approval_type=completion |
| PM job type label | `bg-blue-100 text-blue-700` | job_type=preventive_maintenance badge |

## Files Changed

### lib/constants/request-status.ts
- `accepted`: `bg-emerald-100 text-emerald-700` → `bg-green-100 text-green-700`
- `closed`: `bg-slate-100 text-slate-600` → `bg-stone-100 text-stone-600`

### lib/constants/job-status.ts
- `pending_approval`: `bg-purple-100 text-purple-700` → `bg-violet-100 text-violet-700`
- `pending_completion_approval`: `bg-orange-100 text-orange-700` → `bg-violet-100 text-violet-700`

### lib/constants/approval-status.ts (NEW)
- Created with 5 exports: `APPROVAL_TYPE_COLORS`, `APPROVAL_DECISION_COLORS`, `PM_BADGE_CLASS`, `APPROVAL_TYPE_LABELS`, `APPROVAL_DECISION_LABELS`

### components/approvals/approval-queue.tsx
- Imported from `@/lib/constants/approval-status`
- Approval type badge replaced from two hardcoded conditionals to single `APPROVAL_TYPE_COLORS` lookup
- Decision badges (pending/approved/rejected) replaced from three hardcoded blocks to single `APPROVAL_DECISION_COLORS` lookup
- `approval:decision=pending` changed from hardcoded `bg-yellow-100 text-yellow-700` → `bg-violet-100 text-violet-700` via constant

### components/jobs/job-columns.tsx
- Imported `PM_BADGE_CLASS` from approval-status
- Inline PM span uses `${PM_BADGE_CLASS} shrink-0`

### components/jobs/job-modal.tsx
- Imported `PM_BADGE_CLASS` from approval-status
- Inline PM span uses `PM_BADGE_CLASS`

### app/(dashboard)/jobs/[id]/page.tsx
- Imported `PM_BADGE_CLASS` from approval-status
- Inline PM span uses `PM_BADGE_CLASS`

### components/maintenance/schedule-status-badge.tsx
- Padding corrected from `px-2.5` → `px-2` to match all other entity status badges

### lib/dashboard/queries.ts
- Removed local `JOB_STATUS_LABELS` const (duplicate of exported constant in job-status.ts)
- Added import: `import { JOB_STATUS_LABELS } from '@/lib/constants/job-status'`
- `STATUS_HEX_COLORS.accepted`: `#34d399` (emerald-400) → `#4ade80` (green-400)
- `STATUS_HEX_COLORS.closed`: `#94a3b8` (slate-400) → `#a8a29e` (stone-400)
- `JOB_STATUS_HEX_COLORS.pending_approval`: `#c084fc` (purple-400) → `#a78bfa` (violet-400)
- `JOB_STATUS_HEX_COLORS.pending_completion_approval`: `#f97316` (orange-500) → `#a78bfa` (violet-400)

### components/requests/request-timeline.tsx (deviation)
- Timeline event `acceptance` color: `bg-emerald-100 text-emerald-700` → `bg-green-100 text-green-700`

### components/assets/asset-timeline.tsx (deviation)
- Timeline event `transfer_accepted` color: `bg-emerald-100 text-emerald-700` → `bg-green-100 text-green-700`
- Timeline event `transfer_initiated` color: `bg-purple-100 text-purple-700` → `bg-blue-100 text-blue-700`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Completeness] Timeline event decorator colors also updated**
- **Found during:** Task 2 verification (grep for bg-emerald-100 in components/)
- **Issue:** `request-timeline.tsx` and `asset-timeline.tsx` had emerald/purple for timeline event dot colors, violating the canonical palette
- **Fix:** Updated to use green (positive outcome events) and blue (informational events) matching the canonical mapping
- **Files modified:** `components/requests/request-timeline.tsx`, `components/assets/asset-timeline.tsx`
- **Commits:** `5ddd0ba`

### Out of Scope (noted)

Several components still use `bg-purple-100` for non-status-badge purposes:
- Admin role badge (`admin` role in user-columns, user-menu, profile-sheet) — role label, not status badge
- Checklist item type badge (`numeric` type in template-builder-item, template-view-modal, template-detail) — item type, not status badge
- Schedule interval type badge (`Floating` in schedule-columns, schedule-detail) — interval type, not status badge
- Job timeline event `approval_submitted` decorator in job-timeline.tsx — event icon color, not status badge

These are intentionally left unchanged as they represent distinct semantic concepts outside the status badge system.

## Commits

| Hash | Description |
|------|-------------|
| `a408ce1` | feat(quick-55): fix color constants and create approval-status constants |
| `8678fb4` | feat(quick-55): replace hardcoded badge colors with constants in all consumer files |
| `5ddd0ba` | fix(quick-55): align timeline event colors with canonical palette |

## Self-Check: PASSED

- lib/constants/approval-status.ts: FOUND
- 55-SUMMARY.md: FOUND
- Commit a408ce1: FOUND
- Commit 8678fb4: FOUND
- Commit 5ddd0ba: FOUND
- Build: PASSED (zero TypeScript errors)
