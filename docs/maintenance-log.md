# Maintenance Log

## 29-Mar-2026 Nightly Janitor

Added `.claude/` to ESLint's ignore list (was linting GSD tooling files as app code), removed 3 unused imports, configured the `_`-prefix convention for intentionally unused destructure variables, and caught 6 more raw `format()` calls that missed yesterday's sweep — in job-filters, request-filters, and the dashboard date-range-filter. Found an open redirect vulnerability in the auth callback route (flagged, not auto-fixed). Also flagged dead code in schedule/template list components, React render-time component definitions in the dashboard, and the `finance_approver` role having no explicit RLS policies. No dependency patches this run (all updates are minor, not patch-level). Build and lint are green (warnings only).

**Fixed:** 10 items across 3 commits
**Flagged for review:** 6 new items in needs-review.md
**Tests:** not run (no test changes)
**Build:** clean

## 28-Mar-2026 Nightly Janitor

Replaced 30+ raw `format()` calls from date-fns with the centralized `formatDate()`/`formatDateTime()` utilities across 23 files — components, detail pages, and export routes. Also removed one unused `format` import from user-columns.tsx, and patched 5 dependencies (@types/node, @types/react, eslint, nuqs, shadcn). Flagged 5 items for review: two DRY opportunities (signed URL generation pattern duplicated 19 times, media attachment queries repeated across 5 files), missing test coverage for 24 action/validation files, a minor React lint warning in use-geolocation, and 2 stale merged branches. Build and lint are green.

**Fixed:** 31 items across 2 commits
**Flagged for review:** 5 new items in needs-review.md
**Tests:** not run (no test changes)
**Build:** clean
