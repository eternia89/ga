---
phase: quick-15
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-columns.tsx
  - components/jobs/job-columns.tsx
  - components/assets/asset-columns.tsx
  - components/maintenance/template-columns.tsx
  - components/maintenance/schedule-columns.tsx
  - components/admin/companies/company-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/categories/category-columns.tsx
  - components/admin/users/user-columns.tsx
  - components/audit-trail/audit-trail-columns.tsx
autonomous: true
requirements: [QUICK-15]

must_haves:
  truths:
    - "Action buttons in all tables use text-sm matching other cell content"
    - "Action buttons display blue text (text-blue-600) indicating clickability"
    - "Action buttons show underline on hover"
  artifacts:
    - path: "components/requests/request-columns.tsx"
      provides: "View button with blue link styling"
      contains: "text-blue-600"
    - path: "components/jobs/job-columns.tsx"
      provides: "View button with blue link styling"
      contains: "text-blue-600"
    - path: "components/assets/asset-columns.tsx"
      provides: "View button with blue link styling"
      contains: "text-blue-600"
    - path: "components/maintenance/template-columns.tsx"
      provides: "View button with blue link styling"
      contains: "text-blue-600"
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "View button with blue link styling"
      contains: "text-blue-600"
    - path: "components/admin/companies/company-columns.tsx"
      provides: "Edit button with blue link styling"
      contains: "text-blue-600"
    - path: "components/admin/divisions/division-columns.tsx"
      provides: "Edit button with blue link styling"
      contains: "text-blue-600"
    - path: "components/admin/locations/location-columns.tsx"
      provides: "Edit button with blue link styling"
      contains: "text-blue-600"
    - path: "components/admin/categories/category-columns.tsx"
      provides: "Edit button with blue link styling"
      contains: "text-blue-600"
    - path: "components/admin/users/user-columns.tsx"
      provides: "Edit/View button with blue link styling"
      contains: "text-blue-600"
  key_links: []
---

<objective>
Update all table action buttons (View/Edit) across 11 column files to use blue link styling with matching font size.

Purpose: Action buttons currently use text-xs which is smaller than cell content (text-sm), and lack visual affordance indicating they open modals. Blue text with hover underline provides classic link styling.
Output: All table action buttons consistently styled with text-blue-600, hover:underline, and text-sm.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update action button styling across all column files</name>
  <files>
    components/requests/request-columns.tsx
    components/jobs/job-columns.tsx
    components/assets/asset-columns.tsx
    components/maintenance/template-columns.tsx
    components/maintenance/schedule-columns.tsx
    components/admin/companies/company-columns.tsx
    components/admin/divisions/division-columns.tsx
    components/admin/locations/location-columns.tsx
    components/admin/categories/category-columns.tsx
    components/admin/users/user-columns.tsx
    components/audit-trail/audit-trail-columns.tsx
  </files>
  <action>
In all 11 column files, find every Button used as a row action (View or Edit) and update the className:

Current pattern:
  className="h-7 px-2 text-xs"

Replace with:
  className="h-7 px-2 text-sm text-blue-600 hover:underline"

Changes:
- text-xs -> text-sm (match cell content font size)
- Add text-blue-600 (blue link color)
- Add hover:underline (link hover affordance)

Keep variant="ghost" and size="sm" unchanged on the Button component.

For template-columns.tsx and schedule-columns.tsx: check for multiple Button occurrences (row click + actions column) and update ALL of them.

For user-columns.tsx: update both Edit and View buttons if both exist.

For audit-trail-columns.tsx: check if it has action buttons. If not, skip it.
  </action>
  <verify>
    <automated>grep -rn "text-blue-600" components/requests/request-columns.tsx components/jobs/job-columns.tsx components/assets/asset-columns.tsx components/maintenance/template-columns.tsx components/maintenance/schedule-columns.tsx components/admin/companies/company-columns.tsx components/admin/divisions/division-columns.tsx components/admin/locations/location-columns.tsx components/admin/categories/category-columns.tsx components/admin/users/user-columns.tsx && echo "PASS: blue styling found" || echo "FAIL: missing blue styling"</automated>
  </verify>
  <done>All table action buttons use text-sm text-blue-600 hover:underline. No remaining text-xs on action buttons. Build passes (npm run build).</done>
</task>

</tasks>

<verification>
- grep confirms text-blue-600 present in all 10-11 column files
- grep confirms no remaining "text-xs" on action buttons (may still exist on non-action elements)
- npm run build succeeds with no errors
</verification>

<success_criteria>
All table action buttons visually match: blue text at same font size as cell content, underline on hover.
</success_criteria>

<output>
After completion, create `.planning/quick/15-table-action-should-have-the-same-size-a/15-SUMMARY.md`
</output>
