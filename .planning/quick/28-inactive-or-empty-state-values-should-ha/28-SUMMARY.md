---
phase: quick-28
plan: 1
subsystem: ui
tags: [tables, styling, consistency]
key-files:
  modified:
    - components/admin/companies/company-columns.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/categories/category-columns.tsx
    - components/admin/users/user-columns.tsx
decisions:
  - "job-columns already correct -- no changes needed (PIC 'Unassigned' and linked requests em dash both use text-muted-foreground)"
  - "user-columns accessorFn for company changed from fallback em dash string to empty string to keep accessor consistent with cell render logic"
metrics:
  duration: 2min
  completed: 2026-03-09
  tasks: 2
  files: 5
---

# Quick Task 28: Standardize Empty Cell Styling Summary

Muted em dash rendering for all empty/null table cells across admin settings and user columns, matching the existing pattern in domain tables.

## Task Results

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix admin settings table columns (companies, divisions, locations, categories) | c3767d8 | company-columns.tsx, division-columns.tsx, location-columns.tsx, category-columns.tsx |
| 2 | Fix user-columns and verify job-columns muted styling | a60e93c | user-columns.tsx |

## What Changed

All admin settings column files previously used plain `-` (hyphen) as fallback for empty/null values without any visual distinction. Now all empty cells render `<span className="text-muted-foreground">---</span>` (em dash with muted color), matching the pattern already established in request-columns, asset-columns, schedule-columns, and template-columns.

### Files Modified

- **company-columns.tsx**: Code, Email, Phone columns -- converted `|| "-"` inline fallbacks to muted em dash spans
- **division-columns.tsx**: Code, Company, Description columns -- converted `|| "-"` and plain `"-"` fallbacks
- **location-columns.tsx**: Address, Company columns -- converted plain `"-"` and `|| "-"` fallbacks
- **category-columns.tsx**: Description column -- converted plain `"-"` fallback
- **user-columns.tsx**: Location and Company columns -- added text-muted-foreground class (em dash character was already used but without muted styling)

### Files Verified (No Changes Needed)

- **job-columns.tsx**: PIC "Unassigned" and linked requests em dash already use `text-muted-foreground` correctly

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript: Passes (only pre-existing e2e test error unrelated to changes)
- Lint: No errors in modified files
- Plain hyphen search: Zero matches across all column files

## Self-Check: PASSED
