# UI Improvements Backlog

Captured from UAT session 2026-02-26. Execute as a phase when ready.

## Items

### 1. CTA button position on list pages
Move "New Request" / "New Job" button to the right of the page title, making the header more compact.

### 2. Request list — compact columns, remove category
Make columns more compact to reduce clutter. Remove the Category column entirely.

### 3. Default rows per page = 50, options: 100, 200
All data tables: default pagination to 50 rows. Dropdown options should be 50, 100, 200 (not 10/20/50).

### 4. Excel export — human-readable names, no raw IDs
Export should use location name, category name, requester name, etc. instead of UUIDs. Presentation must be understandable by non-technical users.

### 5. Row-level actions — small ghost buttons, no context menu
All list pages: replace the three-dot context menu with directly visible small ghost icon buttons for actions.

### 6. Status column beside ID in all list pages
Move status badge directly next to the ID column (same cell or adjacent) on both request and job list pages to save horizontal space.

### 7. Linked requests in job list — vertical stacking
Display linked request chips vertically stacked instead of truncating with ellipsis "+x more".

### 8. Users list cleanup
- Remove thumbnail/avatar picture column
- Last login: show date only (no time)
- Email: display below name in smaller muted text to save a column

### 9. User detail permalink with modal
Support URL pattern: `/admin/settings?tab=users&userid=xxx` that auto-opens the user detail/edit modal on page load.

### 10. Jobs list — date range picker
Replace two separate date pickers (start/end) with a single date range picker component.
