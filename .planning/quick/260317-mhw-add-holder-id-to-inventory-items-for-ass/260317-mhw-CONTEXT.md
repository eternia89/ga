# Quick Task 260317-mhw: Add holder_id — Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Task Boundary

Add holder_id column to inventory_items to track who physically holds an asset. Replace the current location-based general user filter with holder-based filtering.

</domain>

<decisions>
## Implementation Decisions

### Initial holder assignment
- holder_id starts as NULL when asset is created
- Only set when someone accepts a transfer (receiver becomes holder)
- No holder field on the create form

### Holder display in UI
- **Table:** Show holder name under location (replacing the current receiver name pattern). Same small muted text style.
- **Detail page / View modal:** Show as a card section: "Current Holder" with name, division, location
- When asset has no holder (NULL), show "—" or "Unassigned"
- When in transit, show the pending receiver name (existing pattern), not the current holder

### Create form
- No holder field — holder is only set via transfer acceptance

### Claude's Discretion
- Migration number and naming
- Whether to join holder profile in the main asset query or fetch separately

</decisions>

<specifics>
## Specific Ideas

- Holder replaces receiver_name under location in table (receiver was a proxy for holder anyway)
- Detail card should show: holder full_name, division name, location name
- General user filter: `holder_id.eq.{userId}` OR `id.in.(pendingTransferIds)`

</specifics>
