# Quick Task 24: Add location field to user profiles indicating office location - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Add a location_id field to user_profiles so each user has an assigned office/location. This involves DB migration, TypeScript types, Zod schemas, user create/edit form, user table columns, and profile sheet display.

</domain>

<decisions>
## Implementation Decisions

### Location field behavior
- **Required** on user create form (admin must assign a location)
- **Required** on user edit form
- **Admin-only** — users can see their location but cannot change it themselves
- Auto-filtered to the selected company's locations (same pattern as division dropdown)

### Where location appears
- **User table** in admin settings — new "Location" column
- **Profile sheet** — show location name alongside Division and Company
- **User create/edit form dialog** — location Combobox dropdown, filtered by selected company
- **NOT in sidebar** user menu (too crowded)

### DB migration approach
- New migration file: add `location_id` (uuid, nullable FK to locations) to `user_profiles`
- Nullable at DB level so existing users don't break
- Index on `location_id WHERE deleted_at IS NULL`
- Zod create schema: `location_id` required (`z.string().uuid()`)
- Zod update schema: `location_id` required but can be optional for backward compat

</decisions>

<specifics>
## Specific Ideas

- Follow the same pattern as division_id: filtered by company, Combobox dropdown
- Location options should re-fetch when company changes in the user form (same as divisions do)
- User table column order: Name, Role, Division, Location, Status, Company, Last Login, Created

</specifics>
