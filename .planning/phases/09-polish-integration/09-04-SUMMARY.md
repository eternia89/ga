---
phase: 09-polish-integration
plan: 04
subsystem: ui
tags: [responsive, mobile, breadcrumbs, hamburger-menu, camera-capture, dialogs, error-pages]

# Dependency graph
requires:
  - phase: 03-admin-system-configuration
    provides: sidebar, data table, form dialogs, shadcn UI foundation
  - phase: 04-requests
    provides: request photo upload component
provides:
  - Mobile hamburger sidebar via MobileMenu component with Sheet overlay
  - Camera capture on mobile for photo uploads (two-input CSS approach)
  - Full-screen dialogs on mobile for all form dialogs
  - Horizontal table scroll on mobile with min-width constraint
  - Breadcrumb navigation on all interior pages
  - Global 404 not-found page
  - Standardized unauthorized page using shadcn Button and lucide icon
affects: all dashboard pages

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MobileMenu client island imported into server layout — avoids making layout client component
    - Two-file-input CSS approach for mobile camera vs desktop file picker (no hydration mismatch)
    - max-md: breakpoints for all mobile overrides (desktop-first per project convention)
    - Full-screen dialogs via max-md:h-screen max-md:max-w-screen max-md:rounded-none applied to DialogContent

key-files:
  created:
    - components/mobile-menu.tsx
    - app/not-found.tsx
  modified:
    - app/(dashboard)/layout.tsx
    - components/sidebar.tsx
    - components/requests/request-photo-upload.tsx
    - components/admin/categories/category-form-dialog.tsx
    - components/admin/companies/company-form-dialog.tsx
    - components/admin/divisions/division-form-dialog.tsx
    - components/admin/locations/location-form-dialog.tsx
    - components/admin/users/user-form-dialog.tsx
    - components/requests/request-triage-dialog.tsx
    - components/profile/profile-sheet.tsx
    - components/data-table/data-table.tsx
    - components/data-table/data-table-pagination.tsx
    - components/data-table/data-table-toolbar.tsx
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/requests/new/page.tsx
    - app/(dashboard)/admin/settings/page.tsx
    - app/(dashboard)/admin/settings/settings-content.tsx
    - app/(dashboard)/admin/users/page.tsx
    - app/(dashboard)/admin/audit-trail/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/notifications/page.tsx
    - app/unauthorized/page.tsx

key-decisions:
  - "MobileMenu as client island imported in server layout — avoids converting layout to 'use client'"
  - "Two file inputs (desktop no-capture + mobile with capture=environment) instead of JS detection — no hydration mismatch"
  - "Full-screen dialogs on mobile use max-md: Tailwind classes on DialogContent — no separate mobile component"
  - "Table horizontal scroll uses overflow-x-auto on wrapper + min-w-[600px] on table — tables stay as tables, not cards"
  - "Not-found page uses FileQuestion icon; Unauthorized page uses ShieldX icon — both consistent with lucide-react + shadcn Button"

patterns-established:
  - "Mobile responsive layout: desktop sidebar hidden with max-md:hidden, mobile header with hamburger shown with max-md:flex"
  - "Breadcrumb placement: before page header with mb-4 (via space-y-6 gap)"
  - "Error pages: icon (48px, text-muted-foreground) + h1 (text-2xl font-semibold) + p (text-muted-foreground) + Button asChild Link"

requirements-completed:
  - REQ-UI-006
  - REQ-UI-007

# Metrics
duration: 9min
completed: 2026-02-25
---

# Phase 9 Plan 4: Mobile Responsiveness, Breadcrumbs, and UI Consistency Summary

**Mobile sidebar hamburger, camera capture for photo uploads, full-screen dialogs, horizontal table scroll, breadcrumbs on all pages, standardized 404 and error pages**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-25T10:07:08Z
- **Completed:** 2026-02-25T10:16:00Z
- **Tasks:** 2 of 2 auto tasks complete (Task 3 is human-verify checkpoint)
- **Files modified:** 23

