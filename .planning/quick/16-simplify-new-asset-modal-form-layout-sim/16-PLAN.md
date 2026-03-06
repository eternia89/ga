---
phase: quick-16
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-submit-form.tsx
autonomous: true
requirements: [QUICK-16]

must_haves:
  truths:
    - "Asset form sections have no card-like borders or padding wrappers"
    - "All form fields stack in single column layout"
    - "Section subtitles and separators remain visible between sections"
    - "Form spacing is consistent at space-y-6 between sections"
  artifacts:
    - path: "components/assets/asset-submit-form.tsx"
      provides: "Simplified asset create form layout"
      contains: "space-y-6"
  key_links: []
---

<objective>
Simplify the AssetSubmitForm layout by removing card wrappers from all 6 sections, flattening multi-column grids to single column, and reducing top-level spacing.

Purpose: Cleaner, simpler form layout without card-like section wrappers.
Output: Updated asset-submit-form.tsx with flat layout.
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
  <name>Task 1: Remove card wrappers, flatten grids, reduce spacing</name>
  <files>components/assets/asset-submit-form.tsx</files>
  <action>
Make three changes to asset-submit-form.tsx:

1. **Top-level form spacing:** Change `className="space-y-8"` on the `<form>` element (line 217) to `className="space-y-6"`.

2. **Remove card wrappers from all 6 sections:** Each section currently has `<div className="rounded-lg border border-border p-6 space-y-4">`. Replace each with `<div className="space-y-4">`. There are 6 occurrences:
   - Section 1 (Basic Info) — line 220
   - Section 2 (Identification) — line 299
   - Section 3 (Dates) — line 366
   - Section 4 (Description) — line 414
   - Section 5 (Condition Photos) — line 445
   - Section 6 (Invoice Files) — line 471

3. **Flatten multi-column grids to single column:** Remove the grid wrapper divs entirely, letting the FormField components sit directly in the section's space-y-4 container:
   - Section 1 (line 247): Remove `<div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">` wrapper around category + location fields
   - Section 2 (line 305): Remove `<div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">` wrapper around brand + model + serial number fields
   - Section 3 (line 372): Remove `<div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">` wrapper around acquisition date + warranty expiry fields

For each grid removal: delete the opening `<div className="grid ...">` and its matching closing `</div>`, leaving the child FormField components in place.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -20 && grep -c "rounded-lg border border-border" components/assets/asset-submit-form.tsx && grep -c "grid grid-cols" components/assets/asset-submit-form.tsx && grep "space-y-8" components/assets/asset-submit-form.tsx; echo "Expected: 0 rounded-lg, 0 grid-cols, no space-y-8"</automated>
  </verify>
  <done>
    - Zero occurrences of "rounded-lg border border-border p-6" in the file
    - Zero occurrences of "grid grid-cols-2" or "grid grid-cols-3" in the file
    - Form uses space-y-6 (not space-y-8)
    - All 6 section subtitles (h2) and Separators remain
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- `npm run lint` passes
- No card wrappers remain in file
- No multi-column grids remain in file
- All 6 sections still have h2 subtitle + Separator
</verification>

<success_criteria>
Asset create form renders all fields in single-column layout with section subtitles and separators but no card-like borders or padding wrappers.
</success_criteria>

<output>
After completion, create `.planning/quick/16-simplify-new-asset-modal-form-layout-sim/16-SUMMARY.md`
</output>
