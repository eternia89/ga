# Quick Task 13: Convert CTA create buttons to modal dialogs - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Convert all CTA "New X" buttons from page navigation to modal dialogs. Applies to: Jobs, Requests, Assets, Templates, Schedules. Follow the same pattern as admin settings (EntityFormDialog) where the form opens in a dialog.

</domain>

<decisions>
## Implementation Decisions

### Complex Forms
- ALL forms become modals, including complex ones (Requests with photos, Assets with photos+invoices)
- Use large scrollable dialogs for complex forms
- Maximum consistency across the app

### Post-Create Behavior
- Close dialog + refresh table (router.refresh)
- Do NOT open view modal after creation

### Form Reuse Approach
- Use same method as edit popup / admin EntityFormDialog pattern
- Existing form components should be adapted to work inside Dialog wrappers
- Change success behavior from router.push to onSuccess callback
- Reuse existing Zod schemas and server actions

### Approvals
- No CTA on approvals page — no changes needed

</decisions>

<specifics>
## Specific Ideas

- 5 pages affected: Jobs, Requests, Assets/Inventory, Maintenance Templates, Maintenance Schedules
- Each page's CTA button changes from `<Link href="/entity/new">` to a button that opens dialog state
- Existing form components (JobForm, RequestSubmitForm, AssetSubmitForm, TemplateCreateForm, ScheduleCreateForm) adapted to accept onSuccess callback instead of using router.push
- Reference pattern: admin settings company-table.tsx + company-form-dialog.tsx

</specifics>
