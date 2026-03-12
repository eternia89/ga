---
phase: quick-60
plan: 01
subsystem: admin-settings
tags: [categories, uniqueness, company-scoped, validation]
key-files:
  modified:
    - app/actions/category-actions.ts
decisions:
  - "company_id scoping added only to duplicate-name guard queries — data-fetch queries remain global per prior decision [03-02]"
metrics:
  duration: 5min
  completed: 2026-03-12
---

# Quick Task 60: Enforce Company-Scoped Category Name Uniqueness — Summary

Company-scoped duplicate name checks added to all three write paths in category-actions.ts (create, update, restore).

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add .eq("company_id", ...) to createCategory, updateCategory, restoreCategory duplicate checks | 991fcb6 |

## Changes Made

**app/actions/category-actions.ts**

- `createCategory`: duplicate check now includes `.eq("company_id", profile.company_id)` — uniqueness enforced within admin's company
- `updateCategory`: first query changed from `select("type")` to `select("type, company_id")`; second query adds `.eq("company_id", current.company_id)`
- `restoreCategory`: first query changed from `select("name, type")` to `select("name, type, company_id")`; conflict check adds `.eq("company_id", category.company_id)`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] app/actions/category-actions.ts modified with all three .eq("company_id", ...) additions
- [x] Build passed with no TypeScript errors
- [x] Commit 991fcb6 exists
