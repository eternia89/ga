# Phase 7: Preventive Maintenance - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

GA Leads define maintenance templates with flexible checklists (6 field types), assign them to assets on configurable schedules with fixed or floating intervals, and the system auto-generates PM jobs via daily cron when maintenance is due. Schedules auto-pause when assets break and auto-resume when repaired. Depends on Phase 5 (Jobs) and Phase 6 (Inventory).

</domain>

<decisions>
## Implementation Decisions

### Template builder UX
- Type-specific "Add" buttons for each field type: + Checkbox, + Pass/Fail, + Numeric, + Text, + Photo, + Dropdown
- Drag-and-drop reordering of checklist items
- Dropdown options configured via add/remove chips UX
- Numeric fields: free numeric input, no min/max range validation
- All checklist items are required when filling out a PM job (no per-item required toggle)
- Template has required name + optional description
- Template linked to a category via dropdown on creation (shared categories from admin)
- Templates can be edited freely; future auto-generated PM jobs use the latest version; completed jobs keep their original checklist
- Templates can be deactivated but not deleted; prevents orphaned schedules

### Template management
- Lives under a new top-level "Maintenance" nav section (with sub-items: Templates, Schedules)
- Template list shows: name, category, item count, created date — click to see full details
- GA Lead only can create/edit/deactivate templates

### Schedule configuration
- Both entry points: create schedule from template detail page OR from asset detail page
- Schedule form: select template (filtered by category), select asset (filtered by category), set interval in days, toggle fixed/floating (default: floating), optional start date
- Inline help text on toggle: Fixed = every N days from start date; Floating = N days after last completion
- GA Lead can manually activate/deactivate schedules (independent of asset status auto-pause)
- Schedules can be soft-deleted; historical PM jobs generated from it remain
- No default PIC on schedule — GA Lead assigns each auto-generated PM job manually
- Schedule shows next due date and last completed date (both visible on list and detail)

### Schedule list page
- Dedicated page under "Maintenance" nav section
- Columns: template name, asset name, interval (days), type (fixed/floating), status (Active/Paused/Deactivated), next due date
- Asset detail page also shows a "Maintenance Schedules" section listing linked schedules

### Auto-generated PM jobs
- PM jobs have a "PM" type badge/tag in the job list and on the job detail page
- Auto-generated title format: "[Template Name] - [Asset Name]"
- Jobs created without an assignee — GA Lead assigns PIC manually
- Checklist appears inline on the PM job detail page; PIC fills it out item by item with save-as-you-go
- Deduplication: cron skips generation if previous PM job from same schedule is still open
- Overdue PM jobs: red "Overdue" badge on the job list and job detail page header

### Pause/resume behavior
- **Auto-pause on Broken/Under Repair:** schedules auto-pause; inline message shown after status change ("N maintenance schedule(s) have been auto-paused")
- **Auto-resume on Active:** schedules auto-resume when asset returns to Active; inline message shown ("N schedule(s) resumed")
- **Resume calculation:** next due date = resume date + interval (fresh start, time during pause does not count)
- **Sold/Disposed (terminal):** schedules are permanently deactivated (not just paused), since asset can never return to Active
- **Open PM jobs on pause:** open PM jobs (Assigned or In Progress) for paused schedules are automatically cancelled
- **Schedule status display:** Active, Paused (auto), Paused (manual), Deactivated — distinguishes auto vs manual pause

### Claude's Discretion
- Template builder component implementation and styling
- Drag-and-drop library choice
- Cron job implementation details (Supabase pg_cron, edge function, etc.)
- Checklist completion progress indicator design
- Overdue calculation logic (when exactly a PM becomes "overdue")
- Schedule form layout and validation

</decisions>

<specifics>
## Specific Ideas

- "Maintenance" section is a new top-level nav item, not nested under admin — it's an operational feature used daily, not configuration
- Checklist items saved inline on PM job detail means PIC can partially complete and come back later
- Schedule status has 4 distinct states to give GA Lead full visibility into why a schedule isn't generating jobs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-preventive-maintenance*
*Context gathered: 2026-02-24*
