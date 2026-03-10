# Quick Task 25: Fix RLS policy error when deactivating maintenance schedule - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Fix "new row violates row-level security policy for table maintenance_schedules" error when deactivating a schedule. The RLS UPDATE policy's WITH CHECK fails because current_user_company_id() doesn't match during the update operation via authActionClient.

</domain>

<decisions>
## Implementation Decisions

### Fix approach
- Create a new `gaLeadActionClient` that allows both `ga_lead` and `admin` roles and provides `adminSupabase` to bypass RLS. Use this for schedule mutation actions. Do NOT widen the existing `adminActionClient` (which would grant ga_lead access to all admin-only settings/config actions).

### Scope of fix
- Audit and fix ALL schedule mutation actions (deactivate, reactivate, delete, restore) — not just deactivate. Any that use `authActionClient` for admin-only mutations should be switched to `adminActionClient`.

### Claude's Discretion
- None — all areas discussed.

</decisions>

<specifics>
## Specific Ideas

- File: `app/actions/schedule-actions.ts`
- Change `authActionClient` to `adminActionClient` for deactivate, reactivate, delete, restore actions
- Keep `authActionClient` for read operations (getSchedules, getScheduleById) and create/update if they work
- Remove manual role checks that are redundant with adminActionClient (which already enforces admin/ga_lead)

</specifics>
