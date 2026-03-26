---
phase: quick-260326-gck
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/uploads/entity-photos/route.ts
  - app/api/exports/maintenance/route.ts
  - app/actions/company-settings-actions.ts
  - app/(dashboard)/admin/settings/page.tsx
  - app/(dashboard)/inventory/page.tsx
  - app/(dashboard)/requests/page.tsx
  - app/(dashboard)/admin/layout.tsx
  - app/(dashboard)/admin/company-settings/page.tsx
  - app/(dashboard)/admin/audit-trail/page.tsx
  - app/actions/user-company-access-actions.ts
  - lib/safe-action.ts
  - components/jobs/job-modal.tsx
  - components/jobs/job-detail-actions.tsx
  - components/requests/request-detail-actions.tsx
  - components/requests/request-detail-info.tsx
  - app/actions/request-actions.ts
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/jobs/[id]/page.tsx
  - lib/dashboard/queries.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Inventory photo uploads succeed against the correct table (inventory_items, not assets)"
    - "Maintenance export does not reference nonexistent schedule.template_name column"
    - "No string literal role checks remain in application code -- all use ROLES constants"
  artifacts:
    - path: "app/api/uploads/entity-photos/route.ts"
      provides: "Correct table name for inventory entity config"
      contains: "table: 'inventory_items'"
    - path: "app/api/exports/maintenance/route.ts"
      provides: "Clean fallback without dead code"
      contains: "template?.name ?? ''"
    - path: "lib/constants/roles.ts"
      provides: "ROLES constants (source of truth)"
      exports: ["ROLES", "Role", "GA_ROLES", "LEAD_ROLES", "OPERATIONAL_ROLES"]
  key_links:
    - from: "all 14 application files"
      to: "lib/constants/roles.ts"
      via: "import { ROLES } from '@/lib/constants/roles'"
      pattern: "ROLES\\.(ADMIN|GA_STAFF|GA_LEAD|GENERAL_USER|FINANCE_APPROVER)"
---

<objective>
Fix dead code and replace all remaining string literal role checks with ROLES constants.

Purpose: Eliminate a bug (wrong table name breaking inventory photo uploads), remove dead code (nonexistent column reference), and enforce consistent use of the ROLES constants object across the entire codebase to prevent typo bugs and enable future refactoring.

Output: 19 files cleaned up -- 1 bug fix, 1 dead code removal, 18 role literal replacements across 14 files.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260326-gck-dead-code-and-role-literal-cleanup-fix-w/260326-gck-RESEARCH.md

