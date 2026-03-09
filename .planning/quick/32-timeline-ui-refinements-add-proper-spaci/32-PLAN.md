---
phase: quick-32
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-timeline.tsx
  - components/jobs/job-timeline.tsx
  - components/assets/asset-timeline.tsx
autonomous: true
requirements: [QUICK-32]

must_haves:
  truths:
    - "Timeline entries have consistent spacing between icon and text across all three components"
    - "Timeline text is compact (text-xs) so more history fits in the scroll area"
    - "Timeline entries are spaced closer together for denser history view"
  artifacts:
    - path: "components/requests/request-timeline.tsx"
      provides: "Compact request timeline"
      contains: "text-xs"
    - path: "components/jobs/job-timeline.tsx"
      provides: "Compact job timeline"
      contains: "text-xs"
    - path: "components/assets/asset-timeline.tsx"
      provides: "Compact asset timeline"
      contains: "text-xs"
  key_links: []
---

<objective>
Refine timeline UI across all three timeline components (request, job, asset) to improve spacing consistency between icon and text, and make text smaller for a more compact historical log.

Purpose: Timelines are historical logs — compact text lets users see more history at a glance without excessive scrolling.
Output: Three updated timeline components with consistent, compact styling.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/requests/request-timeline.tsx
@components/jobs/job-timeline.tsx
@components/assets/asset-timeline.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Compact timeline styling across all three components</name>
  <files>components/requests/request-timeline.tsx, components/jobs/job-timeline.tsx, components/assets/asset-timeline.tsx</files>
  <action>
All three timeline components share identical layout structure. Apply these changes consistently to each:

1. **Reduce entry spacing:** Change `space-y-6` to `space-y-4` on the entries container — tighter vertical rhythm for a log-style timeline.

2. **Fix icon-to-text gap:** Change `gap-4` to `gap-3` on each timeline entry row (`relative flex gap-4`) — slightly tighter but still readable.

3. **Shrink main content text:** Change `text-sm` to `text-xs` on the main content div (the one wrapping `<EventContent>`). This is the primary change — timeline is a historical log, not primary reading content.

4. **Shrink comment text in job timeline:** In job-timeline.tsx, the comment content paragraph uses `text-sm` — change to `text-xs` to match.

5. **Keep timestamp text as `text-xs`** (already correct — no change needed).

6. **Keep blockquote text:** In rejection/feedback blockquotes, change `text-sm` to `text-xs` to match the surrounding content. This applies to:
   - request-timeline.tsx: rejection blockquote (line ~131), acceptance_rejection blockquote (line ~159), feedback blockquote (line ~183)
   - job-timeline.tsx: approval_rejection blockquote (line ~142)
   - asset-timeline.tsx: transfer_rejected blockquote (line ~220)

Do NOT change icon sizes (h-3.5 w-3.5) or icon circle sizes (h-6 w-6) — these are fine.
Do NOT change the `leading-relaxed` class — keep it for readability at smaller text size.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>All three timeline components use text-xs for content, space-y-4 for entry spacing, gap-3 for icon-text gap, and text-xs for blockquotes. Visual density is increased while maintaining readability.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npm run lint` passes
- All three files use consistent spacing classes: space-y-4, gap-3, text-xs
</verification>

<success_criteria>
- Timeline entries are more compact with text-xs content
- Icon-to-text spacing is consistent (gap-3) across all components
- Entry-to-entry spacing is tighter (space-y-4) for denser history
- No TypeScript or lint errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/32-timeline-ui-refinements-add-proper-spaci/32-SUMMARY.md`
</output>
