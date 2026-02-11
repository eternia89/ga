---
phase: 02-auth-rbac
plan: 02
subsystem: auth,rbac,ui
tags: [permissions, rbac, rls, sidebar, navigation, dashboard, app-shell]

# Dependency graph
requires:
  - phase: 02-auth-rbac
    plan: 01
    provides: Supabase Auth integration with session management and middleware
provides:
  - Five-role RBAC system with typed permission map
  - Role-aware RLS policies with division-scoped writes for general_user
  - App shell with sidebar navigation and role-based visibility
  - Permission gate components for conditional UI rendering
  - Admin seed script for bootstrapping first admin + company
  - Dashboard home page with welcome and user info
affects: [all-future-features-requiring-authorization]

# Tech tracking
tech-stack:
  added: [tsx@4.21.0]
  patterns: [permission-map-pattern, role-permission-mapping, rls-role-refinement, nav-item-visibility-pattern, coming-soon-ui-pattern]

key-files:
  created:
    - lib/auth/types.ts
    - lib/auth/permissions.ts
    - lib/auth/hooks.tsx
    - lib/auth/actions.ts
    - components/permission-gate.tsx
    - components/sidebar.tsx
    - components/user-menu.tsx
    - app/(dashboard)/layout.tsx
    - app/(dashboard)/page.tsx
    - app/unauthorized/page.tsx
    - supabase/migrations/00005_role_rls_refinements.sql
    - scripts/seed-admin.ts
  modified:
    - package.json (added seed:admin script, installed tsx)
    - tsconfig.json (jsx setting managed by Next.js)

key-decisions:
  - "Five roles with distinct permission sets: general_user (read-all, write-own-division), ga_staff (inventory ops), ga_lead (full ops), finance_approver (approval-only), admin (all permissions)"
  - "Permission map uses resource:action naming pattern for clarity and consistency"
  - "RLS policies refined: general_user can only INSERT requests for own division, UPDATE own requests; admin-only INSERT/UPDATE on config tables"
  - "Navigation items hidden entirely for unauthorized roles; unbuilt features shown grayed/disabled with 'Coming soon' indicator"
  - "App shell established: fixed sidebar (company at top, nav in middle, user menu at bottom), main content area with AuthProvider context"
  - "Seed script uses service_role key with rollback on errors for safe bootstrapping"

patterns-established:
  - "Permission gate pattern: usePermission hook + PermissionGate component for declarative UI authorization"
  - "Role-based navigation filtering: sidebar filters items by hasPermission() before rendering"
  - "Coming soon UX pattern: unbuilt features visible but non-clickable with clear label (no 404 surprise)"
  - "RLS role refinement pattern: use current_user_role() helper in RLS policies for fine-grained access control"
  - "Bootstrap seed pattern: CLI script with validation, rollback, and clear success/error feedback"

# Metrics
duration: 6min
completed: 2026-02-11
---

# Phase 2 Plan 2: RBAC Implementation Summary

**Role-based access control with typed permission map, role-refined RLS policies, app shell with sidebar navigation, permission-gated UI, and admin seed script**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-11T04:40:01Z
- **Completed:** 2026-02-11T04:46:07Z
- **Tasks:** 2 main tasks (1a, 1b, 2)
- **Files modified:** 12 files created, 2 modified

## Accomplishments

- Five-role RBAC system with comprehensive permission map covering all future phases
- Role-aware RLS policies enforcing division-scoped writes for general_user at database level
- App shell with fixed sidebar, company branding, grouped navigation, and user menu
- Permission-based navigation filtering: unauthorized items hidden, unbuilt items shown as "Coming soon"
- PermissionGate component and usePermission hook for declarative UI authorization
- Dashboard home page with time-based greeting, user info card, and placeholder content
- Unauthorized page with friendly access denied message and dashboard link
- Admin seed script for bootstrapping first admin + company via CLI
- Migration 00005 applied successfully to remote Supabase database

## Task Commits

Each task was committed atomically:

1. **Task 1a: Create permission system and auth hooks** - `fe03c77` (feat)
2. **Task 1b: Create RLS role refinement migration and admin seed script** - `e1927cc` (feat)
3. **Task 2: Create app shell (sidebar, user menu, dashboard), permission gate component, and unauthorized page** - `f804936` (feat)

## Files Created/Modified