<interfaces>
<!-- ROLES constants from lib/constants/roles.ts -->
```typescript
export const ROLES = {
  GENERAL_USER: 'general_user',
  GA_STAFF: 'ga_staff',
  GA_LEAD: 'ga_lead',
  FINANCE_APPROVER: 'finance_approver',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix wrong table name and remove dead code</name>
  <files>app/api/uploads/entity-photos/route.ts, app/api/exports/maintenance/route.ts</files>
  <action>
Two targeted fixes in API routes:

1. **entity-photos/route.ts line 20:** Change `table: 'assets'` to `table: 'inventory_items'` in the inventory entity config object. The `assets` table does not exist -- the correct table is `inventory_items`. This fixes a bug where inventory photo uploads fail the entity existence check at line 90 (`supabase.from(config.table)`).

2. **maintenance/route.ts line 84:** Change `template?.name ?? schedule.template_name ?? ''` to `template?.name ?? ''`. The `maintenance_schedules` table has no `template_name` column (confirmed in migration 00001_initial_schema.sql). The `schedule.template_name` fallback is dead code that always evaluates to `undefined`. Remove it for clarity.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -n "table: 'assets'" app/api/uploads/entity-photos/route.ts; echo "EXIT:$?" && grep -n "schedule.template_name" app/api/exports/maintenance/route.ts; echo "EXIT:$?" && npx tsc --noEmit --pretty 2>&1 | tail -5</automated>
  </verify>
  <done>entity-photos route uses 'inventory_items' table (grep for 'assets' returns nothing). maintenance export has no schedule.template_name reference (grep returns nothing). TypeScript compilation passes.</done>
</task>

<task type="auto">
  <name>Task 2: Replace all string literal role checks with ROLES constants</name>
  <files>
    app/actions/company-settings-actions.ts,
    app/(dashboard)/admin/settings/page.tsx,
    app/(dashboard)/inventory/page.tsx,
    app/(dashboard)/requests/page.tsx,
    app/(dashboard)/admin/layout.tsx,
    app/(dashboard)/admin/company-settings/page.tsx,
    app/(dashboard)/admin/audit-trail/page.tsx,
    app/actions/user-company-access-actions.ts,
    lib/safe-action.ts,
    components/jobs/job-modal.tsx,
    components/jobs/job-detail-actions.tsx,
    components/requests/request-detail-actions.tsx,
    components/requests/request-detail-info.tsx,
    app/actions/request-actions.ts,
    app/(dashboard)/jobs/page.tsx,
    app/(dashboard)/jobs/[id]/page.tsx,
    lib/dashboard/queries.ts
  </files>
  <action>
Replace ALL remaining string literal role checks with ROLES constants. For each file, add `import { ROLES } from '@/lib/constants/roles'` if not already imported. If the file already imports from `@/lib/constants/roles` (e.g., `GA_ROLES`), add `ROLES` to the existing import -- do NOT create a duplicate import line.

**Exact replacements (18 occurrences across 14 files, grouped by role value):**

ADMIN checks (8 occurrences):
- `app/actions/company-settings-actions.ts:47` -- `profile.role !== 'admin'` -> `profile.role !== ROLES.ADMIN`
- `app/(dashboard)/admin/settings/page.tsx:54` -- `p.role === 'admin'` -> `p.role === ROLES.ADMIN`
- `app/(dashboard)/admin/layout.tsx:28` -- `profile.role !== 'admin'` -> `profile.role !== ROLES.ADMIN`
- `app/(dashboard)/admin/company-settings/page.tsx:29` -- `profile.role !== 'admin'` -> `profile.role !== ROLES.ADMIN`
- `app/(dashboard)/admin/audit-trail/page.tsx:30` -- both `'admin'` and `'ga_lead'` -> `ROLES.ADMIN` and `ROLES.GA_LEAD`
- `app/actions/user-company-access-actions.ts:16` -- `profile.role !== 'admin'` -> `profile.role !== ROLES.ADMIN`
- `lib/safe-action.ts:49` -- `ctx.profile.role !== "admin"` -> `ctx.profile.role !== ROLES.ADMIN`

GENERAL_USER checks (3 occurrences):
- `app/(dashboard)/inventory/page.tsx:46` -- `profile.role === 'general_user'` -> `profile.role === ROLES.GENERAL_USER`
- `app/(dashboard)/requests/page.tsx:46` -- `profile.role === 'general_user'` -> `profile.role === ROLES.GENERAL_USER`
- `app/(dashboard)/requests/page.tsx:166` -- `profile.role === 'general_user'` -> `profile.role === ROLES.GENERAL_USER`

GA_STAFF checks (3 occurrences):
- `components/requests/request-detail-actions.tsx:38` -- `currentUserRole === 'ga_staff'` -> `currentUserRole === ROLES.GA_STAFF`
- `components/requests/request-detail-info.tsx:86` -- `currentUserRole === 'ga_staff'` -> `currentUserRole === ROLES.GA_STAFF`
- `app/actions/request-actions.ts:128` -- `profile.role === 'ga_staff'` -> `profile.role === ROLES.GA_STAFF`

FINANCE_APPROVER checks (2 occurrences):
- `components/jobs/job-modal.tsx:623` -- `currentUserRole === 'finance_approver'` -> `currentUserRole === ROLES.FINANCE_APPROVER`
- `components/jobs/job-detail-actions.tsx:89` -- `currentUserRole === 'finance_approver'` -> `currentUserRole === ROLES.FINANCE_APPROVER`

Mixed/array checks (3 occurrences):
- `app/(dashboard)/jobs/page.tsx:63` -- `['general_user', 'ga_staff'].includes(profile.role)` -> `[ROLES.GENERAL_USER, ROLES.GA_STAFF].includes(profile.role)`
- `app/(dashboard)/jobs/[id]/page.tsx:84` -- `['general_user', 'ga_staff'].includes(profile.role)` -> `[ROLES.GENERAL_USER, ROLES.GA_STAFF].includes(profile.role)`
- `app/(dashboard)/jobs/page.tsx:75` -- `.in('role', ['ga_staff', 'ga_lead'])` -> `.in('role', [ROLES.GA_STAFF, ROLES.GA_LEAD])`
- `lib/dashboard/queries.ts:358` -- `.in('role', ['ga_staff', 'ga_lead'])` -> `.in('role', [ROLES.GA_STAFF, ROLES.GA_LEAD])`

**Important:** After all replacements, run a final grep to confirm ZERO remaining string literal role checks in application code (excluding tests, seeds, e2e, type definitions, Zod enum schemas, and UI display label mappings -- see RESEARCH.md "Intentionally Excluded" section for the full exclusion list).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && echo "=== Remaining string role literals in app code ===" && grep -rn "'admin'\|'ga_staff'\|'ga_lead'\|'general_user'\|'finance_approver'\|\"admin\"\|\"ga_staff\"\|\"ga_lead\"\|\"general_user\"\|\"finance_approver\"" --include="*.ts" --include="*.tsx" app/ lib/ components/ | grep -v node_modules | grep -v "\.test\." | grep -v "__tests__" | grep -v "seed" | grep -v "e2e" | grep -v "lib/constants/roles.ts" | grep -v "lib/auth/types.ts" | grep -v "lib/validations/" | grep -v "user-form-dialog" | grep -v "asset-detail-actions" | grep -v "asset-view-modal" | grep -v "asset-transfer-respond" || echo "CLEAN: No remaining string literal role checks" && echo "=== TypeScript check ===" && npx tsc --noEmit --pretty 2>&1 | tail -5</automated>
  </verify>
  <done>All 18 string literal role checks replaced with ROLES constants. Final grep confirms zero remaining role string literals in application code (expected exclusions only). TypeScript compilation passes with no errors. Every changed file imports ROLES from '@/lib/constants/roles'.</done>
</task>

</tasks>

<verification>
1. `grep -rn "'assets'" app/api/uploads/entity-photos/route.ts` returns nothing (table name fixed)
2. `grep -rn "template_name" app/api/exports/maintenance/route.ts` returns nothing (dead code removed)
3. Comprehensive grep for string literal role values in app/lib/components returns only intentionally excluded files (type defs, Zod schemas, UI labels, asset variant strings)
4. `npx tsc --noEmit` passes -- no type errors from replacements
5. `npm run build` succeeds
</verification>

<success_criteria>
- Bug fixed: inventory photo uploads query correct table `inventory_items`
- Dead code removed: no reference to nonexistent `schedule.template_name` column
- All 18 string literal role checks replaced with ROLES constants across 14 files
- Zero remaining role string literals in application code (excluding intentional exclusions)
- TypeScript and build pass cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260326-gck-dead-code-and-role-literal-cleanup-fix-w/260326-gck-SUMMARY.md`
</output>
