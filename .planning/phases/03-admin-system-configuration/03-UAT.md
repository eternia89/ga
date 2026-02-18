---
status: complete
phase: 03-admin-system-configuration
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-02-13
updated: 2026-02-13
---

## Current Test

number: 19
name: Profile Modal from User Menu
expected: |
  Click your avatar/name in the bottom of the sidebar to open the user menu. Click "Profile". A Dialog modal opens. Top section shows avatar initials beside your name and email. Below that, a 2-column grid shows Role, Division, and Company as read-only fields (no editable name — profiles are admin-managed). Below a separator line, inline password change fields (Current Password, New Password, Confirm New Password) with a "Change Password" button.
awaiting: user response

## Tests

### 1. Admin Settings Page Navigation
expected: Click "Settings" in the sidebar (Admin section). The Settings page loads at /admin/settings with four tabs: Companies, Divisions, Locations, Categories. Companies tab is active by default.
result: pass

### 2. Non-Admin Access Blocked
expected: If you have a non-admin test user, visiting /admin/settings while logged in as that user redirects to /unauthorized.
result: pass

### 3. Create a Company
expected: On the Companies tab, click "Create Company" button. A modal dialog opens with fields: Name (required), Code, Email, Phone, Address. Fill in at least a Name and submit. The modal closes, the company appears in the table, and a brief green success message appears.
result: pass

### 4. Edit a Company
expected: In the Companies table, click the three-dot menu (actions) on a company row and select "Edit". The edit modal opens with the company's data pre-filled. Change the name, save. The table updates with the new name and a success message appears.
result: pass (fixed inline — form.reset on open)

### 5. Tab Switching Updates URL
expected: Click the "Divisions" tab. The URL updates to include ?tab=divisions. Click "Locations" — URL shows ?tab=locations. Click "Categories" — URL shows ?tab=categories. Each tab shows its respective data table.
result: pass

### 6. Create a Division (Company-Scoped)
expected: On the Divisions tab, click "Create Division". The modal has a Company dropdown (defaulting to your company), Name (required), Code, and Description fields. Create a division. It appears in the table with the company name shown.
result: pass
note: "Company dropdown (and all entity dropdowns) should be searchable combobox instead of plain Select — use shadcn Combobox basic where clicked menu becomes search box. Fix later."

### 7. Create a Location
expected: On the Locations tab, click "Create Location". The modal has Company dropdown (defaults to your company), Name (required), and Address (optional). Create a location. It appears in the table.
result: pass

### 8. Create Categories (Request and Asset types)
expected: On the Categories tab, click "Create Category" — the modal has Name, Type (Request/Asset dropdown), and Description. Create one of each type. Use the Type filter dropdown to see each type. There is NO company dropdown (categories are global).
result: pass

### 9. Category Type Immutable on Edit
expected: Edit an existing category. The Type field (Request/Asset) is disabled/grayed out and cannot be changed. Only Name and Description are editable.
result: pass

### 10. Delete Entity with Dependency Check
expected: Try to delete a company that has divisions assigned to it. Instead of a type-to-confirm input, you see an error message like "Cannot delete -- N divisions assigned" and the delete button is disabled. The entity is NOT deleted.
result: pass

### 11. Delete Entity (No Dependencies)
expected: Delete a company (or other entity) that has no dependencies. A dialog appears asking you to type the entity name exactly to confirm. After typing it correctly, the Delete button enables. Click Delete — the entity disappears from the table (soft-deleted).
result: pass

### 12. Show Deactivated Toggle and Restore
expected: After deleting an entity, enable the "Show deactivated" checkbox in the table toolbar. The soft-deleted entity appears with a "Deactivated" status badge. Click the actions menu on it and select "Restore". The entity becomes active again.
result: pass

### 13. Data Table Sorting and Pagination
expected: In any entity table with multiple rows, click a sortable column header (like Name). The table sorts ascending. Click again for descending. If you have more than 10 rows, pagination controls appear at the bottom with page numbers and a page size selector (10/25/50).
result: pass

### 14. User Management Page
expected: Click "Users" in the sidebar Admin section. The User Management page loads at /admin/users showing a data table with columns: Name (with initials avatar), Email, Role, Division, Status, Company, Last Login, Created. A company filter dropdown appears in the toolbar.
result: pass

### 15. Create a User
expected: Click "Create User" on the Users page. Modal opens with Email, Name, Role dropdown (5 roles), Company dropdown (defaults to yours), Division dropdown (filters by selected company). Fill in details and submit. The user appears in the table with "Active" status and "Never" for Last Login.
result: pass

### 16. Edit a User
expected: Click edit on a user in the table. The edit modal shows Name, Role, Company, Division fields — but Email is read-only (shown but not editable). Change the role and save. The table updates.
result: pass

