---
phase: quick-260318-cbb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/data-table/created-at-cell.tsx
  - components/display-id.tsx
  - components/assets/asset-columns.tsx
  - components/jobs/job-columns.tsx
  - components/requests/request-columns.tsx
  - components/maintenance/schedule-columns.tsx
  - components/maintenance/template-columns.tsx
  - components/maintenance/schedule-detail.tsx
  - components/jobs/job-form.tsx
  - components/dashboard/status-bar-chart.tsx
  - components/notifications/notification-dropdown.tsx
autonomous: true
requirements: [UI-CONSISTENCY-01, UI-CONSISTENCY-02, UI-CONSISTENCY-03, UI-CONSISTENCY-04]

must_haves:
  truths:
    - "All table created_at columns render dates via the shared CreatedAtCell component"
    - "All display_id renders use the shared DisplayId component with font-mono"
    - "No any types remain in job-form.tsx or status-bar-chart.tsx"
    - "All link hover colors use hover:text-blue-800 consistently"
  artifacts:
    - path: "components/data-table/created-at-cell.tsx"
      provides: "Reusable CreatedAtCell component for table date columns"
      exports: ["CreatedAtCell"]
    - path: "components/display-id.tsx"
      provides: "Reusable DisplayId component with font-mono baked in"
      exports: ["DisplayId"]
  key_links:
    - from: "components/assets/asset-columns.tsx"
      to: "components/data-table/created-at-cell.tsx"
      via: "import CreatedAtCell"
      pattern: "import.*CreatedAtCell.*created-at-cell"
    - from: "components/maintenance/schedule-detail.tsx"
      to: "components/display-id.tsx"
      via: "import DisplayId"
      pattern: "import.*DisplayId.*display-id"
---

<objective>
Fix 4 UI consistency issues across the codebase: extract shared CreatedAtCell and DisplayId components, remove `any` types, and standardize link hover colors.

