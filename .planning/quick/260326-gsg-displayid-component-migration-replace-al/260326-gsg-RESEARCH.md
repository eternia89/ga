# Quick Task: DisplayId Component Migration - Research

**Researched:** 2026-03-26
**Domain:** UI component consistency (font-mono display ID rendering)
**Confidence:** HIGH

## Summary

The `DisplayId` component (`components/display-id.tsx`) is a simple wrapper: `<span className={cn('font-mono', className)}>{children}</span>`. It already has adoption in table columns (request-columns, job-columns, asset-columns, schedule-columns) and several dialog/detail components. However, 16 locations still use inline `className="font-mono ..."` for display IDs, and 3 locations render display IDs without any font-mono styling at all.

**Primary recommendation:** Migrate all inline font-mono display ID renders to `<DisplayId>`, adding the component where display IDs lack font-mono entirely.

## Component API

```tsx
// components/display-id.tsx
import { cn } from '@/lib/utils';

export function DisplayId({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('font-mono', className)}>{children}</span>;
}
```

Key: `font-mono` is always applied. Additional classes pass through `className`. Renders a `<span>`.

**Important constraint for headers:** Several locations use `<h1>` or `<h2>` with `font-mono` in the className. Since `DisplayId` renders a `<span>`, wrapping the content inside the heading tag works fine (span inside h1/h2 is valid HTML). The heading-level classes (`text-2xl font-bold tracking-tight`) stay on the `<h1>`/`<h2>`, and `DisplayId` handles `font-mono`.

**Important constraint for links:** `audit-trail-columns.tsx` and `request-detail-info.tsx` use `<Link>` or `<a>` with font-mono. Since `DisplayId` is a `<span>`, it should wrap the text content *inside* the link, not replace the link element.

## Migration Inventory

### Category A: Inline font-mono for display_id -- REPLACE with DisplayId

| # | File | Line | Element | Current Classes | Migration Notes |
|---|------|------|---------|-----------------|-----------------|
| 1 | `app/(dashboard)/jobs/[id]/page.tsx` | 458 | `<h1>` | `text-2xl font-bold tracking-tight font-mono` | Move `font-mono` off h1; wrap content: `<h1 className="text-2xl font-bold tracking-tight"><DisplayId>{job.display_id}</DisplayId></h1>` |
| 2 | `app/(dashboard)/requests/[id]/page.tsx` | 390 | `<h1>` | `text-2xl font-bold tracking-tight font-mono` | Same pattern as #1 |
| 3 | `components/assets/asset-view-modal.tsx` | 443 | `<h2>` | `text-xl font-bold tracking-tight font-mono` | Same pattern, h2 variant |
| 4 | `components/assets/asset-detail-client.tsx` | 100 | `<h1>` | `text-2xl font-bold tracking-tight font-mono` | Same pattern as #1 |
| 5 | `components/requests/request-view-modal.tsx` | 570 | `<h2>` | `text-xl font-bold tracking-tight font-mono` | Same pattern, h2 variant |
| 6 | `components/jobs/job-modal.tsx` | 1012 | `<h2>` | `text-xl font-bold tracking-tight font-mono` | Same pattern, h2 variant |
| 7 | `components/approvals/approval-queue.tsx` | 174 | `<TableCell>` | `font-mono text-sm font-medium` | Replace `<TableCell className="font-mono text-sm font-medium">{job.display_id}</TableCell>` with `<TableCell><DisplayId className="text-sm font-medium">{job.display_id}</DisplayId></TableCell>` |
| 8 | `components/jobs/job-detail-info.tsx` | 488 | `<span>` | `font-mono text-xs font-semibold text-muted-foreground shrink-0` | Direct replacement: `<DisplayId className="text-xs font-semibold text-muted-foreground shrink-0">` |
| 9 | `components/jobs/job-form.tsx` | 577 | `<span>` | `font-mono text-xs font-semibold text-muted-foreground shrink-0` | Direct replacement same as #8 |
| 10 | `components/jobs/job-preview-dialog.tsx` | 161 | `<span>` | `font-mono text-sm font-semibold text-muted-foreground` | Direct replacement |
| 11 | `components/jobs/job-preview-dialog.tsx` | 234 | `<span>` | `font-mono text-xs font-semibold text-muted-foreground shrink-0` | Direct replacement |
| 12 | `components/jobs/request-preview-dialog.tsx` | 45 | `<span>` | `font-mono text-sm font-semibold text-muted-foreground` | Direct replacement |
| 13 | `components/requests/request-detail-info.tsx` | 356 | `<Link>` | `text-sm font-mono font-medium text-primary hover:underline inline-flex items-center gap-1` | Wrap text inside Link: `<Link className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"><DisplayId>{job.display_id}</DisplayId><ExternalLink .../></Link>` |
| 14 | `components/audit-trail/audit-trail-columns.tsx` | 147 | `<span>` | `font-mono text-xs text-muted-foreground` | Direct replacement (non-link fallback) |
| 15 | `components/audit-trail/audit-trail-columns.tsx` | 156 | `<Link>` | `font-mono text-xs text-blue-600 hover:underline hover:text-blue-700 transition-colors` | Wrap text inside Link: `<Link className="text-xs text-blue-600 hover:underline hover:text-blue-700 transition-colors"><DisplayId>{displayText}</DisplayId></Link>` |
| 16 | `components/requests/request-triage-dialog.tsx` | 122 | inline in string | No font-mono at all (inside DialogTitle text) | Wrap just the display_id part: `Triage Request{request ? <> -- <DisplayId>{request.display_id}</DisplayId></> : ''}` |

