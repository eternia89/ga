---
phase: quick-70
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00025_schedules_auto_create_days_before.sql
  - lib/types/maintenance.ts
  - lib/validations/schedule-schema.ts
  - app/actions/schedule-actions.ts
  - app/(dashboard)/maintenance/schedules/[id]/page.tsx
  - components/maintenance/schedule-form.tsx
  - components/maintenance/schedule-detail.tsx
  - components/maintenance/schedule-view-modal.tsx
autonomous: true
requirements: [QUICK-70]

must_haves:
  truths:
    - "maintenance_schedules table has auto_create_days_before integer column with default 0"
    - "generate_pm_jobs creates jobs X days before next_due_at when auto_create_days_before > 0"
    - "generate_pm_jobs creates jobs on the due date when auto_create_days_before is 0 or null (backward compatible)"
    - "Schedule create form has an 'Auto-create job (days before due)' number input field"
    - "Schedule edit form allows updating auto_create_days_before"
    - "Schedule view modal and detail page display the auto_create_days_before value"
    - "All read queries (getSchedules, getSchedulesByAssetId, detail page, view modal) include auto_create_days_before in their select"
  artifacts:
    - path: "supabase/migrations/00025_schedules_auto_create_days_before.sql"
      provides: "Column addition and updated generate_pm_jobs function"
      contains: "auto_create_days_before"
    - path: "lib/types/maintenance.ts"
      provides: "MaintenanceSchedule type with auto_create_days_before field"
      contains: "auto_create_days_before"
    - path: "lib/validations/schedule-schema.ts"
      provides: "Zod schema with auto_create_days_before validation (0-30)"
      contains: "auto_create_days_before"
    - path: "components/maintenance/schedule-form.tsx"
      provides: "Number input field in both create and edit forms"
      contains: "auto_create_days_before"
  key_links:
    - from: "supabase/migrations/00025_schedules_auto_create_days_before.sql"
      to: "generate_pm_jobs WHERE clause"
      via: "auto_create_days_before * interval '1 day'"
      pattern: "next_due_at.*auto_create_days_before"
    - from: "components/maintenance/schedule-form.tsx"
      to: "app/actions/schedule-actions.ts"
      via: "createSchedule/updateSchedule actions"
      pattern: "auto_create_days_before"
---

<objective>
Add a per-schedule "auto_create_days_before" field to maintenance schedules that controls how many days before the next due date a PM job should be automatically created.

