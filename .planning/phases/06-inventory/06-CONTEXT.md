# Phase 6: Inventory - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

GA Staff manage a complete asset registry with auto-generated AST-YYYY-NNNN IDs, tracked movements between locations with receiver confirmation, a status lifecycle with condition photo documentation, and warranty/invoice tracking. Preventive maintenance schedules (Phase 7) integrate via the auto-pause trigger when assets are marked broken or sold.

</domain>

<decisions>
## Implementation Decisions

### Asset form & fields
- **Required fields on creation:** name, category (shared categories from admin), location, status (defaults to Active)
- **Structured optional fields:** brand, model, serial number
- **Other optional fields:** description/notes, acquisition date, warranty expiry date (single date field only)
- **Condition photos:** required on creation, minimum 1, maximum 5
- **Invoice upload:** multiple files allowed (up to 5), accepts PDF, JPG, PNG
- **Duplicate names allowed** — assets distinguished by unique AST-YYYY-NNNN ID
- **Permissions:** GA Staff + GA Lead can create and edit assets
- **No deletion:** Sold/Disposed is the terminal state; assets remain in the system for historical records

### Status lifecycle
- **Statuses:** Active, Under Repair, Broken, Sold/Disposed
- **Transitions:** free transitions between Active, Under Repair, and Broken; Sold/Disposed is terminal and irreversible
- **Status change dialog:** clickable status badge on detail page opens dialog
- **Condition photos required on every status change** — minimum 1, up to 5
- **Status change note:** optional text reason
- **No GPS capture** on status changes (location is tracked as an asset field)

### Movement & transfers
- **Initiator:** any GA Staff or GA Lead can initiate a transfer for any asset
- **Receiver:** initiator selects a specific GA Staff/Lead as the receiver; that person must accept
- **Condition photos required on both sides:** sender uploads photos on initiation, receiver uploads photos on acceptance
- **In Transit indicator:** asset shows "In Transit" with origin, destination, and receiver while transfer is pending; asset cannot be transferred again until current transfer resolves
- **Receiver can reject** with required reason and photos — rejection immediately clears "In Transit" state, asset returns to origin
- **Initiator can cancel** a pending transfer — asset goes back to normal at origin
- **Transferable statuses:** any non-terminal status (Active, Under Repair, Broken) can be transferred
- **Incoming transfers:** no separate page; receivers see pending transfers via asset list filter/badge

### Asset list page
- Same data table pattern as requests and jobs (columns, filters, sorting)
- Columns: ID, name, category, location, status, warranty expiry

### Asset detail page
- Same pattern as request/job detail: full info panel at top + unified timeline below
- Info panel shows all asset fields, condition photos, warranty info, invoices
- Unified chronological timeline mixing status changes, transfers, and condition photos
- Timeline entries show thumbnail photos, clickable to open lightbox
- Warranty expiry shown as simple text (no color-coded indicators)
- "Transfer" action as a dedicated button on the detail page (not in a dropdown)
- Status change via clickable status badge

### Claude's Discretion
- Asset form layout and field ordering
- Filter options on asset list (status, category, location filters)
- Timeline event styling and icons
- Transfer dialog layout
- Invoice viewer/preview implementation
- "In Transit" badge design and placement

</decisions>

<specifics>
## Specific Ideas

- Unified timeline pattern should be consistent with request and job detail pages from Phases 4 and 5
- Condition photo documentation at every significant event (creation, status change, transfer initiation, transfer acceptance) creates a visual audit trail
- "In Transit" is a transient indicator, not a status — it overlays the current status

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-inventory*
*Context gathered: 2026-02-24*