### Category B: Renders display_id WITHOUT font-mono -- ADD DisplayId

| # | File | Line | Context | Fix |
|---|------|------|---------|-----|
| 1 | `components/maintenance/pm-checklist-preview.tsx` | 93 | `<span className="text-muted-foreground font-normal ml-1">({assetDisplayId})</span>` | Wrap with DisplayId: `<DisplayId className="text-muted-foreground font-normal ml-1">({assetDisplayId})</DisplayId>` |
| 2 | `components/maintenance/schedule-view-modal.tsx` | 354 | `{schedule.asset.display_id && \` (\${schedule.asset.display_id})\`}` (inside text node) | Wrap: `{schedule.asset.display_id && <> (<DisplayId className="text-sm">{schedule.asset.display_id}</DisplayId>)</>}` |
| 3 | `components/maintenance/schedule-detail.tsx` | 152 | Inside Input value prop (string concatenation) | This is a disabled Input value string -- cannot use JSX component here. **SKIP** -- Input value is a string prop, not renderable JSX. |

### Category C: Already uses DisplayId -- NO CHANGE

| File | Line | Status |
|------|------|--------|
| `components/requests/request-columns.tsx` | 34 | Already migrated |
| `components/jobs/job-columns.tsx` | 34 | Already migrated |
| `components/assets/asset-columns.tsx` | 46 | Already migrated |
| `components/maintenance/schedule-columns.tsx` | 64 | Already migrated |
| `components/jobs/job-form.tsx` | 613 | Already migrated |
| `components/assets/asset-transfer-dialog.tsx` | 189 | Already migrated |
| `components/assets/asset-transfer-respond-modal.tsx` | 334 | Already migrated |
| `components/assets/asset-status-change-dialog.tsx` | 137 | Already migrated |
| `components/maintenance/schedule-view-modal.tsx` | 385 | Already migrated |
| `components/maintenance/schedule-detail.tsx` | 379-381 | Already migrated |

### Category D: font-mono NOT for display_id -- DO NOT TOUCH

