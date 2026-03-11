---
phase: quick-39
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-submit-form.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "When the New Asset modal opens, the acquisition_date field shows today's date pre-filled"
    - "The date input is not empty on first render"
  artifacts:
    - path: "components/assets/asset-submit-form.tsx"
      provides: "Asset create form with defaultValues.acquisition_date set to today"
      contains: "new Date().toISOString().split('T')[0]"
  key_links:
    - from: "components/assets/asset-submit-form.tsx"
      to: "useForm defaultValues.acquisition_date"
      via: "new Date().toISOString().split('T')[0]"
      pattern: "acquisition_date.*toISOString"
---

<objective>
Default the acquisition_date field to today's date when the New Asset form initializes.

Purpose: Users adding a new asset almost always acquired it today. Pre-filling saves a click and prevents accidental empty submissions.
Output: Modified asset-submit-form.tsx where acquisition_date defaultValue is today in yyyy-MM-dd format (required by HTML date input).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-submit-form.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Default acquisition_date to today in asset create form</name>
  <files>components/assets/asset-submit-form.tsx</files>
  <action>
In the `useForm` call at line 72, change the `defaultValues.acquisition_date` from `''` to today's date.

HTML `<input type="date">` expects `yyyy-MM-dd` format (ISO date string) for its value — this is separate from the dd-MM-yyyy display format in CLAUDE.md which applies to text rendering, not native date inputs.

Change:
```ts
acquisition_date: '',
```
To:
```ts
acquisition_date: new Date().toISOString().split('T')[0],
```

No other changes needed. The `warranty_expiry` field should remain `''` (no default — expiry date is unknown at acquisition time).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Build succeeds. When the New Asset modal opens, the acquisition_date input shows today's date (yyyy-MM-dd format) pre-filled instead of blank.</done>
</task>

</tasks>

<verification>
Run `npm run build` — must complete with no TypeScript or ESLint errors related to the changed file.
Manually open the New Asset modal at /inventory and confirm acquisition_date is pre-filled with today's date.
</verification>

<success_criteria>
- `npm run build` passes cleanly
- `acquisition_date` defaultValue in `useForm` is `new Date().toISOString().split('T')[0]` (not `''`)
- `warranty_expiry` defaultValue remains `''`
</success_criteria>

<output>
After completion, create `.planning/quick/39-asset-default-acquisition-date-to-today-/39-SUMMARY.md`
</output>
