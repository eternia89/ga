# Quick Task: UI Consistency Batch Fix - Research

**Researched:** 2026-03-26
**Domain:** UI layout consistency (Tailwind CSS classes)
**Confidence:** HIGH

## Summary

Four UI inconsistencies identified, all confirmed with codebase grep. All fixes are CSS class changes only -- no logic, no tests needed per CLAUDE.md ("Skip tests for UI-only changes").

**Primary recommendation:** Straightforward find-and-replace across 7 files. No blast radius concerns.

## Issue 1: grid-cols-2 in Schedule & Template Detail (Read-Only Sections)

**Context:** The `grid-cols-2` usage in `schedule-detail.tsx` (line 291) and `template-detail.tsx` (line 347) is inside the **read-only info field layout** (for non-managers who can't edit). These are NOT the main two-column detail+timeline layout. These pages currently lack a timeline column entirely.

**However**, the task explicitly says to replace with `grid-cols-[1fr_380px] max-lg:grid-cols-1`. The standard convention from CLAUDE.md is that detail pages use this layout for left-content + right-timeline columns.

### Exact Locations

| File | Line | Current | Standard |
|------|------|---------|----------|
| `components/maintenance/schedule-detail.tsx` | 291 | `grid grid-cols-2 gap-6 max-md:grid-cols-1` | `grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6` |
| `components/maintenance/template-detail.tsx` | 347 | `grid grid-cols-2 gap-6 max-md:grid-cols-1` | `grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6` |

**Important nuance:** These `grid-cols-2` divs layout field pairs (Template+Interval, Name+Category) -- they are NOT the main page-level two-column layout. Changing them to `grid-cols-[1fr_380px]` will make the left field much wider and the right field exactly 380px, which changes the visual balance. This is fine if the user wants it, but it is a different pattern from how `grid-cols-[1fr_380px]` is used elsewhere (content + timeline).

**Also note the breakpoint change:** Current uses `max-md:grid-cols-1`, but standard is `max-lg:grid-cols-1`. This is also part of the fix.

## Issue 2: Missing pb-20 on Asset Detail Page

The `pb-20` class provides bottom padding for the sticky save bar. All other detail pages with editable forms include it.

| File | Line | Current | Fix |
|------|------|---------|-----|
| `app/(dashboard)/inventory/[id]/page.tsx` | 218 | `space-y-6 py-6` | `space-y-6 py-6 pb-20` |

**Comparison with other detail pages:**
- `requests/[id]/page.tsx:384` -- `space-y-6 py-6 pb-20` (correct)
- `jobs/[id]/page.tsx:451` -- `space-y-6 py-6 pb-20` (correct)
- `maintenance/schedules/[id]/page.tsx:122` -- `space-y-6 py-6 pb-20` (correct)
- `maintenance/templates/[id]/page.tsx:78` -- `space-y-6 py-6 pb-20` (correct)
- **`inventory/[id]/page.tsx:218`** -- `space-y-6 py-6` (MISSING pb-20)

## Issue 3: Inconsistent Link Hover Colors

The task says to standardize to `hover:text-blue-700`. Currently, **no file** uses `hover:text-blue-700` -- the dominant pattern is `text-blue-600 hover:underline` (20 occurrences, no hover color change). The deviations use `hover:text-blue-800` (5 occurrences) and `hover:text-blue-500` (2 occurrences).

### Files Needing Changes

**`hover:text-blue-800` (change to `hover:text-blue-700`):**

| File | Line | Context |
|------|------|---------|
| `components/notifications/notification-dropdown.tsx` | 34 | "Mark all read" link |
| `components/notifications/notification-dropdown.tsx` | 64 | "View all notifications" link |
| `components/audit-trail/audit-trail-columns.tsx` | 156 | Record ID link |
| `components/maintenance/schedule-columns.tsx` | 31 | Schedule name link |
| `components/maintenance/template-columns.tsx` | 26 | Template name link |

**`hover:text-blue-500` (change to `hover:text-blue-700`):**

| File | Line | Context |
|------|------|---------|
| `app/(auth)/login/page.tsx` | 282 | "Forgot your password?" link |
| `app/(auth)/reset-password/page.tsx` | 116 | "Back to login" link |

**Total: 7 changes across 6 files.**

## Standard Patterns (Reference)

### Detail Page Two-Column Layout (from CLAUDE.md)
```tsx
<div className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6">
  {/* Left: content */}
  {/* Right: Activity Timeline */}
</div>
```

Used correctly in:
- `components/requests/request-detail-client.tsx:87`
- `components/assets/asset-detail-client.tsx:159`
- `components/jobs/job-detail-client.tsx:78`

### Detail Page Container with Save Bar Padding
```tsx
<div className="space-y-6 py-6 pb-20">
```

### Link Hover Color (target standard)
```tsx
className="text-blue-600 hover:text-blue-700"
```

## Common Pitfalls

### Pitfall 1: Changing field-layout grid to page-layout grid
**What goes wrong:** The `grid-cols-2` in schedule/template detail is for field pairs, not content+timeline. Blindly replacing makes fields unequal width.
**How to avoid:** The planner should verify the user truly wants 1fr+380px for these field-pair grids, or if the intent was actually about a missing page-level two-column layout.

## Validation

No tests needed -- CLAUDE.md explicitly says "Skip tests for UI-only changes (layout, spacing, colors, copy/terminology, column ordering)."

Visual verification: After changes, check each affected page in the browser to confirm layout looks correct.

## Sources

### Primary (HIGH confidence)
- Direct codebase grep of all `.tsx` files for exact class names and line numbers
- `CLAUDE.md` detail page layout convention (line 158)
- `CLAUDE.md` responsive design rules (lines 77-81)