| File | Line | What It Is |
|------|------|------------|
| `app/error.tsx` | 36 | Error message styling |
| `app/global-error.tsx` | 37 | Error message styling |
| `app/(dashboard)/jobs/[id]/error.tsx` | 30 | Error message styling |
| `app/(dashboard)/requests/[id]/error.tsx` | 30 | Error message styling |
| `app/(dashboard)/inventory/[id]/error.tsx` | 30 | Error message styling |
| `app/(dashboard)/maintenance/templates/[id]/error.tsx` | 30 | Error message styling |
| `app/(dashboard)/maintenance/schedules/[id]/error.tsx` | 30 | Error message styling |
| `app/(dashboard)/error.tsx` | 36 | Error message styling |
| `components/data-table/data-table-toolbar.tsx` | 211 | "DEACTIVATE" confirmation text |
| `components/delete-confirm-dialog.tsx` | 89 | Entity name confirmation text |
| `components/audit-trail/audit-trail-columns.tsx` | 88 | Timestamp formatting (date, not display_id) |
| `components/display-id.tsx` | 4 | The component itself |

## Common Pitfalls

### Pitfall 1: Heading elements with font-mono
**What goes wrong:** Moving font-mono off an `<h1>`/`<h2>` onto an inner `<DisplayId>` span should preserve visual appearance since `font-mono` inherits to text content. But verify that `tracking-tight` on the heading still looks correct with `font-mono` on the inner span instead.
**How to avoid:** The `font-mono` on the inner span will override font-family for text. `tracking-tight` (letter-spacing) on the heading will still apply to the span since letter-spacing inherits. Visual output should be identical.

### Pitfall 2: Link elements
**What goes wrong:** Replacing the entire `<Link>` className would break hover/navigation styling.
**How to avoid:** Keep the Link element with its non-font classes; wrap the text content inside a `<DisplayId>` span.

### Pitfall 3: String interpolation contexts
**What goes wrong:** Some display_id usages are in string concatenation (e.g., `schedule-detail.tsx` line 152 in an Input value prop, `request-triage-dialog.tsx` line 122 in a template literal).
**How to avoid:** Input value props cannot use JSX -- skip those. For template literals in JSX, convert to JSX with fragment.

### Pitfall 4: Import additions
**What goes wrong:** Forgetting to add the import statement.
**How to avoid:** Every file in Category A and B needs `import { DisplayId } from '@/components/display-id';` unless it already imports it (check Category C overlap -- `job-form.tsx` already imports it).

## Files Needing Import Addition

Files that need `import { DisplayId } from '@/components/display-id';` added:

1. `app/(dashboard)/jobs/[id]/page.tsx`
2. `app/(dashboard)/requests/[id]/page.tsx`
3. `components/assets/asset-view-modal.tsx`
4. `components/assets/asset-detail-client.tsx`
5. `components/requests/request-view-modal.tsx`
6. `components/jobs/job-modal.tsx`
7. `components/approvals/approval-queue.tsx`
8. `components/jobs/job-detail-info.tsx`
9. `components/jobs/job-preview-dialog.tsx`
10. `components/jobs/request-preview-dialog.tsx`
11. `components/requests/request-detail-info.tsx`
12. `components/audit-trail/audit-trail-columns.tsx`
13. `components/requests/request-triage-dialog.tsx`
14. `components/maintenance/pm-checklist-preview.tsx`

**Already have import (no addition needed):**
- `components/jobs/job-form.tsx` (already imports DisplayId at line 30)
- `components/maintenance/schedule-view-modal.tsx` (already imports DisplayId at line 26)

## Summary Counts

| Category | Count | Action |
|----------|-------|--------|
| A: Inline font-mono for display_id | 16 | Replace with DisplayId |
| B: display_id without font-mono | 2 (1 skipped) | Add DisplayId |
| C: Already uses DisplayId | 10 | No change |
| D: font-mono not for display_id | 12 | Do not touch |

**Total files to modify:** 16 (14 need import addition, 2 already have it)
**Total edits:** 18 (16 replacements + 2 additions)

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all .tsx files via grep for `font-mono`, `display_id`, and `DisplayId`
- Read of `components/display-id.tsx` for component API
