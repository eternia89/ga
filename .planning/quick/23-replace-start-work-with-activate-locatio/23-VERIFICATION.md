---
phase: quick-23
verified: 2026-03-09T06:10:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Quick Task 23: Replace Start Work with Activate Location - Verification Report

**Task Goal:** Replace start work with activate location when location access is not granted, making location activation mandatory before PIC can start work.
**Verified:** 2026-03-09T06:10:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PIC sees 'Activate Location' button when geolocation permission is not yet granted on an assigned job | VERIFIED | job-detail-actions.tsx:372-377 renders `<Button>` with MapPin icon and "Activate Location" text when `canStartWork && !locationActivated`; job-modal.tsx:1105-1109 same pattern |
| 2 | After PIC grants geolocation permission, button changes to 'Start Work' | VERIFIED | `useGeolocationPermission` hook subscribes to PermissionStatus `change` event (use-geolocation.ts:40), reactively updating `permissionState`; both components derive `locationActivated = permissionState === 'granted'` and conditionally render Start Work button when true (job-detail-actions.tsx:379-384, job-modal.tsx:1112) |
| 3 | PIC must click 'Start Work' separately after activating location (two-step flow) | VERIFIED | `handleActivateLocation` (job-detail-actions.tsx:168-179) only calls `capturePosition()` and shows success feedback; `handleStartWork` (line 181-214) is a separate handler that calls `updateJobStatus`. Two distinct buttons, two distinct handlers. Same pattern in job-modal.tsx:603+ |
| 4 | 'Mark Complete' is NOT gated behind location activation | VERIFIED | No grep matches for `canMarkComplete.*locationActivated` in either component. Mark Complete button rendered solely on `canMarkComplete` condition (job-detail-actions.tsx:425-430, job-modal.tsx:1158-1162) |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/use-geolocation.ts` | useGeolocationPermission hook exporting permission state | VERIFIED | Hook at lines 18-56, exports `useGeolocationPermission` returning `{ permissionState }`, uses Permissions API with change event listener and cleanup |
| `components/jobs/job-detail-actions.tsx` | Activate Location / Start Work two-step button on job detail page | VERIFIED | Imports hook (line 6), derives `locationActivated` (line 74), two conditional button renders (lines 372-384), separate `handleActivateLocation` handler (lines 168-179) |
| `components/jobs/job-modal.tsx` | Activate Location / Start Work two-step button in job modal | VERIFIED | Imports hook (line 15), derives `locationActivated` (line 172), two conditional button renders (lines 1105-1112), separate `handleActivateLocation` handler (line 603) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/jobs/job-detail-actions.tsx` | `hooks/use-geolocation.ts` | useGeolocationPermission import | WIRED | Line 6: `import { useGeolocation, useGeolocationPermission } from '@/hooks/use-geolocation'`; used at line 73 |
| `components/jobs/job-modal.tsx` | `hooks/use-geolocation.ts` | useGeolocationPermission import | WIRED | Line 15: `import { useGeolocation, useGeolocationPermission } from '@/hooks/use-geolocation'`; used at line 171 |

### Anti-Patterns Found

None found. No TODO/FIXME/placeholder comments, no empty implementations, no stub handlers.

### Human Verification Required

### 1. Activate Location Browser Prompt Flow

**Test:** As PIC on an assigned job, click "Activate Location" button.
**Expected:** Browser geolocation permission prompt appears. After granting, button reactively changes to "Start Work" without page refresh. Success message "Location activated. You can now start work." displayed.
**Why human:** Requires real browser geolocation permission interaction.

### 2. Denied Permission Handling

**Test:** As PIC, click "Activate Location" with geolocation denied in browser settings.
**Expected:** Error message displayed guiding user to fix browser settings.
**Why human:** Requires browser permission state manipulation.

---

_Verified: 2026-03-09T06:10:00Z_
_Verifier: Claude (gsd-verifier)_
