---
phase: quick-76
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/validations/schedule-schema.ts
  - components/maintenance/schedule-form.tsx
autonomous: true
requirements:
  - VALIDATION-CONVENTION

must_haves:
  truths:
    - "start_date string field in scheduleCreateSchema has .max(10) constraint"
    - "start_date Input in schedule-form.tsx has maxLength={10} attribute"
  artifacts:
    - path: "lib/validations/schedule-schema.ts"
      provides: "Bounded start_date string validation"
      contains: ".max(10)"
    - path: "components/maintenance/schedule-form.tsx"
      provides: "maxLength on start_date Input"
      contains: "maxLength={10}"
  key_links:
    - from: "components/maintenance/schedule-form.tsx"
      to: "lib/validations/schedule-schema.ts"
      via: "zodResolver(scheduleCreateSchema)"
      pattern: "scheduleCreateSchema"
---

<objective>
Add `.max(10)` to the unbounded `start_date` string field in `scheduleCreateSchema` and add `maxLength={10}` to the corresponding `<Input>` in the schedule create form.

Purpose: Enforce CLAUDE.md validation convention that every `z.string()` must have `.max(N)` with a realistic limit. The start_date is an ISO date string (`yyyy-MM-dd`, exactly 10 characters).
Output: Both schema and form input bounded to 10 characters.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/validations/schedule-schema.ts
@components/maintenance/schedule-form.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add .max(10) to start_date in schema and maxLength={10} to Input</name>
  <files>lib/validations/schedule-schema.ts, components/maintenance/schedule-form.tsx</files>
  <action>
    1. In `lib/validations/schedule-schema.ts` line 15, change:
       `start_date: z.string().optional(),`
       to:
       `start_date: z.string().max(10).optional(),`

    2. In `components/maintenance/schedule-form.tsx`, find the start_date FormField's `<Input>` element (around line 389). Add `maxLength={10}` to the Input props. The Input currently has `type="date"`, `disabled={isPending}`, `{...field}`, `value={field.value ?? ''}`, and `onChange`. Add `maxLength={10}` before the spread `{...field}` so it reads:
       ```
       <Input
         type="date"
         maxLength={10}
         disabled={isPending}
         {...field}
         value={field.value ?? ''}
         onChange={(e) => field.onChange(e.target.value || undefined)}
       />
       ```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -n 'max(10)' lib/validations/schedule-schema.ts && grep -n 'maxLength={10}' components/maintenance/schedule-form.tsx && npx tsc --noEmit --pretty 2>&1 | tail -5</automated>
  </verify>
  <done>
    - scheduleCreateSchema.start_date has `.max(10)` constraint
    - start_date Input in ScheduleCreateForm has `maxLength={10}`
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- `grep 'max(10)' lib/validations/schedule-schema.ts` shows the bounded start_date field
- `grep 'maxLength={10}' components/maintenance/schedule-form.tsx` shows the Input constraint
- `npx tsc --noEmit` passes with no errors
</verification>

<success_criteria>
- start_date in scheduleCreateSchema is `z.string().max(10).optional()` (not unbounded)
- start_date Input has `maxLength={10}` HTML attribute
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/76-add-max-10-to-unbounded-start-date-strin/76-SUMMARY.md`
</output>
