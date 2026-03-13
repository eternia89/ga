---
phase: quick-72
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/maintenance/schedule-detail.tsx
  - components/maintenance/schedule-form.tsx
autonomous: true
requirements: [QUICK-72]

must_haves:
  truths:
    - "Schedule detail read-only view has no rounded border section wrappers"
    - "Schedule create form has no rounded border section wrappers"
    - "Schedule edit form has no rounded border section wrappers"
    - "All section headings remain visible as text separators"
    - "Field layout and spacing remain visually clean"
  artifacts:
    - path: "components/maintenance/schedule-detail.tsx"
      provides: "Schedule detail without bordered sections"
      contains: "space-y-4"
    - path: "components/maintenance/schedule-form.tsx"
      provides: "Schedule forms without bordered sections"
      contains: "space-y-4"
  key_links:
    - from: "components/maintenance/schedule-detail.tsx"
      to: "components/maintenance/schedule-view-modal.tsx"
      via: "ScheduleDetail component import"
      pattern: "ScheduleDetail"
    - from: "components/maintenance/schedule-form.tsx"
      to: "components/maintenance/schedule-detail.tsx"
      via: "ScheduleForm component import"
      pattern: "ScheduleForm"
---

<objective>
Remove all rounded border section separators from maintenance schedule components, replacing them with simple heading text separators.

Purpose: Simplify the visual design of maintenance schedule pages to use lightweight heading separators instead of card-style bordered containers.
Output: Updated schedule-detail.tsx and schedule-form.tsx without `rounded-lg border p-6` section wrappers.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/maintenance/schedule-detail.tsx
@components/maintenance/schedule-form.tsx
@components/maintenance/template-detail.tsx (reference — already uses the correct pattern without borders)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove bordered section wrappers from schedule-detail.tsx and schedule-form.tsx</name>
  <files>components/maintenance/schedule-detail.tsx, components/maintenance/schedule-form.tsx</files>
  <action>
In schedule-detail.tsx (read-only view for non-managers, lines 262-352):
- Remove the `<div className="rounded-lg border border-border p-6 space-y-4">` wrapper around the "Schedule Details" section (line 262). Replace with `<div className="space-y-4">`. The h2 heading and Separator already exist inside and provide the section title.
- Remove the `<div className="rounded-lg border border-border p-6 space-y-4">` wrapper around the "PM Jobs" section (line 355). Replace with `<div className="space-y-4">`.

In schedule-form.tsx (ScheduleCreateForm, lines 245-326):
- Remove the `<div className="rounded-lg border border-border p-6 space-y-4">` wrapper around "Template & Asset" section (line 245). Replace with `<div className="space-y-4">`.
- Remove the `<div className="rounded-lg border border-border p-6 space-y-4">` wrapper around "Schedule Configuration" section (line 329). Replace with `<div className="space-y-4">`.

In schedule-form.tsx (ScheduleEditForm, line 520):
- Remove the `<div className="rounded-lg border border-border p-6 space-y-4">` wrapper around "Schedule Configuration" section (line 520). Replace with `<div className="space-y-4">`.

All 5 replacements follow the same pattern:
- `rounded-lg border border-border p-6 space-y-4` becomes `space-y-4`
- Keep the h2 heading element and Separator inside each section unchanged
- Keep all form fields and content unchanged

Reference: template-detail.tsx and template-create-form.tsx already use the correct borderless pattern with `<div className="space-y-4">` wrapping heading + Separator + fields.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -c "rounded-lg border" components/maintenance/schedule-detail.tsx components/maintenance/schedule-form.tsx && echo "---" && grep -c "space-y-4" components/maintenance/schedule-detail.tsx components/maintenance/schedule-form.tsx && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Zero occurrences of "rounded-lg border" class pattern in schedule-detail.tsx and schedule-form.tsx (note: the delete confirmation box in schedule-detail.tsx uses `rounded-lg border border-destructive/30` which is a different pattern and must be preserved). Build succeeds with no errors.</done>
</task>

</tasks>

<verification>
- `grep -rn "rounded-lg border" components/maintenance/schedule-detail.tsx` shows only the delete confirmation box (line ~201, `border-destructive/30`) and auto-pause notice (line ~231, `border-amber-200`), NOT any `border-border p-6` section wrappers
- `grep -rn "rounded-lg border" components/maintenance/schedule-form.tsx` returns zero matches
- `npm run build` completes without errors
- Visual: section headings (h2 elements) and Separator components still present, providing visual section breaks without card borders
</verification>

<success_criteria>
All 5 `rounded-lg border border-border p-6` section wrappers removed from schedule-detail.tsx (2) and schedule-form.tsx (3), replaced with plain `space-y-4` divs. Build passes. Template components already correct (no changes needed).
</success_criteria>

<output>
After completion, create `.planning/quick/72-remove-rounded-border-separators-from-ma/72-SUMMARY.md`
</output>
