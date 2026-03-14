---
phase: quick-78
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
  - components/maintenance/schedule-columns.tsx
autonomous: true
requirements: [QUICK-78]

must_haves:
  truths:
    - "Asset table Created column date renders with text-sm class matching job table pattern"
    - "Schedule table Created column date renders with text-sm class matching job table pattern"
  artifacts:
    - path: "components/assets/asset-columns.tsx"
      provides: "Asset table column definitions"
      contains: 'className="text-sm"'
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "Schedule table column definitions"
      contains: 'className="text-sm"'
  key_links:
    - from: "components/assets/asset-columns.tsx"
      to: "components/jobs/job-columns.tsx"
      via: "Consistent text-sm styling on Created column date span"
      pattern: 'className="text-sm"'
    - from: "components/maintenance/schedule-columns.tsx"
      to: "components/jobs/job-columns.tsx"
      via: "Consistent text-sm styling on Created column date span"
      pattern: 'className="text-sm"'
---

<objective>
Add `text-sm` class to the Created column date `<span>` in asset-columns.tsx and schedule-columns.tsx, matching the existing pattern in job-columns.tsx.

Purpose: Visual consistency across all entity tables -- the Created column date should use the same font size everywhere.
Output: Two files updated with className="text-sm" on Created column date spans.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
Reference pattern from components/jobs/job-columns.tsx (line 165):
```tsx
<span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>
```

Current asset-columns.tsx (line 168) — missing text-sm:
```tsx
<span>{format(new Date(date), 'dd-MM-yyyy')}</span>
```

Current schedule-columns.tsx (line 185) — missing text-sm:
```tsx
<span>{format(new Date(date), 'dd-MM-yyyy')}</span>
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add text-sm to Created column date spans in asset and schedule tables</name>
  <files>components/assets/asset-columns.tsx, components/maintenance/schedule-columns.tsx</files>
  <action>
In components/assets/asset-columns.tsx, find the created_at column cell (around line 168):
- Change `<span>{format(new Date(date), 'dd-MM-yyyy')}</span>`
- To: `<span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>`

In components/maintenance/schedule-columns.tsx, find the created_at column cell (around line 185):
- Change `<span>{format(new Date(date), 'dd-MM-yyyy')}</span>`
- To: `<span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>`

This matches the existing pattern in components/jobs/job-columns.tsx line 165.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -n 'className="text-sm"' components/assets/asset-columns.tsx components/maintenance/schedule-columns.tsx | grep -c 'created_at\|text-sm' && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Both asset-columns.tsx and schedule-columns.tsx Created column date spans have className="text-sm", matching job-columns.tsx pattern. Build succeeds.</done>
</task>

</tasks>

<verification>
- grep confirms `text-sm` on Created date spans in both files
- `npm run build` passes with no errors
</verification>

<success_criteria>
All three entity tables (jobs, assets, schedules) use consistent `text-sm` class on the Created column date span.
</success_criteria>

<output>
After completion, create `.planning/quick/78-standardize-text-sm-on-created-column-da/78-SUMMARY.md`
</output>
