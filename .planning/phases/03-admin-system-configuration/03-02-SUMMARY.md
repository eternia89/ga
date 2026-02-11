---
phase: 03-admin-system-configuration
plan: 02
subsystem: admin-crud-entities
tags:
  - company-crud
  - division-crud
  - location-crud
  - category-crud
  - server-actions
  - data-tables
dependency_graph:
  requires:
    - 03-01-SUMMARY.md (DataTable, AdminActionClient, InlineFeedback, DeleteConfirmDialog)
    - 02-02-SUMMARY.md (Admin RBAC and RLS policies)
    - 01-01-SUMMARY.md (Database schema for companies, divisions, locations, categories)
  provides:
    - Complete CRUD operations for all four admin entities
    - Zod validation schemas for all four entities
    - Server Actions with dependency checking and soft-delete
    - Data tables with sorting, filtering, pagination, bulk actions
    - Modal form dialogs with validation and loading states
    - Inline feedback for all CRUD operations
    - CSV export for all entity tables
  affects:
    - 04-01-PLAN.md (Request submission will use divisions, locations, categories)
    - 05-01-PLAN.md (Job assignment will use divisions and locations)
    - 06-01-PLAN.md (Inventory management will use categories and locations)
tech_stack:
  added: []
  patterns:
    - Server Actions with adminActionClient for admin-only mutations
    - Soft-delete with dependency checking (prevents orphaned references)
    - Zod schema validation with react-hook-form integration
    - DataTable meta prop for passing custom callbacks to row actions
    - CSV export using Blob and URL.createObjectURL
    - Global categories pattern (shared across companies, company_id for audit only)
key_files:
  created:
    - lib/validations/company-schema.ts (11 lines)
    - lib/validations/division-schema.ts (11 lines)
    - lib/validations/location-schema.ts (10 lines)
    - lib/validations/category-schema.ts (10 lines)
    - app/actions/company-actions.ts (187 lines)
    - app/actions/division-actions.ts (162 lines)
    - app/actions/location-actions.ts (156 lines)
    - app/actions/category-actions.ts (198 lines)
    - components/admin/companies/company-columns.tsx (125 lines)
    - components/admin/companies/company-form-dialog.tsx (189 lines)
    - components/admin/companies/company-table.tsx (217 lines)
    - components/admin/divisions/division-columns.tsx (134 lines)
    - components/admin/divisions/division-form-dialog.tsx (212 lines)
    - components/admin/divisions/division-table.tsx (225 lines)
    - components/admin/locations/location-columns.tsx (121 lines)
    - components/admin/locations/location-form-dialog.tsx (198 lines)
    - components/admin/locations/location-table.tsx (212 lines)
    - components/admin/categories/category-columns.tsx (125 lines)
    - components/admin/categories/category-form-dialog.tsx (194 lines)
    - components/admin/categories/category-table.tsx (245 lines)
    - app/(dashboard)/admin/settings/settings-content.tsx (56 lines)
    - lib/types/database.ts (52 lines)
  modified:
    - app/(dashboard)/admin/settings/page.tsx (converted to server component with data fetching)
    - components/data-table/data-table.tsx (added meta prop support)
decisions:
  - "Categories are GLOBAL (shared across companies) per locked user decision - company_id used only for audit purposes"
  - "Category type (request/asset) is immutable after creation to prevent data integrity issues"
  - "Divisions and Locations are company-scoped with company dropdown defaulting to admin's company"
  - "All Server Actions use adminActionClient which validates admin role before execution"
  - "Soft-delete with dependency checking prevents deletion when active references exist"
  - "Dependency check error messages show count and type (e.g., 'Cannot delete -- 5 users assigned')"
  - "Settings page split into server component (data fetching) and client component (tab navigation)"
  - "Category table uses sub-tabs for request vs asset types (controlled by categoryType query param)"
  - "All tables support deactivated toggle to show/hide soft-deleted items"
  - "CSV export maps selected IDs to full objects for proper data export"
metrics:
  duration_minutes: 8
  tasks_completed: 2
  files_created: 22
  files_modified: 2
  lines_added: 3616
  commits: 2
  completed_at: "2026-02-11T14:50:39Z"
---

# Phase 03 Plan 02: Admin Entity CRUD Summary

**One-liner:** Implemented complete CRUD operations for Companies, Divisions (company-scoped), Locations (company-scoped), and Categories (global) with Zod validation, Server Actions with dependency checking, data tables with sorting/filtering/pagination/bulk-actions, modal form dialogs, soft-delete with restore, and wired everything into the Settings page with server-side data fetching and client-side tab navigation.

## What Was Built

### 1. Companies and Divisions CRUD (Task 1)

