---
phase: quick
plan: 35
subsystem: assets
tags: [sticky-bar, dirty-state, form-ux, consistency]
dependency_graph:
  requires: []
  provides: [asset-detail-sticky-save-bar]
  affects: [asset-detail-client, asset-detail-info, asset-edit-form]
tech_stack:
  added: []
  patterns: [sticky-save-bar, dirty-state-detection, useEffect-formState]
key_files:
  created: []
  modified:
    - components/assets/asset-edit-form.tsx
    - components/assets/asset-detail-info.tsx
    - components/assets/asset-detail-client.tsx
decisions:
  - "No separate save button inside the form body — button lives exclusively in sticky bar"
  - "formId defaults to 'asset-edit-form' for backward compatibility with any existing callers"
metrics:
  duration: 8min
  completed_date: 2026-03-10
---

# Quick Task 35: Add Sticky Save Bar to Asset Detail Page Summary

**One-liner:** Dirty-state detection via useEffect on form.formState.isDirty wired through AssetEditForm → AssetDetailInfo → AssetDetailClient, rendering a fixed bottom bar with Save Changes button matching the request/job/template/schedule pattern.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Add formId and onDirtyChange to AssetEditForm and wire through AssetDetailInfo | 480f0f5 | asset-edit-form.tsx, asset-detail-info.tsx |
| 2 | Add sticky bottom bar to AssetDetailClient | ddde5b8 | asset-detail-client.tsx |

## What Was Built

The asset detail page now shows a sticky bottom bar ("Unsaved changes" + "Save Changes" button) that appears whenever the edit form has unsaved changes. This matches the identical pattern used on request, job, template, and schedule detail pages.

**Prop chain added:**
- `AssetEditForm`: new `formId?: string` and `onDirtyChange?: (isDirty: boolean) => void` props; `useEffect` calls `onDirtyChange` on `form.formState.isDirty` changes; form `id` attribute uses `formId ?? 'asset-edit-form'`
- `AssetDetailInfo`: new `formId` and `onDirtyChange` props forwarded to `AssetEditForm`
- `AssetDetailClient`: new `isDirty`, `isSubmitting` state + `FORM_ID` constant; passes all three to `AssetDetailInfo`; renders sticky bar when `isDirty` is true

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria Met

- [x] Asset detail page shows sticky bottom bar on form dirty state
- [x] Bar contains "Unsaved changes" (left) and "Save Changes" button (right)
- [x] Bar only appears when form is dirty
- [x] Build passes with zero TypeScript/lint errors
- [x] Pattern matches request/job/template/schedule detail pages exactly

## Self-Check: PASSED

- FOUND: components/assets/asset-edit-form.tsx
- FOUND: components/assets/asset-detail-info.tsx
- FOUND: components/assets/asset-detail-client.tsx
- FOUND commit 480f0f5 (Task 1)
- FOUND commit ddde5b8 (Task 2)
