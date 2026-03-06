# Quick Task 16: Simplify new asset modal form layout - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Simplify the asset create form (AssetSubmitForm) layout:
- Remove card-like wrapping (rounded-lg border p-6) from each section
- Keep section subtitles as text-sm muted uppercase with thin Separator line below
- Change all multi-column grids to single column (1 field per row)

</domain>

<decisions>
## Implementation Decisions

### Scope
- Asset form only (AssetSubmitForm in components/assets/asset-submit-form.tsx)
- Do NOT change request or job create forms

### Subtitle Style
- Keep current style: `text-sm font-semibold text-muted-foreground uppercase tracking-wide`
- Keep `<Separator />` below the subtitle
- Remove the card wrapper (`rounded-lg border border-border p-6`)
- Use vertical spacing between sections instead (space-y-6 on the form, with section dividers)

### Layout
- All fields single column (1 field per row)
- Remove `grid grid-cols-2` and `grid grid-cols-3` wrappers
- Each field stacks vertically

</decisions>

<specifics>
## Specific Ideas

Current pattern to remove from each of the 6 sections:
```tsx
<div className="rounded-lg border border-border p-6 space-y-4">
```
Replace with plain `<div className="space-y-4">` or similar

Multi-column grids to flatten:
- Section 1: `grid grid-cols-2 gap-4` (category + location)
- Section 2: `grid grid-cols-3 gap-4` (brand + model + serial)
- Section 3: `grid grid-cols-2 gap-4` (acquisition date + warranty expiry)

</specifics>
