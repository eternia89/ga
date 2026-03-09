---
phase: quick-24
plan: 01
subsystem: database, ui
tags: [supabase, user-profiles, location, admin-settings]

requires:
  - phase: 03-admin-system-configuration
    provides: locations table, user management UI
provides:
  - location_id FK column on user_profiles table
  - Location field in user create/edit form
  - Location column in user table
  - Location display in profile sheet
affects: [user-management, admin-settings]

tech-stack:
  added: []
  patterns: [company-filtered-location-select]

key-files:
  created:
    - supabase/migrations/00017_user_profiles_location_id.sql
  modified:
    - lib/auth/types.ts
    - lib/validations/user-schema.ts
    - components/admin/users/user-columns.tsx
    - components/admin/users/user-form-dialog.tsx
    - components/admin/users/user-table.tsx
    - app/(dashboard)/admin/settings/page.tsx
    - app/(dashboard)/admin/settings/settings-content.tsx
    - app/actions/user-actions.ts
    - app/(dashboard)/layout.tsx
    - components/profile/profile-sheet.tsx

key-decisions:
  - "Location select uses plain Select dropdown (same pattern as division) for consistency"
  - "Location nullable at DB level for backward compat with existing users"
  - "Location required on create, optional on edit (None option in edit mode)"

requirements-completed: [QUICK-24]

duration: 2min
completed: 2026-03-09
---

# Quick Task 24: Add Location Field to User Profiles Summary

**location_id FK on user_profiles with company-filtered Select in create/edit form, table column, and profile sheet display**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T06:32:51Z
- **Completed:** 2026-03-09T06:35:25Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- DB migration adding location_id FK column to user_profiles with partial index
- Location Select dropdown in user create/edit form, filtered by selected company, resets on company change
- Location column in user table between Division and Status
- Location name in profile sheet, CSV export, and all user profile queries

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration + types + schemas** - `4e08c6b` (feat)
2. **Task 2: User table column, form dialog, actions, profile sheet** - `ac80bee` (feat)

## Files Created/Modified
- `supabase/migrations/00017_user_profiles_location_id.sql` - Migration adding location_id column with FK and partial index
- `lib/auth/types.ts` - Added location_id to UserProfile type
- `lib/validations/user-schema.ts` - Added location_id to create/update Zod schemas
- `components/admin/users/user-columns.tsx` - Added location_id and location join to UserRow, Location column after Division
- `components/admin/users/user-form-dialog.tsx` - Added Location type, locations prop, filtered locations, location form field, company change reset
- `components/admin/users/user-table.tsx` - Added Location type, locations prop, Location in CSV export
- `app/(dashboard)/admin/settings/page.tsx` - Updated user_profiles select to join location
- `app/(dashboard)/admin/settings/settings-content.tsx` - Pass locations to UserTable
- `app/actions/user-actions.ts` - Added location_id to create/update inserts, updated getUsers select
- `app/(dashboard)/layout.tsx` - Updated profile select to join location
- `components/profile/profile-sheet.tsx` - Display locationName in profile grid

## Decisions Made
- Location select uses plain Select dropdown (same pattern as division) for consistency
- Location nullable at DB level so existing users without location are not broken
- Location required on create form, optional on edit form (None option) for backward compat

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- Push migration 00017 to Supabase: `supabase db push`

## Next Phase Readiness
- Location field fully integrated into user management workflow
- Existing users will show "Not assigned" / em-dash until location is set

## Self-Check: PASSED

All 11 files verified present. Both task commits (4e08c6b, ac80bee) verified in git log.

---
*Quick Task: 24*
*Completed: 2026-03-09*