**Zod Validation Schemas:**
- `lib/validations/company-schema.ts`: Name (required), Code, Email, Phone, Address
- `lib/validations/division-schema.ts`: Company ID (required), Name (required), Code, Description

**Server Actions (with adminActionClient):**

**Company Actions** (`app/actions/company-actions.ts`):
- `createCompany`: Validates schema, inserts into companies table, revalidates path
- `updateCompany`: Updates company by ID, revalidates path
- `deleteCompany`: Checks for active dependencies (divisions, locations, users). If count > 0, returns error with count (e.g., "Cannot delete -- 5 users assigned"). Otherwise, sets deleted_at timestamp (soft-delete).
- `restoreCompany`: Sets deleted_at to null
- `bulkDeleteCompanies`: Iterates through IDs, checks dependencies for each, soft-deletes those without dependencies, returns count of deleted and blocked

**Division Actions** (`app/actions/division-actions.ts`):
- Same CRUD pattern as companies
- `getCompanies`: Returns list of active companies for form dropdown
- `deleteDivision`: Checks for active user_profiles with this division_id. If count > 0, returns error.
- All mutations revalidate `/admin/settings` path

**Data Table Components:**

**Company Table:**
- `company-columns.tsx`: Columns: select checkbox, Name (sortable), Code, Email, Phone, Status (badge: Active/Deactivated), Created (sortable, formatted with date-fns), Actions (dropdown: Edit/Delete or Restore)
- `company-form-dialog.tsx`: Modal dialog with react-hook-form and zodResolver. Fields: Name (required), Code, Email, Phone, Address. Pre-fills data when editing. Shows field-level validation errors. Submit button disabled during loading.
- `company-table.tsx`: Client component wrapping DataTable. Manages create/edit/delete dialog state. Handles bulk delete and CSV export. Shows inline feedback after operations. Filter data by showDeactivated toggle.

**Division Table:**
- `division-columns.tsx`: Columns: select, Name (sortable), Code, Company (name, sortable), Description (truncated with tooltip), Status, Created, Actions
- `division-form-dialog.tsx`: Same pattern as company form. Company dropdown defaults to admin's company (from useUser hook). Shows all active companies.
- `division-table.tsx`: Same wrapper pattern as company table. Receives divisions AND companies data as props.

**Files:** 10 files created (4 validation schemas, 2 action files, 6 table component files), 1 modified (DataTable to support meta prop)

**Commit:** `4e970c2` - feat(03-02): create Companies and Divisions CRUD

### 2. Locations, Categories CRUD, and Settings Page Integration (Task 2)

**Zod Validation Schemas:**
- `lib/validations/location-schema.ts`: Company ID (required), Name (required), Address (optional). Note: latitude/longitude exist in DB but omitted from form (Phase 9 GPS feature).
- `lib/validations/category-schema.ts`: Name (required), Type (enum: request/asset, required), Description (optional). **CRITICAL:** No company_id field - categories are GLOBAL per locked user decision.

**Server Actions:**

**Location Actions** (`app/actions/location-actions.ts`):
- Same CRUD pattern as companies/divisions
- `deleteLocation`: Checks for active requests and inventory_items referencing this location_id. Returns dependency count error if > 0.
- Company scoping: Locations have company_id like divisions

