---
phase: quick-18
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-submit-form.tsx
  - components/assets/asset-edit-form.tsx
  - components/assets/asset-detail-info.tsx
autonomous: true
requirements: [QUICK-18]

must_haves:
  truths:
    - "New asset form has exactly 2 sections: Asset Details and Attachments"
    - "Edit form has exactly 2 sections: Asset Details and Attachments"
    - "Read-only view does not show name, category, or location fields"
    - "Edit form does not show name, category, or location fields"
    - "New asset form starts with name/category/location but sections are collapsed from 6 to 2"
    - "No Card wrapper divs exist — only subtitle + Separator pattern"
  artifacts:
    - path: "components/assets/asset-submit-form.tsx"
      provides: "New asset form with 2 sections"
      contains: "Attachments"
    - path: "components/assets/asset-edit-form.tsx"
      provides: "Edit form without name/category/location, 2 sections"
      contains: "Attachments"
    - path: "components/assets/asset-detail-info.tsx"
      provides: "Read-only view without name/category/location"
  key_links:
    - from: "components/assets/asset-view-modal.tsx"
      to: "components/assets/asset-detail-info.tsx"
      via: "AssetDetailInfo component"
      pattern: "AssetDetailInfo"
    - from: "components/assets/asset-detail-info.tsx"
      to: "components/assets/asset-edit-form.tsx"
      via: "renders AssetEditForm for editable users"
      pattern: "AssetEditForm"
---

<objective>
Remove duplicated information from asset forms and read-only view, and collapse section groupings to 2 groups (Asset Details + Attachments) with subtitle separators only.

Purpose: Modal header already shows name/category/location/date — repeating them in the form body wastes vertical space and creates visual noise.
Output: Cleaned up asset-submit-form.tsx, asset-edit-form.tsx, asset-detail-info.tsx
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-submit-form.tsx
@components/assets/asset-edit-form.tsx
@components/assets/asset-detail-info.tsx
@components/assets/asset-view-modal.tsx

Modal header already shows: `{name} · {category} · {location} · Created {date}` (line 446-450 of asset-view-modal.tsx).

Asset detail page header shows display_id + status badge; AssetDetailInfo handles the fields below it. The detail page also gets name/category/location from the page-level header context, so removing from the info component is safe.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Collapse submit form from 6 sections to 2</name>
  <files>components/assets/asset-submit-form.tsx</files>
  <action>
Restructure asset-submit-form.tsx from 6 sections (Basic Info, Identification, Dates, Description, Condition Photos, Invoice Files) to 2 sections:

**Section 1: "Asset Details"** — subtitle h2 + Separator, then ALL text/select fields in a flat list (no sub-groupings):
- Name (required) — keep, this is the create form so user must enter it
- Category (required) — keep, same reason
- Location (required) — keep, same reason
- Brand
- Model
- Serial Number
- Acquisition Date (required)
- Warranty Expiry
- Description

**Section 2: "Attachments"** — subtitle h2 + Separator, then condition photos and invoice files together in one section:
- Condition Photos (required) — PhotoUpload with helper text
- Invoice Files (optional) — file list with helper text

Remove all intermediate section headers (Identification, Dates, Description). Keep the same subtitle styling pattern: `text-sm font-semibold text-muted-foreground uppercase tracking-wide`. No card wrappers — just `space-y-4` for field grouping within each section.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Submit form has exactly 2 section headers (Asset Details, Attachments), all fields present, no card wrappers, TypeScript compiles clean</done>
</task>

<task type="auto">
  <name>Task 2: Remove duplicated fields from edit form and read-only view, collapse to 2 sections</name>
  <files>components/assets/asset-edit-form.tsx, components/assets/asset-detail-info.tsx</files>
  <action>
**asset-edit-form.tsx:**
1. Remove the name, category_id, and location_id FormField blocks entirely — these are already shown in the modal header subtitle. The edit form should start at Brand field.
2. Keep defaultValues for name/category_id/location_id in useForm (they are still needed for the form data shape and submission) but do NOT render their form fields.
3. Rename the current "Asset Details" section to keep it as "Asset Details" — it now contains: Brand, Model, Serial Number, Acquisition Date, Warranty Expiry, Description.
4. Merge "Condition Photos" and "Invoice Files" sections into a single "Attachments" section — one subtitle h2 + Separator, then photos block, then invoices block (keep a small gap between them, e.g. `mt-4` on the invoice sub-section).
5. Remove any Card wrapper divs if present. Keep only subtitle + Separator pattern.

**asset-detail-info.tsx (read-only view for non-editable users):**
1. Remove the Name, Category, and Location `<div>` blocks from the `<dl>` — these are already in the modal header subtitle.
2. The dl should start at Brand (conditionally rendered).
3. Merge "Condition Photos" and "Invoices" under a single "Attachments" section header — one `h3` with "Attachments" text, then photos, then invoices below.
4. Keep all conditional rendering logic (only show brand/model/serial if present).

IMPORTANT: Do NOT remove name/category_id/location_id from the Zod schema or form default values — only remove the visible FormField renders. The edit action still needs these fields submitted.

Actually, re-check: the updateAsset action receives the full AssetEditFormData. Since we are hiding name/category/location fields from the UI, the form will still submit the original default values (unchanged). This is fine — the values pass through unchanged. No schema changes needed.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Edit form shows only Brand through Description (no name/category/location fields visible), read-only view also omits name/category/location. Both have 2 sections: Asset Details + Attachments. TypeScript compiles clean.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — no TypeScript errors
2. `npm run lint` — no lint errors
3. Visual check: open asset modal — header shows name/category/location, form body does NOT repeat them
4. Visual check: new asset modal — form has 2 sections (Asset Details, Attachments)
</verification>

<success_criteria>
- All 3 files updated with 2-section layout (Asset Details + Attachments)
- Edit form and read-only view no longer show name, category, location fields
- Submit form keeps name/category/location (user needs to enter them for new assets) but collapsed into single section
- No Card wrapper divs — only subtitle + Separator separators
- TypeScript and lint pass clean
</success_criteria>

<output>
After completion, create `.planning/quick/18-asset-detail-modal-is-overloaded-and-dup/18-SUMMARY.md`
</output>
