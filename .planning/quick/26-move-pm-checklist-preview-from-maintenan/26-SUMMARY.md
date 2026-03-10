---
phase: quick-26
plan: 01
subsystem: ui
tags: [maintenance, template, preview, dialog, checklist]

requires:
  - phase: 07-preventive-maintenance
    provides: PMChecklistPreview component, template detail page, schedule detail pages
provides:
  - Preview Form modal on template detail page with placeholder data
  - Clean schedule pages without preview references
affects: [maintenance-templates, maintenance-schedules]

tech-stack:
  added: []
  patterns: [modal-preview-on-template]

key-files:
  created: []
  modified:
    - components/maintenance/template-detail.tsx
    - components/maintenance/schedule-detail.tsx
    - components/maintenance/schedule-view-modal.tsx

key-decisions:
  - "Preview Form button visible to all users (not gated behind canManage) since it is read-only"
  - "In edit mode, preview reflects watched form checklist (unsaved edits); in read-only mode uses template.checklist"

patterns-established:
  - "Modal preview with placeholder data for template-level previews"

requirements-completed: [QUICK-26]

duration: 3min
completed: 2026-03-09
---

# Quick 26: Move PM Checklist Preview from Schedules to Templates Summary

**Preview Form modal on template detail page with placeholder data; schedule preview button and route removed**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T03:24:49Z
- **Completed:** 2026-03-09T03:28:12Z
- **Tasks:** 2
- **Files modified:** 3 (1 deleted)

## Accomplishments
- Template detail page shows Preview Form button (visible to all users) that opens a large modal with interactive checklist preview
- Preview uses placeholder data for schedule-specific fields (asset name, due date, assigned user)
- In edit mode, preview reflects unsaved checklist edits via form watch
- Schedule detail page, schedule view modal, and /maintenance/schedules/[id]/preview route all cleaned up

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Preview Form modal to template detail page** - `902dd3e` (feat)
2. **Task 2: Remove preview from schedules and delete preview route** - `84c44d1` (feat)

## Files Created/Modified
- `components/maintenance/template-detail.tsx` - Added Dialog, PMChecklistPreview import, previewOpen state, Preview Form button, and modal
- `components/maintenance/schedule-detail.tsx` - Removed Preview Form Link+Button block, removed unused Link import
- `components/maintenance/schedule-view-modal.tsx` - Removed Preview Form button from sticky action bar
- `app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx` - Deleted

## Decisions Made
- Preview Form button placed outside canManage gate so all users can preview (read-only operation)
- In edit mode, preview uses watched checklist from form (reflects unsaved edits); in read-only mode uses template.checklist

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Next.js cached type validator referenced deleted preview route -- resolved by clearing .next/types cache

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Template preview fully functional
- Schedule pages clean of all preview references

---
*Phase: quick-26*
*Completed: 2026-03-09*