Purpose: Eliminate duplicated date formatting in table columns, ensure display IDs always render with font-mono per CLAUDE.md convention, improve type safety, and unify hover color palette.
Output: Two new shared components + updates to all consumers + type fixes + hover color fix.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create shared CreatedAtCell and DisplayId components, apply everywhere</name>
  <files>
    components/data-table/created-at-cell.tsx,
    components/display-id.tsx,
    components/assets/asset-columns.tsx,
    components/jobs/job-columns.tsx,
    components/requests/request-columns.tsx,
    components/maintenance/schedule-columns.tsx,
    components/maintenance/template-columns.tsx,
    components/maintenance/schedule-detail.tsx
  </files>
  <action>
    **1. Create `components/data-table/created-at-cell.tsx`:**
    - Simple component: `CreatedAtCell({ date }: { date: string })` that renders `<span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>`.
    - Import `format` from `date-fns`.
    - Export as named export.
    - No 'use client' needed (it's a pure render component used inside column definitions which are already client).

    **2. Replace inline date formatting in all 5 table column files:**
    - `components/assets/asset-columns.tsx` line 173: Replace `<span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>` with `<CreatedAtCell date={date} />`. Remove `format` and `date-fns` import if no longer used elsewhere in the file.
    - `components/jobs/job-columns.tsx` line 165: Replace `<span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>` with `<CreatedAtCell date={date} />`. Keep `format`/`date-fns` import if used elsewhere (check the creator name line).
    - `components/requests/request-columns.tsx` line 156: Replace `<span>{format(new Date(date), 'dd-MM-yyyy')}</span>` with `<CreatedAtCell date={date} />`. Keep `format` import if used elsewhere.
    - `components/maintenance/template-columns.tsx` line 74: Replace `<span>{format(new Date(date), 'dd-MM-yyyy')}</span>` with `<CreatedAtCell date={date} />`. Remove `format`/`date-fns` import if no longer used.
    - `components/maintenance/schedule-columns.tsx` line 153: Replace `<span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>` with `<CreatedAtCell date={date} />`. Keep `format`/`date-fns` import since it's also used for `next_due_at` on line 139.

    **3. Create `components/display-id.tsx`:**
    - Simple component: `DisplayId({ children, className }: { children: React.ReactNode; className?: string })` that renders `<span className={cn("font-mono", className)}>{children}</span>`.
    - Import `cn` from `@/lib/utils`.
    - This allows callers to add extra classes (text-xs, text-sm, text-2xl, etc.) while font-mono is always applied.

    **4. Fix display_id renders missing font-mono:**
    - `components/maintenance/schedule-detail.tsx` line 377-378: Change `<span className="text-sm font-medium text-blue-600">` to `<span className="text-sm font-medium text-blue-600 font-mono">` (add font-mono to job.display_id in PM jobs list). Alternatively use `<DisplayId className="text-sm font-medium text-blue-600">`.
    - `components/maintenance/schedule-columns.tsx` line 62: Change `<span className="text-xs text-muted-foreground ml-1">({asset.display_id})</span>` to add `font-mono` class.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>
    - CreatedAtCell component exists and is used in all 5 table column files for created_at cells.
    - DisplayId component exists.
    - All display_id renders include font-mono class.
    - No TypeScript errors, no lint errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove any types and fix link hover colors</name>
  <files>
    components/jobs/job-form.tsx,
    components/dashboard/status-bar-chart.tsx,
    components/notifications/notification-dropdown.tsx
  </files>
  <action>
    **1. Fix `any` type in `components/jobs/job-form.tsx`:**
    - Line 204: `useForm<any>` — The form uses `zodResolver(mode === 'edit' ? updateJobSchema : createJobSchema)`. Since the form handles both create and update, use a union type. Replace `useForm<any>` with `useForm<CreateJobFormData | UpdateJobFormData>`. Import `CreateJobFormData` and `UpdateJobFormData` from `@/lib/validations/job-schema` (already imported schemas, just add the types).
    - Line 252: `const onSubmit = async (data: any)` — Replace `any` with `CreateJobFormData | UpdateJobFormData`.
    - Remove the two `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments on lines 203 and 251.

    **2. Fix `any` type in `components/dashboard/status-bar-chart.tsx`:**
    - Line 32: `const handleBarClick = (barData: any)` — The Recharts bar click handler receives an object matching the data item shape. Since the data items are `StatusBarChartItem`, type it as: `const handleBarClick = (barData: StatusBarChartItem)`.
    - Remove the `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment on line 31.

    **3. Fix link hover color in `components/notifications/notification-dropdown.tsx`:**
    - Line 34: Change `hover:text-blue-700` to `hover:text-blue-800` on the "Mark all as read" button.
    - Line 64: Change `hover:text-blue-700` to `hover:text-blue-800` on the "View all notifications" link.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>
    - No `any` types remain in job-form.tsx or status-bar-chart.tsx (no eslint-disable comments for explicit-any).
    - All hover colors in notification-dropdown.tsx use hover:text-blue-800.
    - No TypeScript errors, no lint errors.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes with zero errors
- `grep -r "eslint-disable.*no-explicit-any" components/jobs/job-form.tsx components/dashboard/status-bar-chart.tsx` returns no matches
- `grep -r "hover:text-blue-700" components/` returns no matches
- `grep -rn "format(new Date.*dd-MM-yyyy" components/*-columns.tsx` returns no matches from created_at cells (only from other date cells like next_due_at)
</verification>

<success_criteria>
- CreatedAtCell shared component created and used in all 5 table column files
- DisplayId shared component created; all display_id renders include font-mono
- Zero `any` types in job-form.tsx and status-bar-chart.tsx
- All link hover colors standardized to hover:text-blue-800
- TypeScript and ESLint pass cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260318-cbb-fix-4-ui-consistency-issues-createdatcel/260318-cbb-SUMMARY.md`
</output>