**Created:**
- `lib/auth/types.ts` - Role and Permission types, UserProfile type matching DB schema
- `lib/auth/permissions.ts` - PERMISSIONS const, ROLE_PERMISSIONS mapping, hasPermission/canAccessRoute helpers
- `lib/auth/hooks.tsx` - AuthProvider context, useUser/usePermission hooks with session management
- `lib/auth/actions.ts` - signOut and getUserProfile server actions
- `components/permission-gate.tsx` - PermissionGate component for conditional UI rendering
- `components/sidebar.tsx` - Sidebar navigation with role-based filtering and "coming soon" UX
- `components/user-menu.tsx` - User dropdown menu with avatar, role badge, profile/settings/sign out
- `app/(dashboard)/layout.tsx` - Dashboard layout with AuthProvider, sidebar, and server-side profile fetch
- `app/(dashboard)/page.tsx` - Dashboard home with welcome message, user info card, and placeholder
- `app/unauthorized/page.tsx` - Friendly access denied page with dashboard link
- `supabase/migrations/00005_role_rls_refinements.sql` - Role-aware RLS policies for division scoping and admin-only config tables
- `scripts/seed-admin.ts` - Bootstrap CLI script for first admin + company with validation and rollback

**Modified:**
- `package.json` - Added seed:admin script, installed tsx dev dependency
- `tsconfig.json` - jsx setting managed by Next.js (react-jsx)

## Decisions Made

**RBAC Design:**
- **Five distinct roles** with hierarchical permission sets:
  - `general_user`: Read all company data, write own division only (8 permissions)
  - `ga_staff`: general_user + inventory operations (11 permissions)
  - `ga_lead`: ga_staff + triage, job creation, maintenance management (16 permissions)
  - `finance_approver`: Approval-focused role with view-only on operations (8 permissions)
  - `admin`: All permissions (24 permissions across 9 phases)
- **Permission naming pattern**: `resource:action` format (e.g., `request:view:all`, `inventory:manage`) for clarity and consistency across all future phases

**RLS Refinements:**
- **Division-scoped writes for general_user**: Can only INSERT requests for own division, UPDATE own requests (by requester_id)
- **Admin-only config tables**: Companies, divisions, locations, categories restricted to admin role for INSERT/UPDATE at RLS level
- **Self-service profile updates**: Users can UPDATE their own profile; admins can UPDATE any profile in company

**Navigation UX:**
- **Two-tier filtering pattern**:
  1. Role-based hiding: Nav items for features user cannot access are hidden entirely (not rendered)
  2. Coming soon pattern: Nav items for features user CAN access but are unbuilt show as grayed/disabled with "Coming soon" label
- **No 404 surprises**: Users never see nav links to unbuilt pages that would 404. Instead, they see grayed items indicating features are in development.
- **Phase 2 nav state**: Only Dashboard is active/clickable. All other items (Requests, Jobs, Approvals, Assets, Maintenance, Templates) show as "Coming soon" for authorized roles.

**App Shell Layout:**
- **Fixed sidebar** (256px width) with three sections:
  - Top: Company name/branding
  - Middle: Scrollable navigation with grouped sections (Operations, Inventory, Maintenance, Admin)
  - Bottom: User menu with avatar, name, role badge, and dropdown
- **AuthProvider wrapping**: All dashboard routes wrapped with AuthProvider to provide user/profile context to all client components
- **Server-side data fetching**: Dashboard layout fetches profile and company server-side, passes to AuthProvider as initialProfile

**Bootstrap Strategy:**
- **CLI seed script** using service_role key to bypass RLS for initial setup
- **Validation upfront**: Check company name uniqueness, user email uniqueness before creating
- **Atomic rollback**: If any step fails, rollback all changes (delete user, delete company)
- **JWT app_metadata**: Set role, company_id, division_id in user's app_metadata for RLS helper functions to read

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed .ts file extension for JSX content**
- **Found during:** Task 1a (TypeScript verification)
- **Issue:** lib/auth/hooks.ts contained JSX but had .ts extension, causing TypeScript parser errors
- **Fix:** Renamed lib/auth/hooks.ts to lib/auth/hooks.tsx to enable JSX parsing
- **Files modified:** lib/auth/hooks.ts → lib/auth/hooks.tsx
- **Verification:** TypeScript compilation passed after rename
- **Committed in:** fe03c77 (Task 1a commit)

**2. [Rule 1 - Bug] Fixed Next.js Image usage in UserMenu**
- **Found during:** Task 2 (ESLint verification)
- **Issue:** ESLint warning about using `<img>` instead of Next.js `<Image>` for optimized loading
- **Fix:** Replaced `<img>` with `<Image>` from `next/image`, added width/height props
- **Files modified:** components/user-menu.tsx
- **Verification:** ESLint passes with no warnings on project files
- **Committed in:** f804936 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking issue, 1 optimization)
**Impact on plan:** No scope changes. Both fixes were necessary for correct TypeScript parsing and Next.js best practices.

