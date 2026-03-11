---
phase: quick-35
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-timeline.tsx
  - components/jobs/job-timeline.tsx
  - components/assets/asset-timeline.tsx
autonomous: true
requirements: [QUICK-35]

must_haves:
  truths:
    - "Timeline icon circle and text content have visible breathing room between them"
    - "All three timelines (request, job, asset) use consistent spacing"
    - "The vertical connector line still aligns correctly with the icon circles"
  artifacts:
    - path: "components/requests/request-timeline.tsx"
      provides: "Request timeline with proper icon-to-text gap"
    - path: "components/jobs/job-timeline.tsx"
      provides: "Job timeline with proper icon-to-text gap"
    - path: "components/assets/asset-timeline.tsx"
      provides: "Asset timeline with proper icon-to-text gap"
  key_links:
    - from: "icon circle (absolute -left-6, 24px wide)"
      to: "content div (min-w-0 flex-1)"
      via: "pl-8 on outer container instead of pl-6"
      pattern: "pl-8"
---

<objective>
Add proper spacing between the icon circle and text content in all three activity timelines so the layout does not look cramped.

Purpose: The current layout uses `pl-6` on the outer container and places the icon absolutely at `-left-6`. Since the icon is exactly 24px wide (h-6 w-6) and the padding is also 24px (pl-6 = 1.5rem), the text content starts immediately adjacent to the icon with zero visual gap. Increasing the container padding to `pl-8` (2rem = 32px) gives 8px of breathing room between the right edge of the icon circle and the start of the text.

Output: Three updated timeline components with comfortable icon-to-text spacing.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix icon-to-text spacing in all three timeline components</name>
  <files>
    components/requests/request-timeline.tsx,
    components/jobs/job-timeline.tsx,
    components/assets/asset-timeline.tsx
  </files>
  <action>
In all three timeline files, the outer scroll container uses `pl-6` to create left padding for the icon. The icon is `absolute -left-6 h-6 w-6` (24px wide). With `pl-6` (24px), text starts at the exact right edge of the icon — zero gap.

Fix: Change `pl-6` to `pl-8` on the `div.relative` wrapper inside each `ScrollArea`. This increases the content offset to 32px while the icon remains anchored at -24px from that edge, yielding 8px of gap between icon and text.

Also update the icon's absolute positioning from `-left-6` to `-left-7` so the icon stays visually centered on the vertical connector line (`left-3` = 12px from container left; icon needs to be centered at 12px from the new `pl-8` container edge — use `-left-7` which places the 24px icon so its center is at 32px - 28px + 12px = 16px... actually keep it simpler: the vertical line is at `left-3` absolute from the container. The container has `pl-8` now. The icon should be centered over the line. Line is at absolute left=12px from the container. Icon center = left_offset + icon_half = (-left-7 from pl-8 content area) = -(28px) from the 32px padding edge = 4px from container left; icon center = 4 + 12 = 16px. That overshoots.

Correct approach: Keep the icon at `absolute -left-6` (unchanged). Just increase the container padding from `pl-6` to `pl-8`. The vertical line stays at `left-3`. With `pl-8`, the content area starts 32px from the container left. The icon at `-left-6` (= -24px from content area start) = 32 - 24 = 8px from container left. Icon center = 8 + 12 = 20px from container left. The line at `left-3` = 12px. So icon drifts 8px right of line. That misaligns.

Correct final approach: Increase both the container padding AND the icon offset together to maintain line alignment:
- Container: `pl-6` -> `pl-9` (36px)
- Icon: `absolute -left-6` -> `absolute -left-8` (positions icon at 36-32=4px... still off)

Simplest correct approach: Keep `pl-6` and `left-3` (line) and `-left-6` (icon) untouched (icon/line already aligned). Instead, add `ml-2` to the content `div` (the `min-w-0 flex-1` div) to push text away from the icon without moving the icon or line.

Apply `ml-2` to the content div in each timeline:
- In request-timeline.tsx line 221: `className="min-w-0 flex-1 space-y-1"` -> `className="ml-2 min-w-0 flex-1 space-y-1"`
- In job-timeline.tsx line 235: `className="min-w-0 flex-1 space-y-1"` -> `className="ml-2 min-w-0 flex-1 space-y-1"`
- In job-timeline.tsx line 271 (comment entry): `className="min-w-0 flex-1 space-y-2"` -> `className="ml-2 min-w-0 flex-1 space-y-2"`
- In asset-timeline.tsx line 418: `className="min-w-0 flex-1 space-y-1"` -> `className="ml-2 min-w-0 flex-1 space-y-1"`

This adds 8px left margin to the text content only, leaving the icon and connector line positions unchanged.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
    All three timeline files have `ml-2` on the content div. The build passes with no TypeScript errors. Visually, there is a clear gap between the colored icon circle and the start of the timeline text on all entity detail pages.
  </done>
</task>

</tasks>

<verification>
Run `npm run build` — must complete with no errors.

Manual spot-check: open any request, job, or asset detail page and confirm the activity timeline shows clear spacing between the icon bubble and the text that follows it.
</verification>

<success_criteria>
- `npm run build` passes clean
- Timeline icon circles and text content have visible spacing (no cramped appearance) on all three entity detail pages
- Connector line alignment is unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/35-add-proper-spacing-between-icon-and-text/35-SUMMARY.md`
</output>
