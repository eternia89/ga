---
phase: quick-62
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/users/user-form-dialog.tsx
autonomous: true
requirements:
  - QUICK-62

must_haves:
  truths:
    - "Location dropdown shows locations filtered by the user's primary company when editing a user"
    - "Company access checkboxes reflect the user's saved extra companies after revalidation"
    - "Changing the primary company still correctly resets division and location dropdowns"
  artifacts:
    - path: "components/admin/users/user-form-dialog.tsx"
      provides: "UserFormDialog with useEffect-based state sync"
      contains: "useEffect"
  key_links:
    - from: "components/admin/users/user-form-dialog.tsx"
      to: "selectedCompanyId state"
      via: "useEffect on open/user?.id"
      pattern: "useEffect.*open.*user"
---

<objective>
Fix UserFormDialog state sync so selectedCompanyId and selectedExtraCompanies reset correctly when the dialog opens.

Purpose: The current onOpenChange(true) reset in the wrapper (lines 169-174) never fires because Radix Dialog only calls onOpenChange when the user CLOSES the dialog, not when the `open` prop transitions to true externally. This causes: (1) location dropdown always empty (filtering by stale/wrong company), (2) company access checkboxes not reflecting saved state after revalidation.

Output: Updated user-form-dialog.tsx with useEffect-based state sync.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/admin/users/user-form-dialog.tsx
@components/admin/entity-form-dialog.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add useEffect to sync selectedCompanyId and selectedExtraCompanies on dialog open</name>
  <files>components/admin/users/user-form-dialog.tsx</files>
  <action>
1. Add `useEffect` to the import from 'react' (already has useMemo, useState — add useEffect).

2. Add a useEffect after the existing useState declarations (after line 107) that syncs both state values when `open` transitions to true or `user?.id` changes:

```typescript
useEffect(() => {
  if (open) {
    setSelectedCompanyId(user?.company_id || defaultCompanyId || '');
    setSelectedExtraCompanies(userCompanyAccess ?? []);
  }
}, [open, user?.id, user?.company_id, defaultCompanyId, userCompanyAccess]);
```

3. Remove the redundant reset logic from the onOpenChange wrapper (lines 169-175). Simplify it back to just passing `onOpenChange` directly to EntityFormDialog, since the useEffect now handles state sync:

Change:
```
onOpenChange={(nextOpen) => {
  if (nextOpen) {
    setSelectedCompanyId(user?.company_id || defaultCompanyId || '');
    setSelectedExtraCompanies(userCompanyAccess ?? []);
  }
  onOpenChange(nextOpen);
}}
```
To:
```
onOpenChange={onOpenChange}
```

This is correct because:
- The useEffect fires on `open` changing to true (handles opening)
- The onOpenChange only needs to propagate close events to the parent
- The `key={user?.id || 'create'}` still handles the case of switching between different users (full remount)
  </action>
  <verify>
    <automated>cd /Users/samuel/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - useEffect syncs selectedCompanyId from user.company_id when dialog opens
    - useEffect syncs selectedExtraCompanies from userCompanyAccess when dialog opens
    - Redundant onOpenChange wrapper removed
    - TypeScript compiles without errors
    - filteredLocations correctly filters by synced selectedCompanyId
  </done>
</task>

</tasks>

<verification>
- TypeScript compilation passes
- Location dropdown renders locations for the correct company when editing a user
- Company access checkboxes match saved state when reopening the dialog after revalidation
</verification>

<success_criteria>
- selectedCompanyId and selectedExtraCompanies are always in sync with props when dialog opens
- No regression in company change behavior (division/location reset still works)
</success_criteria>

<output>
After completion, create `.planning/quick/62-fix-userformdialog-state-sync-for-locati/62-SUMMARY.md`
</output>