## Issues Encountered

None - all issues were auto-fixed per deviation rules and verification passed

## Verification Results

**Build & Type Checks:**
- ✓ TypeScript compilation passes (npx tsc --noEmit)
- ✓ Next.js build succeeds with no errors
- ✓ ESLint passes on project files (app/, lib/, components/)
- ✓ All 12 required files exist and are tracked in git

**Migration Check:**
- ✓ Migration 00005 applied successfully to remote Supabase (`supabase db push`)
- ✓ RLS policies dropped and recreated with role awareness
- ✓ No SQL syntax errors

**Permission System Check (Code Inspection):**
- ✓ `hasPermission('admin', PERMISSIONS.ADMIN_PANEL)` returns true (admin has all permissions)
- ✓ `hasPermission('general_user', PERMISSIONS.ADMIN_PANEL)` returns false (general_user excluded from admin permissions)
- ✓ `hasPermission('general_user', PERMISSIONS.REQUEST_VIEW_ALL)` returns true (general_user has company-wide read)
- ✓ `canAccessRoute('general_user', '/admin/users')` returns false (route requires ADMIN_PANEL permission)
- ✓ `canAccessRoute('admin', '/admin/users')` returns true (admin has ADMIN_PANEL permission)

**Seed Script Check:**
- ✓ `npx tsx scripts/seed-admin.ts` shows correct usage message when called with --help or no args
- ✓ Script imports successfully (no module errors)

## Next Phase Readiness

**Ready for Phase 3 (Admin UI for User/Company Management):**
- RBAC system fully operational with five roles and comprehensive permission map
- RLS policies enforce role-based access at database level
- App shell established with sidebar, navigation, and user context provider
- Permission gates ready for use in all future UI components
- Admin seed script ready for deployment bootstrapping
- Dashboard layout provides AuthProvider context to all child routes

**No blockers.** Authorization infrastructure is solid for Phase 3 admin UI, Phase 4 request management, and all subsequent features.

## Self-Check

Let me verify the claims made in this summary:

**Files Existence:**
- ✓ lib/auth/types.ts exists
- ✓ lib/auth/permissions.ts exists
- ✓ lib/auth/hooks.tsx exists (Note: .tsx extension, not .ts)
- ✓ lib/auth/actions.ts exists
- ✓ components/permission-gate.tsx exists
- ✓ components/sidebar.tsx exists
- ✓ components/user-menu.tsx exists
- ✓ app/(dashboard)/layout.tsx exists
- ✓ app/(dashboard)/page.tsx exists
- ✓ app/unauthorized/page.tsx exists
- ✓ supabase/migrations/00005_role_rls_refinements.sql exists
- ✓ scripts/seed-admin.ts exists

**Commits Verification:**
- ✓ Commit fe03c77 exists (Task 1a - permission system and auth hooks)
- ✓ Commit e1927cc exists (Task 1b - RLS policies and seed script)
- ✓ Commit f804936 exists (Task 2 - app shell and UI components)

**Build & Quality Checks:**
- ✓ TypeScript compilation passes (npx tsc --noEmit succeeded)
- ✓ Next.js build passes (npm run build succeeded, all routes generated)
- ✓ ESLint passes on project files (npm run lint -- app/ lib/ components/ succeeded)
- ✓ Migration applied successfully (supabase db push confirmed)

**Feature Verification (Code Inspection):**
- ✓ Five roles defined in lib/auth/types.ts matching DB CHECK constraint
- ✓ PERMISSIONS const in lib/auth/permissions.ts has 24 permission keys
- ✓ ROLE_PERMISSIONS maps all five roles to permission arrays
- ✓ hasPermission() helper correctly checks role permissions
- ✓ canAccessRoute() helper maps route prefixes to permissions
- ✓ AuthProvider provides user/profile context via useUser() hook
- ✓ PermissionGate component uses hasPermission() for conditional rendering
- ✓ Sidebar filters nav items by hasPermission() before rendering
- ✓ Sidebar shows "Coming soon" for unbuilt items (built: false)
- ✓ UserMenu has dropdown with Profile, Settings, Sign out
- ✓ Dashboard page shows welcome message with time-based greeting
- ✓ Unauthorized page renders friendly access denied message
- ✓ Migration 00005 contains DROP POLICY + CREATE POLICY statements for role-aware RLS
- ✓ Seed script validates inputs, checks uniqueness, handles rollback

## Self-Check: PASSED

All claims verified. RBAC system is complete, app shell is functional, and authorization is enforced at database (RLS), application (permission map), and UI (permission gates) layers.

---

*Phase: 02-auth-rbac*
*Completed: 2026-02-11*