## Accomplishments
- Created MobileMenu component with Sheet-based sliding sidebar triggered by hamburger icon
- Added dual file inputs to RequestPhotoUpload for native camera capture on mobile and file picker on desktop
- Made all 6 form dialogs full-screen on mobile (categories, companies, divisions, locations, users, triage, profile)
- Added horizontal scroll + min-width constraint to DataTable for mobile usability
- Added breadcrumbs to all interior pages not yet covered (requests, new request, settings, users, audit trail, jobs, inventory, notifications)
- Created global 404 not-found page with FileQuestion icon and Go to Dashboard CTA
- Updated unauthorized page to use ShieldX icon and consistent shadcn Button styling

## Task Commits

1. **Task 1: Mobile sidebar, camera capture, dialogs, table scroll** - `91fc2c2` (feat)
2. **Task 2: Breadcrumbs, error pages, UI consistency** - `a3113d6` (feat)

## Files Created/Modified
- `components/mobile-menu.tsx` - New hamburger menu component using Sheet for mobile sidebar
- `app/(dashboard)/layout.tsx` - Desktop sidebar toggle + mobile header bar with MobileMenu
- `components/sidebar.tsx` - Added optional onNavigate prop for sheet auto-close on link click
- `components/requests/request-photo-upload.tsx` - Dual inputs: desktop (no capture) + mobile (capture=environment)
- `components/admin/*/category|company|division|location-form-dialog.tsx` - Full-screen on mobile
- `components/admin/users/user-form-dialog.tsx` - Full-screen on mobile
- `components/requests/request-triage-dialog.tsx` - Full-screen on mobile
- `components/profile/profile-sheet.tsx` - Full-screen on mobile
- `components/data-table/data-table.tsx` - overflow-x-auto + min-w-[600px] for horizontal scroll
- `components/data-table/data-table-pagination.tsx` - Stacked layout on mobile
- `components/data-table/data-table-toolbar.tsx` - Flex-wrap on mobile
- `app/(dashboard)/requests/page.tsx` - Added breadcrumb (Dashboard > Requests)
- `app/(dashboard)/requests/new/page.tsx` - Added breadcrumb (Dashboard > Requests > New Request)
- `app/(dashboard)/admin/settings/page.tsx` - Added breadcrumb (Dashboard > Settings), h1 size fix
- `app/(dashboard)/admin/settings/settings-content.tsx` - Horizontal tab scroll on mobile
- `app/(dashboard)/admin/users/page.tsx` - Added breadcrumb (Dashboard > Users), h1 size fix
- `app/(dashboard)/admin/audit-trail/page.tsx` - Added breadcrumb (Dashboard > Settings > Audit Trail)
- `app/(dashboard)/jobs/page.tsx` - Added breadcrumb (Dashboard > Jobs)
- `app/(dashboard)/inventory/page.tsx` - Added breadcrumb (Dashboard > Inventory)
- `app/(dashboard)/notifications/page.tsx` - Added breadcrumb (Dashboard > Notifications)
- `app/not-found.tsx` - Global 404 page with FileQuestion icon
- `app/unauthorized/page.tsx` - Standardized with ShieldX icon + shadcn Button

## Decisions Made
- MobileMenu as client island imported in server layout — avoids converting layout to 'use client'
- Two file inputs (desktop no-capture + mobile capture=environment) instead of JS detection — no hydration mismatch
- Full-screen dialogs on mobile use max-md: Tailwind classes on DialogContent — no separate mobile component needed
- Table horizontal scroll uses overflow-x-auto on wrapper + min-w-[600px] on table — tables stay as tables (not cards per prior user decision)
- Not-found page uses FileQuestion icon; Unauthorized page uses ShieldX icon

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — build passed clean after both tasks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Mobile responsiveness complete for all field worker workflows (REQ-UI-007)
- Full-path breadcrumbs on all interior pages (REQ-UI-006)
- Application ready for visual QA in mobile viewport (Task 3 checkpoint awaiting human verification)

## Self-Check: PASSED

All created files verified present. All task commits verified in git history.

---
*Phase: 09-polish-integration*
*Completed: 2026-02-25*
