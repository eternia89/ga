---
phase: quick-47
verified: 2026-03-11T07:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Navigate to /jobs — click New Job button — observe URL"
    expected: "URL becomes /jobs?action=create while modal is open"
    why_human: "URL update via router.replace is a runtime browser behavior; cannot grep for it"
  - test: "Close the New Job modal (Escape, backdrop click, or Cancel) while at /jobs?action=create"
    expected: "URL returns to /jobs with no ?action=create suffix"
    why_human: "URL clearing on close is a runtime behavior; cannot verify statically"
  - test: "Navigate directly to /jobs?action=create"
    expected: "New Job modal opens automatically on page load"
    why_human: "initialOpen prop driven from server searchParams — needs browser confirmation"
  - test: "Navigate to /inventory — click New Asset button — observe URL"
    expected: "URL becomes /inventory?action=create while modal is open"
    why_human: "Same router.replace behavior, runtime only"
  - test: "Close the New Asset modal — including after successful creation"
    expected: "URL returns to /inventory with no ?action=create suffix"
    why_human: "onSuccess path uses handleOpenChange(false) — needs end-to-end browser run"
  - test: "Navigate directly to /inventory?action=create"
    expected: "New Asset modal opens automatically on page load"
    why_human: "Server-rendered initialOpen prop — needs browser confirmation"
---

# Quick Task 47: Add Permalink Support to New Job and New Asset Create Modals — Verification Report

