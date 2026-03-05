---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-columns.tsx
  - components/assets/asset-columns.tsx
  - components/maintenance/template-columns.tsx
  - components/maintenance/schedule-columns.tsx
  - components/jobs/job-columns.tsx
autonomous: true
requirements: [QUICK-10]

must_haves:
  truths:
    - "Every entity table (Requests, Jobs, Assets, Templates, Schedules) has a View button in the actions column"
    - "View button is the only primary action; secondary actions (Cancel, Deactivate, etc.) remain alongside"
    - "All View buttons use identical styling: ghost variant, sm size, h-7 px-2 text-xs"
    - "Template table shows View button for all users, not just managers"
    - "All actions columns use consistent patterns: wrapper div, e.stopPropagation, enableSorting: false"
  artifacts:
    - path: "components/requests/request-columns.tsx"
      provides: "Request actions column with View button"
      contains: "enableSorting: false"
    - path: "components/assets/asset-columns.tsx"
      provides: "Asset actions column with View button"
      contains: "e.stopPropagation"
    - path: "components/maintenance/template-columns.tsx"
      provides: "Template actions column with View button for all roles"
      contains: "onView"
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "Schedule actions column with View button"
      contains: "onView"
    - path: "components/jobs/job-columns.tsx"
      provides: "Job actions column with View + Cancel"
      contains: "onView"
  key_links:
    - from: "components/maintenance/template-columns.tsx"
      to: "components/maintenance/template-list.tsx"
      via: "TemplateTableMeta.onView callback"
      pattern: "onView.*template"
---

<objective>
Audit and unify the table row actions column across all 5 entity tables to ensure consistent View button presence, styling, and behavior.

Purpose: Ensure every entity table has a consistent "View" button that opens the modal, with identical styling and behavior patterns. Fix gaps where Template table has no View button for non-managers and inconsistent patterns across columns.
Output: All 5 column definition files updated with consistent action column patterns.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/requests/request-columns.tsx
@components/jobs/job-columns.tsx
@components/assets/asset-columns.tsx
@components/maintenance/template-columns.tsx
@components/maintenance/schedule-columns.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Unify all 5 action columns to consistent View button pattern</name>
  <files>
    components/requests/request-columns.tsx
    components/jobs/job-columns.tsx
    components/assets/asset-columns.tsx
    components/maintenance/template-columns.tsx
    components/maintenance/schedule-columns.tsx
  </files>
  <action>
Audit and fix each actions column to follow this consistent pattern:

**Target pattern for all 5 tables:**
- Actions column: `id: 'actions'`, NO `header` property (remove from asset-columns), `enableSorting: false`
- Wrap all buttons in `<div className="flex items-center gap-1">`
- View button ALWAYS first: `variant="ghost" size="sm" className="h-7 px-2 text-xs"` with `e.stopPropagation()` on click
- Secondary actions (Cancel, Deactivate, etc.) follow after View button
- View button visible to ALL users (not gated by role)

**Specific fixes per file:**

1. **request-columns.tsx** -- Add wrapper `<div className="flex items-center gap-1">`, add `enableSorting: false` to the actions column definition. Already has `e.stopPropagation()`, good.

2. **asset-columns.tsx** -- Remove `header: 'Actions'` from actions column. Add `e.stopPropagation()` to View button click handler. Already has wrapper div, good.

3. **template-columns.tsx** -- CRITICAL FIX: Remove the `if (!canManage) return null;` guard that hides the entire actions column for non-managers. Restructure so View button is always rendered for all users, and Deactivate/Reactivate buttons are conditionally rendered only for managers (`canManage`). Add `e.stopPropagation()` to all button click handlers.

4. **schedule-columns.tsx** -- Add `e.stopPropagation()` to View and all other button click handlers. Already has View button, good.

5. **job-columns.tsx** -- Already consistent. Verify `enableSorting: false` is present; if not, add it.

Do NOT change the name-as-clickable-link pattern in template-columns and schedule-columns -- those are fine as an additional way to open the modal. The View button in the actions column ensures discoverability.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - All 5 actions columns have View button visible to all roles
    - All View buttons use identical ghost/sm/h-7 styling
    - All actions columns have enableSorting: false
    - All click handlers include e.stopPropagation()
    - No header property on any actions column
    - Template table no longer returns null for non-manager roles
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- `npm run lint` passes
- Grep for `if (!canManage) return null` in template-columns.tsx returns no results
- Grep for `header: 'Actions'` in asset-columns.tsx returns no results
- All 5 column files have `enableSorting: false` on their actions column
</verification>

<success_criteria>
All 5 entity table action columns follow identical patterns: View button always visible for all roles, consistent styling, e.stopPropagation on all handlers, enableSorting: false, no header property.
</success_criteria>

<output>
After completion, create `.planning/quick/10-unify-table-row-view-links-to-modal-patt/10-SUMMARY.md`
</output>