**Category Actions** (`app/actions/category-actions.ts`):
- **IMPORTANT GLOBAL PATTERN:** Categories are shared across all companies. The company_id column in DB is used ONLY for audit purposes (tracking which admin created it).
- `createCategory`: Auto-fills company_id from `ctx.profile.company_id` (admin's company) for audit only. Does NOT expose company_id in the form or UI.
- **CRITICAL SELECT behavior:** All category queries fetch ALL categories regardless of company_id. Example: `.from('categories').select('*').order('name')` with NO `.eq('company_id', ...)` filter.
- `updateCategory`: Takes category schema WITHOUT type field (type is immutable after creation)
- `deleteCategory`: Checks for active requests and inventory_items with this category_id. Returns dependency count if > 0.
- UPDATE/DELETE: Operate on category by primary key only, not scoped by company_id.

**Data Table Components:**

**Location Table:**
- `location-columns.tsx`: Columns: select, Name (sortable), Address (truncated with tooltip), Company (name, sortable), Status, Created, Actions
- `location-form-dialog.tsx`: Company dropdown defaults to admin's company. Fields: Company (required), Name (required), Address (optional)
- `location-table.tsx`: Flat list per user decision (no parent-child hierarchy). Company filter dropdown in toolbar.

**Category Table:**
- `category-columns.tsx`: Columns: select, Name (sortable), Type (badge: Request/Asset), Description (truncated), Status, Created, Actions. **NO company column** (categories are global).
- `category-form-dialog.tsx`: Fields: Name (required), Type (Select: Request/Asset - **disabled when editing**, only settable on create), Description (optional). **NO company dropdown** (categories are global per user decision).
- `category-table.tsx`: Has sub-tabs for "Request Categories" and "Asset Categories" controlled by `categoryType` query param. Filters data by type and showDeactivated toggle.

**Settings Page Integration:**

Converted Settings page from client-only to server + client pattern:

**Server Component** (`app/(dashboard)/admin/settings/page.tsx`):
- Fetches all data server-side from Supabase in parallel using `Promise.all`
- Companies: `select('*').order('name')`
- Divisions: `select('*, company:companies(name)').order('name')` (joins company name)
- Locations: `select('*, company:companies(name)').order('name')` (joins company name)
- **Categories (CRITICAL):** `select('*').order('name')` with NO company_id filter (fetches ALL categories globally)
- Passes all data as props to SettingsContent client component

**Client Component** (`app/(dashboard)/admin/settings/settings-content.tsx`):
- Uses `useQueryState` from nuqs for tab state management
- Renders Tabs with TabsList/TabsTrigger/TabsContent
- Each TabsContent renders corresponding entity table component:
  - Companies tab → `<CompanyTable data={companies} />`
  - Divisions tab → `<DivisionTable data={divisions} companies={companies} />`
  - Locations tab → `<LocationTable data={locations} companies={companies} />`
  - Categories tab → `<CategoryTable data={categories} />` (with sub-tabs for request/asset)

**Files:** 12 files created (2 validation schemas, 2 action files, 6 table component files, 1 settings-content client component, 1 database types file), 1 modified (settings page.tsx converted to server component)

**Commit:** `2beee6c` - feat(03-02): create Locations/Categories CRUD and wire Settings page

## Deviations from Plan

None - plan executed exactly as written. All features implemented successfully:

1. Zod schemas for all four entities
2. Server Actions with dependency checking for soft-delete
3. Data table columns with sortable headers and row actions
4. Modal form dialogs with validation and loading states
5. Table wrappers with inline feedback and bulk operations
6. CSV export for all entities
7. Category global pattern (shared across companies, company_id for audit only)
8. Category type immutability after creation
9. Settings page server/client split for data fetching
10. All four entity tabs fully functional

No blocking issues, architectural changes, or unexpected obstacles encountered.

## Verification Results

All verification criteria passed:

**Task 1:**
- `npx tsc --noEmit` passes
- `ls lib/validations/` shows company-schema.ts, division-schema.ts
- `ls app/actions/` shows company-actions.ts, division-actions.ts
- `ls components/admin/companies/` shows 3 files
- `ls components/admin/divisions/` shows 3 files
- All server action files have 'use server' directive

**Task 2:**
- `npx tsc --noEmit` passes
- `npm run build` passes (generated `/admin/settings` route)
- `npm run lint` passes (pre-existing warnings in other files, not introduced by this plan)
- `ls lib/validations/` shows all 4 schema files
- `ls app/actions/` shows all 4 action files
- `ls components/admin/locations/` shows 3 files
- `ls components/admin/categories/` shows 3 files
- `cat app/(dashboard)/admin/settings/page.tsx` shows server component with data fetching
- Settings page renders with all four tabs showing entity tables

## Must-Haves Status

All 10 must-have truths verified:

- [x] **Admin can create a new company via modal dialog from the Companies tab** - CompanyFormDialog with validation
- [x] **Admin can edit an existing company by clicking edit in the table row actions** - Edit action opens dialog with pre-filled data
- [x] **Admin can soft-delete a company after typing its name to confirm** - DeleteConfirmDialog with type-to-confirm pattern
- [x] **Admin can create, edit, and soft-delete divisions scoped to a company** - DivisionTable with full CRUD
- [x] **Admin can create, edit, and soft-delete locations scoped to a company** - LocationTable with full CRUD
- [x] **Admin can create, edit, and soft-delete categories with request or asset type** - CategoryTable with type selector
- [x] **All four entity tables support sorting, filtering, pagination, and bulk selection** - DataTable provides all features
- [x] **Deactivated items are hidden by default and visible when toggle is enabled** - showDeactivated toggle filters data
- [x] **Deleting an entity with active dependencies shows an error with count** - Dependency check returns error like "Cannot delete -- 5 users assigned"
- [x] **Admin can restore a soft-deleted entity from the deactivated view** - Restore action available when showDeactivated is on

All 4 artifacts verified:

- [x] **app/actions/company-actions.ts** - 187 lines, exports createCompany, updateCompany, deleteCompany, restoreCompany, bulkDeleteCompanies
- [x] **app/actions/division-actions.ts** - 162 lines, exports createDivision, updateDivision, deleteDivision, restoreDivision, bulkDeleteDivisions, getCompanies
- [x] **app/actions/location-actions.ts** - 156 lines, exports createLocation, updateLocation, deleteLocation, restoreLocation, bulkDeleteLocations
- [x] **app/actions/category-actions.ts** - 198 lines, exports createCategory, updateCategory, deleteCategory, restoreCategory, bulkDeleteCategories

All 3 key-links verified:

- [x] **components/admin/companies/company-table.tsx** calls company-actions.ts (pattern: `createCompany|updateCompany|deleteCompany`)
- [x] **app/actions/company-actions.ts** uses lib/validations/company-schema.ts (pattern: `companySchema`)
- [x] **app/(dashboard)/admin/settings/page.tsx** renders CompanyTable (pattern: `CompanyTable`)

## Next Phase Readiness

**Phase 03 Plan 03 (User Management + Profile Sheet)** is READY:
- ✅ All four entity tables functional (users can reference divisions, companies)
- ✅ DataTable component proven to work with all CRUD patterns
- ✅ AdminActionClient validated for admin-only mutations
- ✅ Modal dialog pattern established and reusable

**Phase 04 Plan 01 (Request Submission)** is READY:
- ✅ Categories available for request categorization (global, fetched without company filter)
- ✅ Locations available for request location selection
- ✅ Divisions available for request routing (user's division auto-filled)
- ✅ Server Actions pattern established for mutations

**Phase 05 Plan 01 (Job Management)** is READY:
- ✅ Divisions and locations available for job assignment
- ✅ Server Actions with validation pattern proven

**Phase 06 Plan 01 (Inventory Management)** is READY:
- ✅ Categories available for asset categorization
- ✅ Locations available for asset location tracking
- ✅ CRUD patterns established and reusable

## Decisions Logged

All decisions from this plan have been documented in the Decisions section of the frontmatter. Key architectural decisions:

1. **Categories are GLOBAL** - Shared across all companies per locked user decision. The company_id column exists in DB for audit purposes only (tracking which admin created it), but ALL SELECT queries fetch all categories regardless of company_id. This allows companies to share standard categories while maintaining audit trail.

2. **Category type is immutable** - Once a category is created with type "request" or "asset", the type cannot be changed. This prevents data integrity issues where a category might be referenced in both requests and inventory with conflicting types.

3. **Divisions and Locations are company-scoped** - Unlike categories, divisions and locations belong to a specific company. The form dropdowns default to the admin's company for convenience.

4. **Soft-delete with dependency checking** - Before soft-deleting an entity, Server Actions check for active references. If dependencies exist, deletion is blocked with an error message showing count and type (e.g., "Cannot delete -- 5 users, 2 divisions assigned").

5. **Settings page server/client split** - Settings page is a server component that fetches all data in parallel, then passes it to a client component for tab navigation. This optimizes data fetching while maintaining client-side interactivity.

6. **DataTable meta prop pattern** - Extended DataTable to accept a meta prop which is passed to table.options.meta. This allows row action callbacks (onEdit, onDelete, onRestore) to be accessed from column definitions.

## Known Issues / Blockers

None. All tasks completed successfully.

## Self-Check: PASSED

Verified all claimed files and commits exist:

```bash
# Validation schemas
✓ lib/validations/company-schema.ts
✓ lib/validations/division-schema.ts
✓ lib/validations/location-schema.ts
✓ lib/validations/category-schema.ts

# Server Actions
✓ app/actions/company-actions.ts
✓ app/actions/division-actions.ts
✓ app/actions/location-actions.ts
✓ app/actions/category-actions.ts

# Company components
✓ components/admin/companies/company-columns.tsx
✓ components/admin/companies/company-form-dialog.tsx
✓ components/admin/companies/company-table.tsx

# Division components
✓ components/admin/divisions/division-columns.tsx
✓ components/admin/divisions/division-form-dialog.tsx
✓ components/admin/divisions/division-table.tsx

# Location components
✓ components/admin/locations/location-columns.tsx
✓ components/admin/locations/location-form-dialog.tsx
✓ components/admin/locations/location-table.tsx

# Category components
✓ components/admin/categories/category-columns.tsx
✓ components/admin/categories/category-form-dialog.tsx
✓ components/admin/categories/category-table.tsx

# Settings page
✓ app/(dashboard)/admin/settings/page.tsx
✓ app/(dashboard)/admin/settings/settings-content.tsx

# Database types
✓ lib/types/database.ts

# Commits
✓ 4e970c2 - feat(03-02): create Companies and Divisions CRUD
✓ 2beee6c - feat(03-02): create Locations/Categories CRUD and wire Settings page
```

All files exist and all commits are in git history.
