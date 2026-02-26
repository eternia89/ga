---
phase: 05-jobs-approvals
plan: 13
subsystem: ui, utils
tags: [idr-formatting, combobox, inline-edit, currency]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: Job detail page, job actions, budget approval flow
provides:
  - Shared formatIDR/formatNumber/parseIDR utilities in lib/utils.ts
  - Inline PIC Combobox on job detail page
  - Normalized estimated cost field in regular dl grid
  - Dot-formatted currency inputs across the app
affects: [05-jobs-approvals, 06-inventory, 08-media-notifications-dashboards]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared-idr-formatter, inline-currency-input-formatting]

key-files:
  created: []
  modified:
    - lib/utils.ts
    - components/jobs/job-detail-info.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-detail-client.tsx
    - components/jobs/job-form.tsx
    - components/jobs/job-preview-dialog.tsx
    - components/approvals/approval-queue.tsx
    - components/admin/company-settings/company-settings-form.tsx

key-decisions:
  - "Shared formatIDR in lib/utils.ts replaces all local copies across codebase"
  - "PIC assignment via inline Combobox in edit mode, separate assign dialog removed"
  - "Estimated cost uses handleEditSave + updateJobBudget for approval flow trigger on cost change"
  - "Only GA Lead/Admin can edit all fields including PIC and cost via Edit button"

patterns-established:
  - "Currency inputs: type=text with inputMode=numeric, strip non-digits, formatNumber for display"
  - "Shared formatIDR/formatNumber/parseIDR in lib/utils.ts for all IDR formatting"

requirements-completed: [REQ-JOB-005, REQ-JOB-008, REQ-DATA-004]

# Metrics
duration: 6min
completed: 2026-02-26
---

# Phase 05 Plan 13: Inline PIC, Normalized Cost, Shared IDR Formatter Summary

**Shared IDR formatter with dot separators, inline PIC Combobox replacing assign dialog, estimated cost normalized into regular field grid**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-26T12:38:06Z
- **Completed:** 2026-02-26T12:44:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created shared formatIDR, formatNumber, parseIDR in lib/utils.ts
- Replaced all local formatIDR copies in component files with shared import
- Converted currency inputs (job form, company settings) to text inputs with live dot separators
- PIC is now an inline-editable Combobox in the field grid
- Removed the separate Assign PIC / Reassign PIC dialog and buttons
- Estimated cost moved from special bg-muted/50 section to regular dl grid field
- Budget approval status shown as subtle inline text indicators

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared IDR utility and formatted currency inputs** - `cccc943` (feat)
2. **Task 2: Inline PIC Combobox and normalized estimated cost field** - `1c333e1` (feat)

## Files Created/Modified
- `lib/utils.ts` - Added formatIDR, formatNumber, parseIDR shared utilities
- `components/jobs/job-detail-info.tsx` - Inline PIC Combobox, estimated cost in dl grid, removed special budget section
- `components/jobs/job-detail-actions.tsx` - Removed assign dialog, assignJob import, UserCheck icon
- `components/jobs/job-detail-client.tsx` - Pass users to JobDetailInfo, removed users from JobDetailActions
- `components/jobs/job-form.tsx` - Currency input with dot separator formatting
- `components/jobs/job-preview-dialog.tsx` - Replaced local formatIDR with shared import
- `components/approvals/approval-queue.tsx` - Replaced local formatIDR with shared import
- `components/admin/company-settings/company-settings-form.tsx` - Budget threshold with dot separator formatting

## Decisions Made
- Shared formatIDR takes `number` (not `number | null`) -- callers handle null check inline
- PIC assignment via Edit mode only (GA Lead/Admin), no separate assign dialog for anyone
- Estimated cost triggers updateJobBudget separately if value changed, preserving approval flow
- Removed Lock/LockOpen/Send icons from job-detail-info (no longer needed without special budget section)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All job detail page normalization complete
- IDR formatting consistent across the app
- Ready for UAT verification of Tests 6, 7, 8

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-26*