### 17. Deactivate a User
expected: Click deactivate on a user. A confirmation dialog shows the user's name and email with an optional reason textarea. Click "Deactivate" (red button). The user's status changes to "Deactivated" in the table.
result: pass

### 18. Reactivate a User
expected: With "Show deactivated" enabled on the Users table, find the deactivated user. Click the actions menu and select "Reactivate". A confirmation dialog appears with user details and optional reason field. Click "Reactivate" (green button). The user's status returns to "Active".
result: pass

### 19. Profile Modal from User Menu
expected: Click your avatar/name in the bottom of the sidebar to open the user menu. Click "Profile". A Dialog modal opens. Top section shows avatar initials beside your name and email. Below that, a 2-column grid shows Role, Division, and Company as read-only fields (no editable name — profiles are admin-managed). Below a separator line, inline password change fields (Current Password, New Password, Confirm New Password) with a "Change Password" button.
result: pass (fixed inline — Sheet→Dialog, removed editable name, 2-column layout, role badge, password visibility toggles)

### 20. Password Change — Error
expected: In the Profile modal, enter an incorrect current password with a valid new password and submit. An error message appears. The fields are not cleared.
result: pass

### 21. Password Change — Success
expected: In the Profile modal, enter the correct current password with a valid new password (8+ chars) that matches confirm. A success message appears and the password fields reset.
result: pass

### 22. Sidebar Entity Count Badges
expected: As an admin, the sidebar Settings and/or Users nav items may show small count badges indicating the number of entities.
result: skipped — static entity counts provide no actionable value. Removed count fetching and badge wiring. Badges will be added later for actionable counts (e.g. pending approvals).

## Summary

total: 22
passed: 21
issues: 0
pending: 0
skipped: 1

## Gaps

### Fixed During UAT (not yet committed)
1. **NuqsAdapter missing** — Added `NuqsAdapter` wrapper in dashboard layout for nuqs to work with Next.js App Router
2. **Category sub-tabs removed** — Replaced nested Tabs with `filterableColumns` dropdown on type column
3. **Date format** — Changed all `MMM d, yyyy` to `dd-MM-yyyy` and `MMM d, yyyy h:mm a` to `dd-MM-yyyy, HH:mm:ss`
4. **Checkbox column width** — Added `size: 40` to select columns and applied fixed width styling in DataTable
5. **RLS blocking admin CRUD** — Switched all 4 entity action files to use `adminSupabase` (service_role) instead of user's RLS-bound client
6. **Settings page data fetch** — Switched to `createAdminClient()` for full cross-company visibility
7. **Empty string unique constraint** — Added `emptyToNull()` utility to convert empty optional fields to null before DB insert/update
8. **Company name uniqueness** — Added case-insensitive duplicate name check in create/update company actions
9. **Hydration mismatch** — Passed `searchParams.tab` from server component to client so both render same initial tab
10. **Edit form not prefilled** — react-hook-form `defaultValues` only evaluated once on mount; added `useEffect` to `form.reset()` on dialog open in all 5 entity form dialogs. Also changed Select `defaultValue` → `value` for controlled behavior.

12. **Text field max lengths** — Added `.max(N)` to all Zod schema string fields and `maxLength={N}` to all Input components per new CLAUDE.md validation convention (name:200, code:50, email:255, phone:50, address:500, description:1000)
13. **Friendly duplicate name errors** — Added case-insensitive duplicate name check before DB insert/update in all 4 entity action files (category, division, location). Shows e.g. `A request category named "X" already exists` instead of raw constraint violation.

14. **Restore duplicate check** — All 4 entity restore actions now check for duplicate names among active entities before restoring. Prevents creating duplicates via delete→create→restore flow.
15. **Bulk delete confirmation** — Bulk delete now shows a confirmation dialog listing all items to be deleted, requiring user to type "DELETE" to confirm. Prevents accidental mass deletion.
16. **Profile: Sheet → Dialog with inline password** — Changed ProfileSheet from Sheet drawer to Dialog modal for UI consistency. Merged password change fields inline (separated by Separator) instead of opening a separate PasswordChangeDialog modal. Removed editable name (admin-managed). 2-column layout for read-only fields. Role badge with matching colors. Password visibility toggles. password-change-dialog.tsx is now unused.
17. **Sidebar entity count badges removed** — Static entity counts (divisions+locations+categories, users) provide no actionable value and add 4 unnecessary DB queries to every page load. Removed count fetching from layout and badge wiring from Sidebar. Badges can be re-added later for actionable counts (e.g. pending approvals).

### Deferred Improvements
11. **Searchable dropdowns** — Replace plain Select with shadcn Combobox (basic) for entity dropdowns (Company, Division, etc.) so users can type-to-search when options are numerous. Applies to all form dialogs with entity selectors.
