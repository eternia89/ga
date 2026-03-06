---
phase: quick-17
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-detail-client.tsx
  - components/assets/asset-detail-info.tsx
  - components/assets/asset-edit-form.tsx
autonomous: true
requirements: [QUICK-17]

must_haves:
  truths:
    - "Asset detail page shows display_id and status badge as page-level header above the two-column grid"
    - "In-transit transfer banner appears below the header, above the grid"
    - "Edit form fields are flat single-column layout with subtitle+separator pattern (no card wrappers)"
    - "Read-only view shows flat dl list without card wrapper"
    - "Timeline sidebar remains unchanged in right column with card wrapper"
  artifacts:
    - path: "components/assets/asset-detail-client.tsx"
      provides: "Page-level header with display_id + status badge + transfer banner above grid"
      contains: "text-2xl font-bold"
    - path: "components/assets/asset-detail-info.tsx"
      provides: "Content only (no header, no card wrapper) for both edit and read-only branches"
    - path: "components/assets/asset-edit-form.tsx"
      provides: "Flat form layout without card wrappers, single-column fields"
  key_links:
    - from: "components/assets/asset-detail-client.tsx"
      to: "components/assets/asset-detail-info.tsx"
      via: "status badge click handler still wired"
      pattern: "onStatusBadgeClick"
    - from: "components/assets/asset-detail-info.tsx"
      to: "components/assets/asset-edit-form.tsx"
      via: "renders edit form when canEdit"
      pattern: "AssetEditForm"
---

<objective>
Unify the asset detail page layout to match the request/job detail page pattern and the simplified new asset form structure.

Purpose: Consistent page-level header pattern across all detail pages (request, job, asset) and flat form layout matching the already-simplified asset submit form.
Output: Three modified component files with unified layout structure.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/quick/17-unify-asset-detail-page-to-match-new-ass/17-CONTEXT.md
@components/assets/asset-detail-client.tsx
@components/assets/asset-detail-info.tsx
@components/assets/asset-edit-form.tsx

<interfaces>
<!-- Reference: request detail page header pattern (from app/(dashboard)/requests/[id]/page.tsx) -->
```tsx
{/* Header */}
<div className="space-y-2">
  <div className="flex flex-wrap items-center gap-3">
    <h1 className="text-2xl font-bold tracking-tight font-mono">
      {req.display_id}
    </h1>
    <RequestStatusBadge status={req.status} />
  </div>
</div>
```

