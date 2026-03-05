# Quick Task 12: Strip admin settings table rows to View-only action pattern - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Task Boundary

Strip admin settings table rows (Users, Companies, Divisions, Locations, Categories) to show only a single "Edit" action button. Move Deactivate/Reactivate into the FormDialog footer when editing.

</domain>

<decisions>
## Implementation Decisions

### Row Action
- Single "Edit" button in admin table rows (not "View" — these use FormDialog, not ViewModal)
- Remove Deactivate/Reactivate buttons from table rows

### Deactivate/Reactivate Location
- Move into FormDialog footer as a secondary action when in edit mode
- Users: integrate into UserFormDialog edit mode
- Other entities: integrate into their respective FormDialogs (CompanyFormDialog, DivisionFormDialog, LocationFormDialog, CategoryFormDialog)

### Audit Trail
- No changes — it's a log viewer, not an entity table

### Claude's Discretion
- Exact placement and styling of Deactivate/Reactivate within FormDialogs

</decisions>

<specifics>
## Specific Ideas

- 5 admin tables affected: Users, Companies, Divisions, Locations, Categories
- Each has a *-columns.tsx file with Edit + Deactivate/Reactivate actions
- Each has a *-form-dialog.tsx that currently handles create/edit only
- Deactivate uses DeactivateConfirmDialog (or UserDeactivateDialog for users)
- The confirmation dialog should still appear when clicking Deactivate inside the FormDialog

</specifics>
