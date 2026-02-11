# Phase 3: Admin & System Configuration - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can manage the organizational hierarchy (companies, divisions, locations, categories) and create/edit/deactivate users. This provides the reference data that all operational workflows depend on. Users can view and edit their own profile (name only). The app shell from Phase 2 is extended with a Settings page and User Management page.

</domain>

<decisions>
## Implementation Decisions

### CRUD Page Patterns
- **List display:** Data tables (sortable, filterable) for all admin entities
- **Form style:** Modal dialogs for create/edit forms (not drawers or dedicated pages)
- **Delete confirmation:** Type-name-to-confirm pattern for all soft-delete actions
- **Bulk actions:** Checkbox multi-select with bulk delete/export on all tables
- **Table filters:** Inline toolbar above the table (search bar + filter dropdowns, always visible)
- **Pagination:** Classic pagination with page numbers (10/25/50 per page), no infinite scroll
- **Sidebar counts:** Show entity count badges next to each entity type in sidebar (e.g. "Divisions (12)")
- **Soft-deleted items:** Hidden by default; admin can toggle a filter to reveal deactivated items for review/restore
- **Action feedback:** Inline feedback (brief row highlight or near-action success message), not toast notifications
- **Empty states:** Minimal text + create button, no illustrations
- **Undo on delete:** No undo toast — admin must use the deactivated filter to find and restore items

### Admin Navigation
- **Settings page:** Single Settings page with tab navigation across entity types (Companies, Divisions, Locations, Categories)
- **User Management:** Separate dedicated page (not a Settings tab) — its own sidebar link

### Entity Relationships
- **Company scoping for divisions/locations:** Admin's company auto-fills as default, but a dropdown allows selecting other companies
- **Divisions tab:** Shows all divisions across all companies in one table with a company column
- **Locations tab:** Same pattern — all locations across companies with a company column
- **Locations structure:** Flat list (no parent-child hierarchy)
- **Categories:** Global/shared across all companies (not company-scoped), with sub-tabs for "Request Categories" and "Asset Categories"
- **Delete blocking:** Cannot delete a division/location that has active dependencies (users, etc.) — show count-only error message (e.g. "Cannot delete — 5 users assigned")

### User Management
- **User creation:** Admin enters email, name, role, company (defaults to admin's company), and division — no invite email sent. User discovers account during onboarding and either logs in via Google OAuth or uses "Forgot password" to set password for the first time
- **User status:** Created users are immediately active (no "pending" state). Last login date shows null until first login
- **User list scope:** Default to admin's company, with a company filter dropdown to view users from other companies
- **User list columns:** Name, email, role, division, status (active/deactivated), company, last login date, created date
- **Role changes:** Admin can change any user's role at any time — takes effect immediately, no confirmation warning
- **Company assignment:** Admin can assign new users to any company via dropdown (defaults to admin's company)
- **Division assignment:** One division per user only
- **Deactivation:** Optional reason text field (not required), user account preserved
- **Reactivation:** Admin can reactivate deactivated users — account and history preserved

### Profile & Self-Service
- **Editable fields:** Name only — no avatar upload
- **Avatar:** Auto-generated initials with a single hardcoded background color (Tailwind CSS variable, same for all users)
- **Read-only info:** Profile shows role, division, company as non-editable fields
- **Profile access:** User menu dropdown at bottom of sidebar — clicking "Profile" opens an inline drawer (no URL change)
- **Password change:** Separate dialog opened from a link within the profile drawer (current password + new password)
- **Logout:** Already implemented in the existing user menu from Phase 2 — no changes needed

### Claude's Discretion
- Exact data table component implementation (shadcn/ui data table patterns)
- Form validation rules and error message styling
- Exact tab component styling within Settings page
- Modal sizing and responsive behavior
- Loading states within modals and tables
- Exact inline feedback animation/styling

</decisions>

<specifics>
## Specific Ideas

- Settings page uses tab navigation (Companies | Divisions | Locations | Categories) — all admin config in one place
- User Management is separate and more prominent as its own sidebar item
- Profile is a lightweight inline drawer (not a full page) — quick access from user menu
- No invite emails — the onboarding flow relies on users knowing their email was registered, then using Google OAuth or forgot-password to get in
- Categories are global (not company-scoped) but split into sub-tabs by type (request vs asset)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-admin-system-configuration*
*Context gathered: 2026-02-11*
