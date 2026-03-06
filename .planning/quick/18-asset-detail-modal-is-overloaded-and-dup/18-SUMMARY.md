# Quick Task 18: Asset Detail Modal Cleanup — Summary

**Plan:** 18-01
**Status:** Complete
**Commits:** 57a5434, 0bf54ff

## What Changed

### Task 1: Collapse submit form from 6 sections to 2 (57a5434)
- **asset-submit-form.tsx**: Collapsed 6 sections (Basic Info, Identification, Dates, Description, Condition Photos, Invoice Files) into 2 sections (Asset Details, Attachments)
- Removed intermediate section headers and card wrapper divs
- All fields preserved, just regrouped under 2 subtitle + separator patterns

### Task 2: Remove duplicated fields from edit/read-only view (0bf54ff)
- **asset-edit-form.tsx**: Removed name, category_id, location_id FormField renders (header already shows them). Collapsed 3 sections into 2 (Asset Details, Attachments). Kept defaultValues so form submission still works.
- **asset-detail-info.tsx**: Removed Name, Category, Location from read-only `<dl>`. Merged Condition Photos and Invoices under single "Attachments" heading.

## Verification
- TypeScript: Clean (only pre-existing e2e error)
- Lint: No new errors
