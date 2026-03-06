# Quick Task 17: Unify asset detail page to match new asset form structure - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Unify the asset detail page layout to match the simplified new asset form structure. The detail page has a right sidebar with the activity timeline, while the create form (in a modal) does not.

Key files:
- `components/assets/asset-detail-client.tsx` — two-column grid layout (left: info+actions, right: timeline)
- `components/assets/asset-detail-info.tsx` — header (display ID + status) + edit form or read-only view
- `components/assets/asset-edit-form.tsx` — edit form with card-wrapped sections and multi-column grids

</domain>

<decisions>
## Implementation Decisions

### Edit Form Flattening
- YES: Flatten asset-edit-form.tsx to match the simplified submit form
- Remove card wrappers (`rounded-lg border p-6`) from all sections
- Flatten all multi-column grids to single column (1 field per row)
- Keep subtitles (uppercase muted text-sm) + Separator pattern

### Header Placement
- Move display ID + status badge to page-level header ABOVE the two-column grid
- Same pattern as request/job detail pages
- Header sits outside the grid, is full-width
- The two-column grid below contains: left = form fields, right = timeline

### Read-Only View
- NO change: Keep the flat dl/dd list as-is for non-edit users
- Only the header moves out (benefits both views)

### Timeline Sidebar
- Remains in right column (`grid-cols-[1fr_380px]`) with card wrapper (`rounded-lg border p-4`)
- No changes to timeline component or its container

</decisions>

<specifics>
## Specific Ideas

Current structure:
```
AssetDetailClient (grid [1fr_380px])
  ├── Left: AssetDetailInfo (card with header + edit form OR read-only view)
  │         └── AssetEditForm (card-wrapped sections)
  └── Right: Timeline (card)
```

Target structure:
```
Page header: display_id + status badge (full-width, above grid)
AssetDetailClient (grid [1fr_380px])
  ├── Left: AssetEditForm (flat sections, no cards) OR read-only dl list
  │         + AssetDetailActions
  └── Right: Timeline (card — unchanged)
```

</specifics>
