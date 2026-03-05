---
phase: quick-9
verified: 2026-03-05T07:37:53Z
status: gaps_found
score: 7/9 must-haves verified
gaps:
  - truth: "All modals use the split-view layout (left panel + right panel) per locked layout decision"
    status: failed
    reason: "TemplateViewModal and ScheduleViewModal use a single scrollable body (embedding the full TemplateDetail/ScheduleDetail component) rather than a two-panel grid layout. Only JobViewModal and AssetViewModal implement the split-view grid."
    artifacts:
      - path: "components/maintenance/template-view-modal.tsx"
        issue: "Body at line 268 is a single 'flex-1 min-h-0 overflow-y-auto' div containing TemplateDetail wholesale. No grid-cols split."
      - path: "components/maintenance/schedule-view-modal.tsx"
        issue: "Body at line 286 is a single 'flex-1 min-h-0 overflow-y-auto' div containing ScheduleDetail wholesale. No grid-cols split."
    missing:
      - "Split template modal body into two panels: left (template metadata/edit form) and right (checklist items list)"
      - "Split schedule modal body into two panels: left (schedule detail/edit form) and right (PM Jobs list)"
  - truth: "All modals have a sticky action bar at the bottom per locked layout decision"
    status: failed
    reason: "TemplateViewModal and ScheduleViewModal have a sticky action bar div but it contains only a text label, not functional action buttons. The plan specifies Deactivate/Reactivate buttons for templates and Pause/Resume/Deactivate buttons for schedules in the sticky bar. These actions remain embedded inside the TemplateDetail/ScheduleDetail components instead."
    artifacts:
      - path: "components/maintenance/template-view-modal.tsx"
        issue: "Sticky bar at line 277 renders only a text span with the template name. No Deactivate/Reactivate buttons."
      - path: "components/maintenance/schedule-view-modal.tsx"
        issue: "Sticky bar at line 295 renders only a text span with schedule name. No Pause/Resume/Deactivate buttons."
    missing:
      - "Move Deactivate/Reactivate actions to the TemplateViewModal sticky bar (via server action calls or a hideActions prop on TemplateDetail)"
      - "Move Pause/Resume/Deactivate actions to the ScheduleViewModal sticky bar (via server action calls or a hideActions prop on ScheduleDetail)"
---

# Quick Task 9: Implement Modal View Pattern on All Tables — Verification Report

**Task Goal:** Implement modal view pattern on all table list pages (Jobs, Assets, Maintenance Templates, Maintenance Schedules)
**Verified:** 2026-03-05T07:37:53Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Clicking View on a job row opens a modal with full job details without navigating away | VERIFIED | `job-table.tsx` handleView sets `viewJobId`; JobViewModal at line 132 with jobId wired |
| 2 | Clicking View on an asset row opens a modal with full asset details without navigating away | VERIFIED | `asset-table.tsx` handleView sets `viewAssetId`; AssetViewModal at line 113 with assetId wired |
| 3 | Clicking a template name opens a modal with full template details without navigating away | VERIFIED | `template-columns.tsx` Name column onClick calls `meta.onView`; TemplateViewModal wired at line 93 |
| 4 | Clicking a schedule row View opens a modal with full schedule details without navigating away | VERIFIED | `schedule-columns.tsx` View button calls `meta.onView`; ScheduleViewModal wired at line 109 |
| 5 | All modals sync ?view=entityId to the URL for permalink support | VERIFIED | All 4 modals use `window.history.replaceState(null, '', '?view=' + id)` on open, restore pathname on close. All 4 pages accept `searchParams.view` and pass `initialViewId` |
| 6 | All modals have prev/next navigation arrows when opened from a filtered list | VERIFIED | All 4 modals implement ChevronLeft/ChevronRight with entityIds array prop and onNavigate callback |
| 7 | All modals follow the 800px, max-h-[90vh], full-screen-on-mobile pattern from RequestViewModal | VERIFIED | All 4 modals have `max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0` |
| 8 | All modals use the split-view layout (left panel + right panel) per locked layout decision | FAILED | JobViewModal and AssetViewModal have split layout (`grid-cols-[1fr_350px]`). TemplateViewModal and ScheduleViewModal use single scrollable body with embedded detail component — no two-panel split. |
| 9 | All modals have a sticky action bar at the bottom per locked layout decision | FAILED | JobViewModal and AssetViewModal have sticky bars with functional buttons. TemplateViewModal (line 277) and ScheduleViewModal (line 295) have the structural div but contain only a text label — no action buttons. Actions remain inside the embedded TemplateDetail/ScheduleDetail components. |

**Score:** 7/9 truths verified

### Required Artifacts

