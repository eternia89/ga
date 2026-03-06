# Quick Task 18: Asset detail modal cleanup - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Asset detail modal is overloaded and duplicated with information. Remove duplication, and let the card grouping be removed, using only subtitle as the separator (applies to both new asset and asset detail modal).

</domain>

<decisions>
## Implementation Decisions

### Duplicated Fields
- Remove name, category, location from the edit form AND read-only view — header subtitle already shows them
- Edit form starts at Brand/Model/Serial Number instead
- Applies to both asset-edit-form.tsx and asset-detail-info.tsx read-only view

### Section Grouping
- Collapse to 2 groups with subtitle separators: "Asset Details" (all text fields) and "Attachments" (photos + invoices together)
- Remove card wrapper divs, keep only subtitle + separator pattern
- Applies to both asset-submit-form.tsx (new asset) and asset-edit-form.tsx (edit)

### Read-only View
- Read-only view (asset-detail-info.tsx for non-editable users) also drops name/category/location to match edit view

</decisions>

<specifics>
## Specific Ideas

- Modal header already shows: `{name} · {category} · {location} · Created {date}`
- Asset detail page header shows display_id + status badge (no subtitle duplication concern there since AssetDetailInfo handles fields)
- Current submit form has 6 sections: Basic Info, Identification, Dates, Description, Condition Photos, Invoice Files — collapse to 2
- Current edit form has 3 sections: Asset Details, Condition Photos, Invoice Files — collapse to 2

</specifics>
