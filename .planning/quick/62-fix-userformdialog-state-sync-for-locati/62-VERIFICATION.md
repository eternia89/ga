---
phase: quick-62
verified: 2026-03-13T08:10:00Z
status: human_needed
score: 2/3 must-haves verified programmatically
human_verification:
  - test: "Open Edit User dialog for a user belonging to Company A, then close it and open Edit User dialog for a user belonging to Company B"
    expected: "Location dropdown shows only locations for Company B, not Company A"
    why_human: "Cannot run browser — requires observing rendered dropdown options across two sequential dialog opens"
  - test: "Edit a user's company access checkboxes, save, then immediately re-open the edit dialog for that same user"
    expected: "Company access checkboxes reflect the newly saved state (not stale pre-save values)"
    why_human: "Requires observing revalidation flow and subsequent dialog open in a running browser"
---

# Quick Task 62: Fix UserFormDialog State Sync Verification Report

**Task Goal:** Fix UserFormDialog state sync: selectedCompanyId and selectedExtraCompanies never reset when dialog opens because Radix controlled Dialog does not fire onOpenChange(true). Add useEffect to sync these states when `open` transitions to true or `user?.id` changes.
**Verified:** 2026-03-13T08:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Location dropdown shows locations filtered by the user's primary company when editing a user | ? HUMAN NEEDED | useEffect at line 109 sets selectedCompanyId from user.company_id on open; filteredLocations at line 143 filters by selectedCompanyId — mechanically correct, runtime behavior needs human |
| 2 | Company access checkboxes reflect the user's saved extra companies after revalidation | ? HUMAN NEEDED | useEffect sets selectedExtraCompanies from userCompanyAccess prop on open — mechanically correct, revalidation flow needs human observation |
| 3 | Changing the primary company still correctly resets division and location dropdowns | ✓ VERIFIED | Company Select onValueChange handler (lines 269-292) checks division and location membership and calls form.setValue('', '') when they don't belong — this logic was pre-existing and is untouched |

**Score:** 1/3 truths fully verified programmatically; 2/3 need human; 0 failed

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/admin/users/user-form-dialog.tsx` | UserFormDialog with useEffect-based state sync | ✓ VERIFIED | File exists, 405 lines, `useEffect` imported (line 3) and used (line 109) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `user-form-dialog.tsx` | selectedCompanyId state | useEffect on open/user?.id | ✓ WIRED | useEffect at line 109-114 with deps `[open, user?.id, user?.company_id, defaultCompanyId, userCompanyAccess]` sets both `selectedCompanyId` (line 111) and `selectedExtraCompanies` (line 112) when `open` is truthy |

### Key Implementation Details

**useEffect (lines 109-114):**
```typescript
useEffect(() => {
  if (open) {
    setSelectedCompanyId(user?.company_id || defaultCompanyId || '');
    setSelectedExtraCompanies(userCompanyAccess ?? []);
  }
}, [open, user?.id, user?.company_id, defaultCompanyId, userCompanyAccess]);
```

**onOpenChange simplified (line 176):** `onOpenChange={onOpenChange}` — the broken wrapper that only fired on close is removed.

**filteredLocations (line 143):** `locations.filter(l => l.company_id === selectedCompanyId)` — correctly consumes the state that the useEffect now keeps in sync.

**Company access checkboxes (line 387):** `checked={selectedExtraCompanies.includes(company.id)}` — correctly reflects the state that the useEffect syncs from `userCompanyAccess` prop.

### Commit Verification

Commit `fb72efa` exists and is valid:
- Author: samuel
- Date: 2026-03-13
- Message: `fix(quick-62): useEffect-based state sync in UserFormDialog`
- Files changed: `components/admin/users/user-form-dialog.tsx` (1 file, 9 insertions, 8 deletions)

### TypeScript Compilation

Running `tsc --noEmit` produces 1 error in `e2e/tests/phase-06-inventory/asset-crud.spec.ts` — this is pre-existing and unrelated to this task. No errors in `components/admin/users/user-form-dialog.tsx` or any file touched by this task.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No anti-patterns detected. No TODO/FIXME/placeholder comments. No empty implementations. No stub handlers.

### Human Verification Required

**1. Location dropdown company filter on dialog open**

**Test:** Open the Admin > Users settings page. Click Edit on a user belonging to Company A — note which locations appear in the Location dropdown. Close the dialog. Click Edit on a user belonging to Company B. Observe the Location dropdown.
**Expected:** The Location dropdown for Company B's user shows only Company B's locations, not Company A's locations.
**Why human:** Requires a running browser to observe rendered dropdown options across two sequential dialog opens.

**2. Company access checkboxes after revalidation**

**Test:** Open Edit for any user. Toggle some company access checkboxes to a new state. Click Save. Immediately click Edit on the same user again.
**Expected:** The company access checkboxes reflect the state just saved (not the state before the last save).
**Why human:** Requires observing the full save-and-revalidation cycle and the subsequent dialog open in a running browser.

### Gaps Summary

No gaps found. The implementation is mechanically correct:

1. `useEffect` is properly imported and declared with the full dependency array `[open, user?.id, user?.company_id, defaultCompanyId, userCompanyAccess]`.
2. The effect conditionally runs (`if (open)`) to sync both `selectedCompanyId` and `selectedExtraCompanies` from props every time the dialog becomes open.
3. The broken `onOpenChange` wrapper (which only fired on close, not on open) has been removed and replaced with a direct pass-through.
4. `filteredLocations` and the company access checkbox `checked` state both correctly derive from the synced state values.
5. The company change handler (division/location reset) is unchanged and still functional.

The two human verification items are behavioral checks that cannot be verified without a running browser — they are not gaps, they are runtime confirmations of correct logic.

---

_Verified: 2026-03-13T08:10:00Z_
_Verifier: Claude (gsd-verifier)_