| Artifact | Expected | Min Lines | Actual Lines | Status | Details |
|----------|----------|-----------|--------------|--------|---------|
| `components/jobs/job-view-modal.tsx` | Job view modal with client-side data fetching, split layout, sticky action bar | 200 | 1084 | VERIFIED | Full implementation with timeline processing, split layout, functional action bar |
| `components/assets/asset-view-modal.tsx` | Asset view modal with client-side data fetching, split layout, sticky action bar | 200 | 513 | VERIFIED | Reuses AssetDetailInfo/AssetDetailActions/AssetTimeline, split layout present |
| `components/maintenance/template-view-modal.tsx` | Template view modal with split layout (metadata left, checklist right), sticky action bar | 150 | 287 | PARTIAL | File exists and is substantive, but no split layout and no functional action buttons in sticky bar |
| `components/maintenance/schedule-view-modal.tsx` | Schedule view modal with split layout (detail left, PM jobs right), sticky action bar | 150 | 306 | PARTIAL | File exists and is substantive, but no split layout and no functional action buttons in sticky bar |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/jobs/job-table.tsx` | `components/jobs/job-view-modal.tsx` | `viewJobId` state + `onOpenChange` | WIRED | Import at line 13; render at line 132 with `jobId={viewJobId}` and `onOpenChange` clearing state; `jobIds={filteredData.map(j=>j.id)}` and `onNavigate={setViewJobId}` |
| `components/assets/asset-table.tsx` | `components/assets/asset-view-modal.tsx` | `viewAssetId` state + `onOpenChange` | WIRED | Import at line 11; render at line 113 with `assetId={viewAssetId}`; `assetIds={filteredData.map(a=>a.id)}` and `onNavigate={setViewAssetId}` |
| `components/maintenance/template-list.tsx` | `components/maintenance/template-view-modal.tsx` | `viewTemplateId` state + `onOpenChange` | WIRED | Import at line 8; render at line 93; state at line 25; `onNavigate={setViewTemplateId}` |
| `components/maintenance/schedule-list.tsx` | `components/maintenance/schedule-view-modal.tsx` | `viewScheduleId` state + `onOpenChange` | WIRED | Import at line 8; render at line 109; state at line 25; `onNavigate={setViewScheduleId}` |

### Requirements Coverage

No requirements declared in plan frontmatter (`requirements: []`). Task is a UI pattern implementation.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/maintenance/template-view-modal.tsx` | 277-281 | Sticky action bar has no functional buttons — only a text label | Warning | Sticky bar structure is present but non-functional. Actions are inside embedded TemplateDetail, defeating the purpose of a dedicated action bar. |
| `components/maintenance/schedule-view-modal.tsx` | 295-299 | Sticky action bar has no functional buttons — only a text label | Warning | Same issue as template modal. Sticky bar is structural only; Pause/Resume/Deactivate remain inside ScheduleDetail. |

### Human Verification Required

#### 1. Job modal full-detail rendering

**Test:** Open any job from the jobs list (click View). Verify the modal shows: display ID, status badge, priority badge, PM badge (if applicable), job info panel, PM checklist (if applicable), timeline with events, comment section, and action buttons appropriate to job status and user role.
**Expected:** Modal opens without page navigation. All sections populated. Buttons enable/disable based on role.
**Why human:** The split layout and conditional rendering of sections (PM checklist, action bar button visibility) depends on runtime data and user role state.

#### 2. Asset modal full-detail rendering

**Test:** Open any asset from the inventory list. Verify the modal shows: display ID, status badge, asset info, photos, invoices, transfer status (if pending), timeline. Test transfer actions if applicable.
**Expected:** Modal opens without page navigation. Photo URLs signed and visible. Transfer respond dialog opens correctly.
**Why human:** Signed URL generation and dialog z-index stacking require visual verification.

#### 3. Job/Asset modal prev/next navigation and URL permalink

**Test:** Open a job or asset from a filtered list (apply a filter first). Click next/prev arrows. Verify URL changes from `?view=id1` to `?view=id2`. Copy URL, open in new tab — modal should auto-open showing that entity.
**Expected:** Smooth navigation, URL updates, permalink works.
**Why human:** Navigation behavior and URL state requires interactive testing.

### Gaps Summary

Two gaps are blocking full goal achievement for the maintenance modal pair:

**Gap 1 — Split layout missing in TemplateViewModal and ScheduleViewModal:** The plan specifies "All modals use the split-view layout (left panel + right panel)" and describes left panel (metadata/edit form) and right panel (checklist items for templates, PM jobs list for schedules). The implementation chose to embed TemplateDetail and ScheduleDetail wholesale in a single scrollable body. While the SUMMARY documents this as a deliberate decision ("embed their existing Detail components wholesale rather than splitting into panels"), this deviates from the locked layout truth in the plan's must_haves.

**Gap 2 — Sticky action bar has no functional buttons for template and schedule modals:** The plan specifies Deactivate/Reactivate buttons for the template sticky bar and Pause/Resume/Deactivate buttons for the schedule sticky bar. The actual sticky bars contain only text labels (the template/schedule name). The action buttons live inside the embedded TemplateDetail/ScheduleDetail components, which already have their own button UIs. The sticky bar exists structurally but doesn't serve as an action surface.

Both gaps affect the same two components (template and schedule modals) and stem from the same root cause: the decision to embed the detail component wholesale instead of splitting its content into two panels and moving its actions to the sticky bar.

---

_Verified: 2026-03-05T07:37:53Z_
_Verifier: Claude (gsd-verifier)_