<!-- AssetDetailInfo current props that relate to header (will be removed from this component) -->
```tsx
onStatusBadgeClick: () => void;
showStatusDialog: boolean;
onStatusDialogChange: (open: boolean) => void;
onStatusSuccess: () => void;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move header to asset-detail-client.tsx and flatten asset-detail-info.tsx</name>
  <files>components/assets/asset-detail-client.tsx, components/assets/asset-detail-info.tsx</files>
  <action>
**asset-detail-client.tsx:**
1. Add imports: `AssetStatusBadge` from `./asset-status-badge`, `AssetStatusChangeDialog` from `./asset-status-change-dialog`, `Truck` from `lucide-react`, `format` from `date-fns`, `ASSET_STATUS_TRANSITIONS` and `AssetStatus` from `@/lib/constants/asset-status`.
2. Add the header block ABOVE the `grid` div, inside the existing `space-y-6 py-6` wrapper from page.tsx (so add a wrapping fragment or div). The header structure:
   - `<div className="space-y-2">` wrapper
   - `<div className="flex flex-wrap items-center gap-3">` with:
     - `<h1 className="text-2xl font-bold tracking-tight font-mono">{asset.display_id}</h1>`
     - Status badge button (same logic currently in asset-detail-info.tsx: canChangeStatus, allowedTransitions, isStatusClickable checks)
   - Below that, the in-transit transfer banner (the blue `rounded-md border border-blue-200 bg-blue-50` div), conditionally rendered when `pendingTransfer` exists
3. Move `AssetStatusChangeDialog` render here (it was in asset-detail-info.tsx in both branches).
4. Remove `onStatusBadgeClick`, `showStatusDialog`, `onStatusDialogChange`, `onStatusSuccess` from AssetDetailInfoProps passed down -- these are now handled in this component directly.

**asset-detail-info.tsx:**
1. Remove the header block (display_id h1 + status badge button + transfer banner) from BOTH branches (canEdit and read-only).
2. Remove the outer `<div className="rounded-lg border p-6 space-y-6">` card wrapper from BOTH branches. The content should render directly without a card container.
3. In the canEdit branch: remove the card wrapper div that contains only the header (lines 85-126), and just render `<AssetEditForm>` directly (it already has its own structure).
4. In the read-only branch: remove the card wrapper `<div className="rounded-lg border p-6 space-y-6">` and just render `<dl>`, condition photos, and invoices sections directly in a `<div className="space-y-6">` (or fragment).
5. Remove `AssetStatusChangeDialog` from both branches (moved to parent).
6. Remove unused imports: `AssetStatusBadge`, `AssetStatusChangeDialog`, `Truck`, `ASSET_STATUS_TRANSITIONS`, `AssetStatus`, `format` (if no longer used in this file).
7. Remove props from interface: `onStatusBadgeClick`, `showStatusDialog`, `onStatusDialogChange`, `onStatusSuccess`.
8. Keep `pendingTransfer` prop only if still needed for the edit form (it is NOT -- the transfer banner moved to parent). Remove it from props if no longer referenced.

Note: The canChangeStatus / isStatusClickable logic moves to asset-detail-client.tsx. Keep canEdit logic in asset-detail-info.tsx since it determines which branch to render.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Header (display_id + status badge + transfer banner) renders above the two-column grid in asset-detail-client.tsx. asset-detail-info.tsx renders content without header or card wrapper. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Flatten asset-edit-form.tsx to single-column layout without card wrappers</name>
  <files>components/assets/asset-edit-form.tsx</files>
  <action>
Remove card wrappers and flatten multi-column grids to match the simplified asset submit form pattern:

1. **Remove card wrappers:** Replace all three `<div className="rounded-lg border p-6 space-y-4">` sections (Asset Details, Condition Photos, Invoice Files) with plain content. Keep the subtitle (`<h2>` with uppercase muted text) + `<Separator />` pattern between sections.

2. **Flatten grids to single column:**
   - Line 266: `grid grid-cols-2 gap-4 max-md:grid-cols-1` (category + location) -> remove the grid wrapper, render each FormField as a standalone item in the vertical flow.
   - Line 316: `grid grid-cols-3 gap-4 max-md:grid-cols-1` (brand + model + serial) -> remove the grid wrapper, render each FormField standalone.
   - Line 375: `grid grid-cols-2 gap-4 max-md:grid-cols-1` (acquisition date + warranty) -> remove the grid wrapper, render each FormField standalone.

3. **Keep:** The form element's `className="space-y-6"`, all FormField components, all state management, all submit logic, the feedback and save button at the bottom.

4. The resulting structure should be:
   ```
   <form className="space-y-6">
     <h2>Asset Details</h2>
     <Separator />
     <FormField name /> (single column)
     <FormField category_id />
     <FormField location_id />
     <FormField brand />
     <FormField model />
     <FormField serial_number />
     <FormField acquisition_date />
     <FormField warranty_expiry />
     <FormField description />

     <h2>Condition Photos</h2>
     <Separator />
     <PhotoUpload />

     <h2>Invoice Files</h2>
     <Separator />
     [invoice list + add button]

     <InlineFeedback />
     <Button>Save Changes</Button>
   </form>
   ```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Edit form renders as flat single-column layout with subtitle+separator pattern, no card wrappers, no multi-column grids. Build succeeds with no errors.</done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- Asset detail page renders with header above the two-column grid
- Edit form shows flat single-column fields (no card wrappers)
- Read-only view shows flat dl list (no card wrapper)
- Timeline sidebar unchanged in right column with card wrapper
- Status badge click still opens status change dialog
- Transfer banner still shows when asset has pending transfer
</verification>

<success_criteria>
- Asset detail page layout matches request/job detail page pattern (page-level header above content grid)
- Edit form layout matches the already-simplified asset submit form (flat, single column, subtitle+separator)
- All interactive functionality preserved (status change, edit form, transfer actions)
- No TypeScript or build errors
</success_criteria>

<output>
After completion, create `.planning/quick/17-unify-asset-detail-page-to-match-new-ass/17-SUMMARY.md`
</output>
