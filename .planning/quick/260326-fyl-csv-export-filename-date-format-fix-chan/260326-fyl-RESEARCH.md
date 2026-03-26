# Quick Task: CSV Export Filename Date Format Fix - Research

**Researched:** 2026-03-26
**Domain:** Date format consistency
**Confidence:** HIGH

## Summary

The `downloadCSV` function in `lib/utils.ts:27` uses `yyyy-MM-dd` format for the filename date, violating the mandatory `dd-MM-yyyy` format rule in CLAUDE.md. This is the **only** date format violation in production code. All server-side export routes (`app/api/exports/*`) already use the correct `dd-MM-yyyy` format.

**Primary recommendation:** Change the format string on `lib/utils.ts:27` from `'yyyy-MM-dd'` to `'dd-MM-yyyy'`. No other files need changes.

## Findings

### The Bug

**File:** `lib/utils.ts`, line 27
**Current:** `a.download = \`\${filenamePrefix}-\${format(new Date(), 'yyyy-MM-dd')}.csv\`;`
**Should be:** `a.download = \`\${filenamePrefix}-\${format(new Date(), 'dd-MM-yyyy')}.csv\`;`

The function uses `date-fns` `format()` (imported on line 3). The fix is a single format string change.

### Callers of `downloadCSV` (5 files)

All use `downloadCSV(csvContent, prefix)` -- none pass dates, so the fix is localized:

| File | Prefix |
|------|--------|
| `components/admin/companies/company-table.tsx` | `'companies'` |
| `components/admin/divisions/division-table.tsx` | `'divisions'` |
| `components/admin/categories/category-table.tsx` | `'categories'` |
| `components/admin/locations/location-table.tsx` | `'locations'` |
| `components/admin/users/user-table.tsx` | `'users-export'` |

### Bug Fix Protocol Scan Results

Per CLAUDE.md, I scanned the entire codebase for the same class of bug (`yyyy-MM-dd` format used where `dd-MM-yyyy` is required).

**All `yyyy-MM-dd` occurrences in production code are legitimate (ISO transport, not display):**

| File | Usage | Verdict |
|------|-------|---------|
| `app/(dashboard)/page.tsx:96,98` | URL query params for dashboard date range | OK -- ISO params |
| `components/requests/request-filters.tsx:95-96` | URL query params | OK -- ISO params |
| `components/jobs/job-filters.tsx:91-92` | URL query params | OK -- ISO params |
| `components/dashboard/date-range-filter.tsx:54-55,86-87` | Comparing/setting URL params | OK -- ISO params |
| `lib/dashboard/queries.ts:30-31` | TypeScript comments | OK -- documentation |
| **`lib/utils.ts:27`** | **Filename visible to user** | **BUG -- must be dd-MM-yyyy** |

**Server-side export routes already correct:**

| File | Format Used | Verdict |
|------|------------|---------|
| `app/api/exports/jobs/route.ts:104` | `dd-MM-yyyy` | OK |
| `app/api/exports/requests/route.ts:104` | `dd-MM-yyyy` | OK |
| `app/api/exports/maintenance/route.ts:103` | `dd-MM-yyyy` | OK |
| `app/api/exports/inventory/route.ts:114` | `dd-MM-yyyy` | OK |

### Conclusion

Only one line needs to change. No other date format violations exist in export-related or user-visible code. The `yyyy-MM-dd` usages in URL params and database queries are correct (ISO format for machine consumption, not display).

## Sources

- Direct codebase inspection (HIGH confidence)
- `lib/utils.ts` -- the affected file
- `app/api/exports/` -- all 4 export routes verified correct
- `improvements.md` -- this bug has been tracked since 15-Mar as a persistent issue