Purpose: Allow each schedule to have advance job creation (e.g., create the PM job 7 days before it's due) so that PIC has lead time to prepare. When set to 0 (default), behavior is unchanged (create on due date).

Output: Migration, updated types/schemas, form fields in create and edit views, updated generate_pm_jobs function.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@./supabase/migrations/00024_schedules_nullable_item_id.sql
@./lib/types/maintenance.ts
@./lib/validations/schedule-schema.ts
@./app/actions/schedule-actions.ts
@./app/(dashboard)/maintenance/schedules/[id]/page.tsx
@./components/maintenance/schedule-form.tsx
@./components/maintenance/schedule-detail.tsx
@./components/maintenance/schedule-view-modal.tsx

<interfaces>
<!-- Key types and contracts the executor needs. -->

From lib/types/maintenance.ts:
```typescript
export type MaintenanceSchedule = {
  id: string;
  company_id: string;
  item_id: string | null;
  template_id: string;
  assigned_to: string | null;
  interval_days: number;
  interval_type: 'fixed' | 'floating';
  last_completed_at: string | null;
  next_due_at: string | null;
  is_paused: boolean;
  paused_at: string | null;
  paused_reason: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // ... joined relations
};
```

From lib/validations/schedule-schema.ts:
```typescript
export const scheduleCreateSchema = z.object({
  template_id: z.string().uuid(),
  item_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().optional(),
  interval_days: z.number().int().min(1).max(365),
  interval_type: z.enum(['fixed', 'floating']).default('floating'),
  start_date: z.string().optional(),
});

export const scheduleEditSchema = z.object({
  interval_days: z.number().int().min(1).max(365),
  interval_type: z.enum(['fixed', 'floating']),
});
```

From app/actions/schedule-actions.ts:
```typescript
export const createSchedule = gaLeadActionClient.schema(scheduleCreateSchema).action(...)
export const updateSchedule = gaLeadActionClient.schema(z.object({ id, data: scheduleEditSchema })).action(...)
// getSchedules (~line 316) and getSchedulesByAssetId (~line 386) both use explicit column selects
// that must include auto_create_days_before after migration
```

From app/(dashboard)/maintenance/schedules/[id]/page.tsx:
```typescript
// Schedule detail page select query (~line 46) enumerates columns explicitly
// Must include auto_create_days_before after migration
```

Current generate_pm_jobs WHERE clause (migration 00024):
```sql
AND ms.next_due_at <= now()
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migration + Types + Schema + Actions (all read/write queries)</name>
  <files>
    supabase/migrations/00025_schedules_auto_create_days_before.sql
    lib/types/maintenance.ts
    lib/validations/schedule-schema.ts
    app/actions/schedule-actions.ts
  </files>
  <action>
1. **Migration** (`00025_schedules_auto_create_days_before.sql`):
   - `ALTER TABLE public.maintenance_schedules ADD COLUMN auto_create_days_before integer NOT NULL DEFAULT 0;`
   - `CREATE OR REPLACE FUNCTION public.generate_pm_jobs()` — copy the full function from migration 00024, changing ONLY the WHERE condition from:
     ```sql
     AND ms.next_due_at <= now()
     ```
     to:
     ```sql
     AND ms.next_due_at <= now() + (COALESCE(ms.auto_create_days_before, 0) * interval '1 day')
     ```
     Also add `ms.auto_create_days_before` to the SELECT list in the FOR loop (not strictly needed by the INSERT, but good for clarity).
     Everything else in generate_pm_jobs stays identical (LEFT JOIN, COALESCE for asset_name, deduplication check, fixed vs floating advance logic).

2. **Type** (`lib/types/maintenance.ts`):
   - Add `auto_create_days_before: number;` to `MaintenanceSchedule` type, after `interval_type`.

3. **Schema** (`lib/validations/schedule-schema.ts`):
   - Add `auto_create_days_before: z.number().int().min(0, 'Minimum 0').max(30, 'Maximum 30 days').default(0)` to `scheduleCreateSchema`.
   - Add `auto_create_days_before: z.number().int().min(0, 'Minimum 0').max(30, 'Maximum 30 days')` to `scheduleEditSchema`.

4. **Actions — write paths** (`app/actions/schedule-actions.ts`):
   - In `createSchedule`: add `auto_create_days_before: parsedInput.auto_create_days_before ?? 0` to the insert payload.
   - In `updateSchedule`: add `auto_create_days_before: parsedInput.data.auto_create_days_before` to the updatePayload (always include it, not just on interval change).
   - In `updateSchedule`: add `auto_create_days_before` to the existing schedule SELECT fields list.

5. **Actions — read paths** (`app/actions/schedule-actions.ts`):
   - In `getSchedules` (~line 316): add `auto_create_days_before,` to the `.select()` column list (after `interval_type,`).
   - In `getSchedulesByAssetId` (~line 386): add `auto_create_days_before,` to the `.select()` column list (after `interval_type,`).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Migration file exists with ALTER TABLE + updated generate_pm_jobs function. MaintenanceSchedule type includes auto_create_days_before. Both Zod schemas include the field with 0-30 range. All action read queries (getSchedules, getSchedulesByAssetId, updateSchedule) and write queries (createSchedule, updateSchedule) include the field. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: UI — Create Form, Edit Form, Detail Page, View Modal</name>
  <files>
    components/maintenance/schedule-form.tsx
    components/maintenance/schedule-detail.tsx
    components/maintenance/schedule-view-modal.tsx
    app/(dashboard)/maintenance/schedules/[id]/page.tsx
  </files>
  <action>
1. **Schedule detail page** (`app/(dashboard)/maintenance/schedules/[id]/page.tsx`):
   - Add `auto_create_days_before,` to the Supabase `.select()` column list (~line 46, after `interval_type,`).

2. **ScheduleCreateForm** (`schedule-form.tsx`):
   - Add `auto_create_days_before: 0` to defaultValues in useForm.
   - Add a new FormField for `auto_create_days_before` AFTER the `start_date` field, inside the "Schedule Configuration" section:
     ```
     <FormField name="auto_create_days_before" ...>
       <FormItem className="max-w-xs">
         <FormLabel>Auto-create job (days before due)</FormLabel>
         <FormControl>
           <Input type="number" min={0} max={30} placeholder="0" disabled={isPending}
             {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
         </FormControl>
         <p className="text-xs text-muted-foreground">
           Create PM job this many days before due date. 0 = create on due date.
         </p>
         <FormMessage />
       </FormItem>
     </FormField>
     ```

3. **ScheduleEditForm** (`schedule-form.tsx`):
   - Add `auto_create_days_before: schedule.auto_create_days_before` to defaultValues.
   - Add the same FormField for `auto_create_days_before` AFTER `interval_type` field, inside the "Schedule Configuration" section. Same UI as create form.

4. **ScheduleDetail** (`schedule-detail.tsx`):
   - In the read-only view (the `else` branch for non-canManage users), add a grid item showing auto_create_days_before value. Add it after the "Type" grid item:
     ```
     <div>
       <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Auto-create Before Due</p>
       <p className="text-sm">
         {schedule.auto_create_days_before > 0
           ? `${schedule.auto_create_days_before} ${schedule.auto_create_days_before === 1 ? 'day' : 'days'} before`
           : 'On due date'}
       </p>
     </div>
     ```

5. **ScheduleViewModal** (`schedule-view-modal.tsx`):
   - Add `auto_create_days_before` to the Supabase select query string in fetchData.
   - In the header subtitle section (after the interval text), append the auto-create info:
     ```
     {schedule.auto_create_days_before > 0 && (
       <> {' \u00b7 '} Auto-create {schedule.auto_create_days_before}d before due</>
     )}
     ```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>Schedule detail page select query includes auto_create_days_before. Create form shows auto_create_days_before input (0-30, default 0). Edit form shows auto_create_days_before populated from existing schedule value. Detail page read-only view displays the value. View modal header shows auto-create info when > 0. TypeScript compiles and lint passes.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run lint` passes
3. `npm run build` succeeds
4. Migration file 00025 exists with both ALTER TABLE and CREATE OR REPLACE FUNCTION
5. The generate_pm_jobs WHERE clause uses `ms.next_due_at <= now() + (COALESCE(ms.auto_create_days_before, 0) * interval '1 day')`
6. Both create and edit Zod schemas include auto_create_days_before (0-30)
7. Both create and edit forms render the number input
8. All read queries include auto_create_days_before: getSchedules, getSchedulesByAssetId, updateSchedule select, detail page, view modal
9. View modal and detail page display the value
</verification>

<success_criteria>
- New auto_create_days_before column added to maintenance_schedules with default 0
- generate_pm_jobs function creates jobs X days early when auto_create_days_before > 0
- Backward compatible: 0 or null behaves exactly as before (create on due date)
- Full CRUD: field is created, read, and updated through the UI
- All read queries across the app include the new column (no TypeScript errors)
- All existing TypeScript types, schemas, and actions updated consistently
</success_criteria>

<output>
After completion, create `.planning/quick/70-add-auto-create-jobs-days-before-due-fie/70-SUMMARY.md`
</output>
