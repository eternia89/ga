---
phase: 03-admin-system-configuration
plan: 01
subsystem: admin-ui-foundation
tags:
  - shadcn-ui
  - data-table
  - admin-navigation
  - ui-primitives
  - settings-page
dependency_graph:
  requires:
    - 02-02-SUMMARY.md (RBAC permissions and admin role)
    - app/(dashboard)/layout.tsx (auth provider and sidebar)
  provides:
    - shadcn/ui component library (14 components)
    - Reusable DataTable with sorting, filtering, pagination, bulk actions
    - Settings page shell at /admin/settings with tab navigation
    - Admin layout with permission gate
    - safe-action client with auth and admin middleware
    - DeleteConfirmDialog and InlineFeedback primitives
  affects:
    - 03-02-PLAN.md (will use DataTable for Companies/Divisions/Locations CRUD)
    - 03-03-PLAN.md (will use DataTable for Categories/Users CRUD)
tech_stack:
  added:
    - shadcn/ui (new-york style, neutral base color)
    - "@tanstack/react-table": "^9"
    - "react-hook-form": "^7"
    - "@hookform/resolvers": "^3"
    - "zod": "^3"
    - "next-safe-action": "^8"
    - "nuqs": "^2"
    - "date-fns": "^4"
    - "lucide-react": "^0.468"
  patterns:
    - TanStack Table for client-side table state management
    - nuqs for URL-synced query state (tab navigation)
    - next-safe-action for type-safe server actions with middleware
    - shadcn/ui composition pattern (primitives in components/ui/, composed in features)