**Task Goal:** Add bidirectional ?action=create URL sync to JobCreateDialog and AssetCreateDialog so navigating to /jobs?action=create or /inventory?action=create opens the modal, and clicking the CTA button writes ?action=create to the URL.
**Verified:** 2026-03-11T07:00:00Z
**Status:** human_needed (all automated checks passed; 6 runtime behaviors need browser confirmation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Navigating to /jobs?action=create opens the New Job modal automatically | ? HUMAN | `jobs/page.tsx` line 228: `initialOpen={action === 'create'}` passed to `<JobCreateDialog>`; `useState(initialOpen ?? false)` in dialog initialises open state from prop |
| 2 | Navigating to /inventory?action=create opens the New Asset modal automatically | ? HUMAN | `inventory/page.tsx` line 195: `initialOpen={action === 'create'}` passed to `<AssetCreateDialog>`; same useState pattern |
| 3 | Clicking the New Job button updates the URL to ?action=create | ? HUMAN | Button `onClick={() => handleOpenChange(true)}` in `job-create-dialog.tsx` line 55; handler calls `router.replace(?action=create)` — correct code path exists |
| 4 | Clicking the New Asset button updates the URL to ?action=create | ? HUMAN | Button `onClick={() => handleOpenChange(true)}` in `asset-create-dialog.tsx` line 52; handler calls `router.replace(?action=create)` |
| 5 | Closing either modal removes ?action=create from the URL | ? HUMAN | `handleOpenChange(false)` path calls `params.delete('action')` then `router.replace(...)` in both files; asset `onSuccess` also routes through `handleOpenChange(false)` (line 67) |

**Score:** 5/5 truths have complete, correct implementation — all marked ? HUMAN because URL manipulation is a runtime browser behavior that static code analysis cannot exercise.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/jobs/job-create-dialog.tsx` | Bidirectional URL sync for New Job modal | VERIFIED | 74 lines; imports `useRouter` + `useSearchParams`; `handleOpenChange` sets/clears `?action=create`; Button onClick and `<JobModal onOpenChange>` both route through handler |
| `components/assets/asset-create-dialog.tsx` | Bidirectional URL sync for New Asset modal | VERIFIED | 75 lines; same pattern; `<Dialog onOpenChange={handleOpenChange}>`; `AssetSubmitForm onSuccess` correctly calls `handleOpenChange(false)` (not the bare `setOpen`) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/jobs/job-create-dialog.tsx` | URL `?action=create` param | `useRouter + useSearchParams` | WIRED | `useSearchParams()` imported (line 4); `handleOpenChange` calls `params.set('action','create')` / `params.delete('action')` + `router.replace` — both open and close paths present |
| `components/assets/asset-create-dialog.tsx` | URL `?action=create` param | `useRouter + useSearchParams` | WIRED | Same imports (line 4); identical handler pattern; `onSuccess` uses `handleOpenChange(false)` ensuring close-path URL cleanup after successful creation |
| `app/(dashboard)/jobs/page.tsx` | `JobCreateDialog` | `initialOpen={action === 'create'}` | WIRED | Line 228 passes `initialOpen={action === 'create'}` where `action` is destructured from awaited `searchParams` (line 13) |
| `app/(dashboard)/inventory/page.tsx` | `AssetCreateDialog` | `initialOpen={action === 'create'}` | WIRED | Line 195 passes `initialOpen={action === 'create'}` using same server searchParams pattern |

---

### Requirements Coverage

No requirement IDs declared in plan frontmatter (`requirements: []`). This is a UX enhancement task with no tracked requirements.

---

### Anti-Patterns Found

None. Both files are clean — no TODO/FIXME/console.log/empty handlers/stubs detected.

---

### Human Verification Required

#### 1. New Job button writes ?action=create to URL

**Test:** Visit /jobs (as ga_lead or admin role), click the "New Job" button, observe the browser address bar.
**Expected:** URL changes to `/jobs?action=create` while the modal is open.
**Why human:** `router.replace` is called at runtime in the browser — static grep confirms the call exists but cannot verify it executes and the browser reflects it.

#### 2. Closing New Job modal clears ?action=create

**Test:** From /jobs?action=create (modal open), press Escape or click the backdrop or click Cancel.
**Expected:** URL returns to `/jobs` with no query string.
**Why human:** The close path runs `params.delete('action')` + `router.replace(window.location.pathname)` — needs runtime confirmation that the cleanup fires for all close triggers (Escape, backdrop, cancel button).

#### 3. Direct navigation to /jobs?action=create opens modal

**Test:** Paste `/jobs?action=create` into the address bar and load.
**Expected:** New Job modal is open immediately on page load.
**Why human:** Server SSR reads `searchParams.action`, passes `initialOpen={true}` to dialog, which initialises `useState(true)` — correct path exists but needs a browser load to confirm.

#### 4. New Asset button writes ?action=create to URL

**Test:** Visit /inventory (as ga_staff, ga_lead, or admin), click "New Asset", observe address bar.
**Expected:** URL changes to `/inventory?action=create`.
**Why human:** Same runtime router.replace concern.

#### 5. Closing New Asset modal (including after save) clears ?action=create

**Test:** Open the New Asset modal via button, fill and submit a new asset successfully; also test cancel/Escape.
**Expected:** URL returns to `/inventory` after both successful creation and manual dismissal.
**Why human:** The `onSuccess` path calls `handleOpenChange(false)` which runs URL cleanup — the deviation-from-plan fix (SUMMARY decision 1) makes this correct but it needs end-to-end browser run to confirm.

#### 6. Direct navigation to /inventory?action=create opens modal

**Test:** Paste `/inventory?action=create` into address bar and load.
**Expected:** New Asset modal opens on page load.
**Why human:** Same SSR initialOpen mechanism as #3.

---

### Gaps Summary

No gaps. All implementation is complete and correct:

- Both `job-create-dialog.tsx` and `asset-create-dialog.tsx` import `useSearchParams` and `useRouter`.
- Both define a `handleOpenChange` handler that sets `?action=create` on open and deletes it on close.
- Both wire the Button's `onClick` and the Dialog's `onOpenChange` through `handleOpenChange`.
- The `AssetCreateDialog`'s `onSuccess` callback correctly uses `handleOpenChange(false)` rather than raw `setOpen(false)`, ensuring URL cleanup after successful creation.
- Both page server components pass `initialOpen={action === 'create'}` so direct navigation already works.
- Commit `dd971dc` confirmed present and touches only the two expected files (+41/-7 lines).

The only open items are 6 runtime browser behaviors that require human verification.

---

_Verified: 2026-03-11T07:00:00Z_
_Verifier: Claude (gsd-verifier)_
