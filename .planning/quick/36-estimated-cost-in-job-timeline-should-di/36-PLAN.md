---
phase: quick-36
plan: 36
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-timeline.tsx
autonomous: true
requirements:
  - QUICK-36
must_haves:
  truths:
    - "When estimated cost is updated, the timeline shows values formatted as IDR (e.g., Rp 1.500.000) not raw numbers (e.g., 1500000)"
    - "The field label in the timeline shows 'Estimated Cost' instead of 'estimated_cost'"
  artifacts:
    - path: "components/jobs/job-timeline.tsx"
      provides: "IDR-formatted display of estimated_cost field updates"
      contains: "formatIDR"
  key_links:
    - from: "components/jobs/job-timeline.tsx"
      to: "lib/utils.ts"
      via: "formatIDR import"
      pattern: "formatIDR"
---

<objective>
Fix estimated cost display in the job activity timeline so that field_update events for `estimated_cost` show IDR-formatted values (e.g., "Rp 1.500.000") instead of raw numeric strings (e.g., "1500000"). Also improve the field label from the raw DB column name `estimated_cost` to the user-facing label "Estimated Cost".

Purpose: Consistency — the estimated cost input field uses IDR formatting with dot thousand separators; the timeline should match.
Output: Updated job-timeline.tsx with formatIDR applied to estimated_cost values and a FIELD_LABELS map for human-readable field names.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key facts:
- `formatIDR` is in `lib/utils.ts` (already imported in job-detail-info.tsx and job-preview-dialog.tsx for the same field)
- Audit logs store `estimated_cost` as a number; when cast `as string` in the timeline processor it becomes e.g. `"1500000"`
- The `field_update` event in `EventContent` renders `old_value` and `new_value` as plain strings between quotes
- CLAUDE.md: Currency must use IDR formatting (Rp prefix, dot thousands separator)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Format estimated_cost values and humanize field name in job timeline</name>
  <files>components/jobs/job-timeline.tsx</files>
  <action>
In `components/jobs/job-timeline.tsx`:

1. Add `formatIDR` to the import from `@/lib/utils` (currently only `formatDateTime` is imported).

2. Add a `FIELD_LABELS` constant above the `EventContent` function that maps raw DB field names to user-friendly labels:
   ```typescript
   const FIELD_LABELS: Record<string, string> = {
     estimated_cost: 'Estimated Cost',
   };
   ```

3. In the `field_update` case inside `EventContent`, apply two changes:
   a. Replace the raw `field` display with `FIELD_LABELS[field ?? ''] ?? field ?? 'a field'` so the label reads "Estimated Cost" instead of "estimated_cost".
   b. For value display: when `field === 'estimated_cost'`, parse the value as a number and format with `formatIDR`. Helper inline:
      ```typescript
      function formatFieldValue(field: string | undefined, value: string | undefined): string | undefined {
        if (value === undefined) return undefined;
        if (field === 'estimated_cost') {
          const num = parseFloat(value);
          return isNaN(num) ? value : formatIDR(num);
        }
        return value;
      }
      ```
      Apply this to both `oldValue` and `newValue` before rendering. Place the helper inside the `field_update` case block or as a module-level function above `EventContent`.

The rendered output should change from:
  "John updated estimated_cost from "500000" to "1500000""
to:
  "John updated Estimated Cost from "Rp 500.000" to "Rp 1.500.000""
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Build passes with no TypeScript errors. The field_update case for estimated_cost renders IDR-formatted values and shows "Estimated Cost" as the label.</done>
</task>

</tasks>

<verification>
After build passes: visit a job detail page where estimated cost was changed, confirm the timeline entry reads "Updated Estimated Cost from Rp X to Rp Y" with proper dot separators.
</verification>

<success_criteria>
- `components/jobs/job-timeline.tsx` imports and uses `formatIDR` for `estimated_cost` field values
- Field label displays as "Estimated Cost" (not `estimated_cost`)
- `npm run build` passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/36-estimated-cost-in-job-timeline-should-di/36-SUMMARY.md`
</output>