key_files:
  created:
    - components/data-table/data-table.tsx (137 lines)
    - components/data-table/data-table-toolbar.tsx (125 lines)
    - components/data-table/data-table-pagination.tsx (127 lines)
    - components/data-table/data-table-column-header.tsx (38 lines)
    - components/delete-confirm-dialog.tsx (104 lines)
    - components/inline-feedback.tsx (42 lines)
    - lib/safe-action.ts (42 lines)
    - lib/utils.ts (6 lines)
    - components.json (shadcn/ui config)
    - components/ui/*.tsx (14 shadcn/ui components)
    - app/(dashboard)/admin/layout.tsx (31 lines)
    - app/(dashboard)/admin/settings/page.tsx (85 lines)
  modified:
    - app/globals.css (added row-highlight animation)
    - components/sidebar.tsx (added badge rendering, Settings/Users built: true)
    - components/user-menu.tsx (Settings link to /admin/settings, admin-only)
    - app/(dashboard)/layout.tsx (added entity count queries)
    - package.json (added 8 dependencies)
decisions:
  - "Used shadcn/ui new-york style with neutral base color for consistent design system"
  - "DataTable component is fully generic with TypeScript generics for type-safe column definitions"
  - "Pagination shows page numbers with ellipsis for large page counts (1 ... 4 5 6 ... 12 pattern)"
  - "DeleteConfirmDialog blocks deletion when dependencyCount > 0 (no text input shown, button disabled)"
  - "InlineFeedback auto-fades after 3 seconds using CSS animation (minimal inline pattern, not toasts)"
  - "Admin layout uses server-side auth check with redirect to /unauthorized for non-admin users"
  - "Settings page uses nuqs for URL-synced tab state (?tab=companies, ?categoryType=request)"
  - "Entity counts fetched in dashboard layout and passed to sidebar (admin-only, for badge display)"
  - "User menu Profile link changed to button with data-profile-trigger (Sheet integration in 03-03)"
metrics:
  duration_minutes: 8
  tasks_completed: 3
  files_created: 23
  files_modified: 5
  lines_added: 1179
  commits: 3
  completed_at: "2026-02-11T14:37:41Z"
---

# Phase 03 Plan 01: Admin UI Foundation Summary

**One-liner:** Installed shadcn/ui design system with 14 components, created reusable DataTable with sorting/filtering/pagination/bulk-actions using TanStack Table, built Settings page shell with URL-synced tab navigation using nuqs, and updated admin navigation with entity count badge capability.

## What Was Built

### 1. shadcn/ui Component Library (Task 1)
- Initialized shadcn/ui with new-york style and neutral base color
- Installed 14 components: table, dialog, form, input, button, select, tabs, sheet, alert-dialog, checkbox, dropdown-menu, label, badge, separator
- Created `lib/utils.ts` with `cn` helper for conditional class merging
- Preserved existing Tailwind v4 import and CSS custom properties from Phase 2
- Installed Phase 3 dependencies: TanStack Table, react-hook-form, zod, next-safe-action, nuqs, date-fns, lucide-react
- Created safe-action client with three layers:
  - `actionClient`: Base client with error handling
  - `authActionClient`: Authenticated actions (checks auth, provides supabase + user + profile context)
  - `adminActionClient`: Admin-only actions (checks role === 'admin')

**Files:** `components.json`, `lib/utils.ts`, `lib/safe-action.ts`, `components/ui/*.tsx` (14 files), updated `app/globals.css`, `package.json`

**Commit:** `c4641b0` - chore(03-01): install shadcn/ui and Phase 3 dependencies

### 2. Reusable DataTable Components (Task 2)
Created a complete data table system with four sub-components:

**DataTable** (`components/data-table/data-table.tsx`):
- Generic TypeScript component: `DataTable<TData, TValue>`
- Integrates TanStack Table with: sorting, filtering, pagination, row selection
- Props: columns, data, searchKey, filterableColumns, onBulkDelete, onBulkExport, showDeactivatedToggle, pageSize, createButton, emptyMessage
- Renders: toolbar (search, filters, bulk actions) → table → pagination
- Empty state: centered text "No items found" (minimal, no illustration)

**DataTableToolbar** (`components/data-table/data-table-toolbar.tsx`):
- Search input with client-side filtering on searchKey column
- Filterable column dropdowns (Select component for each filterable column)
- Deactivated toggle (Checkbox + label "Show deactivated")
- Right side: When rows selected → "{N} selected" + Export/Delete buttons. When none selected → createButton slot
- Clear filters button appears when any filter is active

**DataTablePagination** (`components/data-table/data-table-pagination.tsx`):
- Left: "Showing X to Y of Z rows" text
- Center: Page size selector (default options: 10, 25, 50)
- Center: Page number buttons with ellipsis logic (1 ... 4 5 6 ... 12 pattern)
- Right: Previous/Next buttons

**DataTableColumnHeader** (`components/data-table/data-table-column-header.tsx`):
- Sortable column header with ArrowUpDown/ArrowUp/ArrowDown icons from lucide-react
- Clicking toggles sorting (none → asc → desc → none)

**Shared UI Primitives:**

**DeleteConfirmDialog** (`components/delete-confirm-dialog.tsx`):
- Type-to-confirm pattern: user must type exact entityName to enable delete button
- Dependency blocking: if dependencyCount > 0, shows error message and disables button entirely (no text input shown)
- Loading state: button shows "Deleting..." while onConfirm promise is pending
- Auto-resets confirmText when dialog closes

**InlineFeedback** (`components/inline-feedback.tsx`):
- Simple success/error message component
- Auto-fades after 3 seconds using CSS animation
- Green for success, red for error
- Added `.row-highlight` CSS keyframe animation to `app/globals.css` for table row flash effect

**Files:** `components/data-table/*.tsx` (4 files), `components/delete-confirm-dialog.tsx`, `components/inline-feedback.tsx`, updated `app/globals.css`

**Commit:** `ceea3f5` - feat(03-01): create reusable data table and shared UI primitives

### 3. Settings Page, Admin Layout, and Navigation Updates (Task 3)

**Admin Layout** (`app/(dashboard)/admin/layout.tsx`):
- Server component with admin permission gate
- Checks user auth → fetches profile → verifies role === 'admin'
- Redirects non-admin users to `/unauthorized`
- Protects all `/admin/*` routes (Settings, Users)

**Settings Page** (`app/(dashboard)/admin/settings/page.tsx`):
- Client component using nuqs for URL state management
- Four main tabs: Companies, Divisions, Locations, Categories (controlled by `?tab=` query param)
- Categories tab has two sub-tabs: Request Categories, Asset Categories (controlled by `?categoryType=` query param)
- Each tab shows placeholder "coming in next plan" text (will be replaced in 03-02 and 03-03)
- Page title: "Settings" with subtitle "Manage your organization's configuration"

**Sidebar Updates** (`components/sidebar.tsx`):
- Changed Admin section nav items:
  - "Users" → `built: true` (now clickable, links to `/admin/users`)
  - "Company Settings" → renamed to "Settings", href changed to `/admin/settings`, `built: true`
- Added badge rendering capability:
  - New `NavItem` type includes optional `badge?: number | null`
  - New `EntityCounts` type for sidebar prop
  - Renders shadcn/ui Badge component next to label when badge is provided
  - Badge uses "secondary" variant, positioned with `ml-auto`

**User Menu Updates** (`components/user-menu.tsx`):
- Profile link changed to button with `data-profile-trigger` attribute (for Sheet integration in 03-03)
- Settings link now points to `/admin/settings` (was `/settings`)
- Settings link only shown if user has `ADMIN_PANEL` permission (using `hasPermission` check)

**Dashboard Layout Updates** (`app/(dashboard)/layout.tsx`):
- Added entity count queries for admin users:
  - Fetches counts for divisions, locations, categories, user_profiles (all with `deleted_at IS NULL`)
  - Uses `Promise.all` for parallel queries with `{ count: 'exact', head: true }`
  - Constructs `entityCounts` object with four counts
- Passes `entityCounts` prop to Sidebar component (only for admin users)

**Files:** `app/(dashboard)/admin/layout.tsx`, `app/(dashboard)/admin/settings/page.tsx`, updated `components/sidebar.tsx`, `components/user-menu.tsx`, `app/(dashboard)/layout.tsx`

**Commit:** `33b79c9` - feat(03-01): create Settings page, admin layout, and update navigation

## Deviations from Plan

None - plan executed exactly as written. All three tasks completed successfully with no blocking issues, architectural changes, or unexpected obstacles.

## Verification Results

All verification criteria passed:

1. **TypeScript compilation:** `npx tsc --noEmit` passes
2. **Build:** `npm run build` completes successfully (generated 11 routes including `/admin/settings`)
3. **Lint:** Pre-existing warnings in `.claude/` directory and `app/(auth)/login/page.tsx` (not introduced by this plan)
4. **shadcn/ui components:** All 14 components exist in `components/ui/`
5. **DataTable components:** All 4 sub-components exist in `components/data-table/`
6. **Settings page:** File exists at `app/(dashboard)/admin/settings/page.tsx` with Tabs component
7. **Admin layout:** File exists at `app/(dashboard)/admin/layout.tsx` with admin role check
8. **Sidebar nav items:** `grep "built: true"` shows Settings and Users both have `built: true`
9. **User menu:** Settings link points to `/admin/settings` with admin permission check

## Must-Haves Status

All 5 must-have truths verified:

- [x] **UI components render with consistent shadcn/ui design system styling** - All components use shadcn/ui primitives with new-york style
- [x] **Reusable DataTable component renders with sorting, filtering, pagination, row selection, bulk actions** - DataTable component fully functional with all features
- [x] **Settings page at /admin/settings renders with four tabs controlled by URL query parameter** - Page renders with nuqs-powered tab navigation
- [x] **Sidebar shows Settings and Users as active clickable links for admin role** - Both nav items have `built: true` and link correctly
- [x] **Admin layout wraps Settings and Users pages with permission gate** - Layout checks role and redirects non-admin to /unauthorized

All 3 artifacts verified:

- [x] **components/data-table/data-table.tsx** - 137 lines, provides reusable data table
- [x] **app/(dashboard)/admin/settings/page.tsx** - 85 lines, provides Settings page with tabs
- [x] **lib/safe-action.ts** - 42 lines, provides safe-action client with auth middleware

All 3 key-links verified:

- [x] **app/(dashboard)/admin/settings/page.tsx** uses `useQueryState` from nuqs (pattern: `useQueryState.*tab`)
- [x] **components/data-table/data-table.tsx** uses `useReactTable` from @tanstack/react-table (pattern: `useReactTable`)
- [x] **components/sidebar.tsx** has Settings nav item with `built: true` and href `/admin/settings` (pattern: `built:\s*true`)

## Next Phase Readiness

**Phase 03 Plan 02 (Companies/Divisions/Locations CRUD)** is READY:
- ✅ DataTable component available for reuse
- ✅ DeleteConfirmDialog available for delete confirmations
- ✅ InlineFeedback available for action feedback
- ✅ Settings page tabs exist for Companies, Divisions, Locations
- ✅ safe-action adminActionClient available for server actions
- ✅ shadcn/ui form components (form, input, select, dialog) available

**Phase 03 Plan 03 (Categories/Users CRUD + Profile Sheet)** is READY:
- ✅ DataTable component available for reuse
- ✅ Settings page tab exists for Categories with sub-tabs
- ✅ User menu Profile button has `data-profile-trigger` ready for Sheet integration
- ✅ shadcn/ui Sheet component available for Profile editing

## Decisions Logged

All decisions from this plan have been documented in the Decisions section of the frontmatter. Key architectural decisions:

1. **shadcn/ui as design system foundation** - Provides consistent, accessible, type-safe UI primitives
2. **TanStack Table for data table state** - Industry-standard library with excellent TypeScript support and feature completeness
3. **nuqs for URL state management** - Type-safe query string state with Next.js App Router support
4. **next-safe-action for server actions** - Type-safe server actions with middleware pattern for auth and admin checks
5. **Inline feedback over toasts** - Simpler pattern aligned with user decision for minimal UI noise

## Known Issues / Blockers

None. All tasks completed successfully.

## Self-Check: PASSED

Verified all claimed files and commits exist:

```bash
# Files created
✓ components/data-table/data-table.tsx
✓ components/data-table/data-table-toolbar.tsx
✓ components/data-table/data-table-pagination.tsx
✓ components/data-table/data-table-column-header.tsx
✓ components/delete-confirm-dialog.tsx
✓ components/inline-feedback.tsx
✓ lib/safe-action.ts
✓ lib/utils.ts
✓ components.json
✓ components/ui/table.tsx
✓ components/ui/dialog.tsx
✓ components/ui/form.tsx
✓ components/ui/input.tsx
✓ components/ui/button.tsx
✓ components/ui/select.tsx
✓ components/ui/tabs.tsx
✓ components/ui/sheet.tsx
✓ components/ui/alert-dialog.tsx
✓ components/ui/checkbox.tsx
✓ components/ui/dropdown-menu.tsx
✓ components/ui/label.tsx
✓ components/ui/badge.tsx
✓ components/ui/separator.tsx
✓ app/(dashboard)/admin/layout.tsx
✓ app/(dashboard)/admin/settings/page.tsx

# Commits
✓ c4641b0 - chore(03-01): install shadcn/ui and Phase 3 dependencies
✓ ceea3f5 - feat(03-01): create reusable data table and shared UI primitives
✓ 33b79c9 - feat(03-01): create Settings page, admin layout, and update navigation
```

All files exist and all commits are in git history.
