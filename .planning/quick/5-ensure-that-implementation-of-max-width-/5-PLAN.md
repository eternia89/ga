---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/layout.tsx
  - components/requests/request-detail-client.tsx
  - components/jobs/job-detail-client.tsx
  - components/assets/asset-detail-client.tsx
  - CLAUDE.md
autonomous: true
requirements: [QUICK-5]

must_haves:
  truths:
    - "Content max-width is defined in exactly one place: the dashboard layout"
    - "No detail page component sets its own max-width"
    - "Changing the max-width value in layout.tsx propagates to all pages including detail pages"
  artifacts:
    - path: "app/(dashboard)/layout.tsx"
      provides: "Single source of truth for content max-width"
      contains: "max-w-"
    - path: "components/requests/request-detail-client.tsx"
      provides: "Request detail grid without max-width"
    - path: "components/jobs/job-detail-client.tsx"
      provides: "Job detail grid without max-width"
    - path: "components/assets/asset-detail-client.tsx"
      provides: "Asset detail grid without max-width"
  key_links:
    - from: "app/(dashboard)/layout.tsx"
      to: "all descendant pages"
      via: "CSS cascade - children inherit parent max-width constraint"
      pattern: "max-w-.*mx-auto"
---

<objective>
Consolidate content max-width to a single definition in the dashboard layout.

Purpose: Currently, the dashboard layout defines `max-w-[1300px]` and 3 detail page components each redundantly define `max-w-[1000px]`. The user wants a single source of truth so updating the max-width only requires changing one place.
Output: Layout as sole owner of content max-width; detail components without their own max-width constraint.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@app/(dashboard)/layout.tsx
@components/requests/request-detail-client.tsx
@components/jobs/job-detail-client.tsx
@components/assets/asset-detail-client.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove duplicate max-width from detail components and update CLAUDE.md</name>
  <files>
    components/requests/request-detail-client.tsx,
    components/jobs/job-detail-client.tsx,
    components/assets/asset-detail-client.tsx,
    CLAUDE.md
  </files>
  <action>
Remove `max-w-[1000px] mx-auto` from the outermost div className in each of the 3 detail client components. Keep all other classes intact (grid, gap, responsive breakpoints).

Specific changes:

1. `components/requests/request-detail-client.tsx` line 80:
   - FROM: `className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6 max-w-[1000px] mx-auto"`
   - TO: `className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6"`

2. `components/jobs/job-detail-client.tsx` line 65:
   - FROM: `className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6 max-w-[1000px] mx-auto"`
   - TO: `className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6"`

3. `components/assets/asset-detail-client.tsx` line 80:
   - FROM: `className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6 max-w-[1000px] mx-auto"`
   - TO: `className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6"`

4. `CLAUDE.md` — Update the "Detail page max width" bullet under UI Conventions:
   - FROM: "Detail page max width: All detail pages (request, job, etc.) must have a `max-w-[1000px]` constraint on the two-column layout (detail + activity timeline). Prevents content from stretching on ultra-wide monitors."
   - TO: "Content max width: Defined once in `app/(dashboard)/layout.tsx` via the `max-w-[...]` wrapper around `{children}`. Do NOT add max-width constraints in individual page components -- update the layout value instead."

Do NOT change the layout.tsx file -- its existing `max-w-[1300px] mx-auto` wrapper is already the single source of truth.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -rn "max-w-\[1000px\]" components/requests/request-detail-client.tsx components/jobs/job-detail-client.tsx components/assets/asset-detail-client.tsx | wc -l | xargs test 0 -eq && echo "PASS: No max-w-[1000px] in detail components" || echo "FAIL: Still found max-w-[1000px] in detail components"</automated>
  </verify>
  <done>
    - Zero occurrences of `max-w-[1000px]` in the 3 detail client components
    - Grid layout classes (grid-cols, gap, responsive) preserved unchanged
    - CLAUDE.md updated to reflect single-source-of-truth convention
    - `npm run build` passes (no TypeScript or build errors)
  </done>
</task>

</tasks>

<verification>
- `grep -rn "max-w-\[1000px\]" components/` returns zero results for detail client files
- `grep -n "max-w-" app/\(dashboard\)/layout.tsx` confirms layout still has the single max-width definition
- `npm run build` passes
</verification>

<success_criteria>
Content max-width is defined in exactly one place (dashboard layout). Changing the value in layout.tsx is the only step needed to update max-width for all pages. No detail component overrides the layout constraint.
</success_criteria>

<output>
After completion, create `.planning/quick/5-ensure-that-implementation-of-max-width-/5-SUMMARY.md`
</output>
