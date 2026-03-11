# Quick Task 49: Fix company-based data isolation — Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Task Boundary

Fix three interconnected issues in the company-based data isolation system:
1. `user_company_access` table missing from schema cache — PostgREST cannot find it
2. Seed/mock data not propagating company_id correctly across domain tables
3. RLS SELECT policy only uses primary company (JWT) — GA staff with additional company access cannot query those companies' data

GA staff should only see data from their primary company by default. Additional company access (via `user_company_access`) must unlock both creating AND reading data for that company.

</domain>

<decisions>
## Implementation Decisions

### RLS SELECT fix
- **Update RLS policies** on requests, jobs, and inventory_items to also JOIN/check `user_company_access`
- True DB-level isolation: SELECT returns rows where `company_id = current_user_company_id() OR EXISTS (SELECT 1 FROM user_company_access WHERE user_id = auth.uid() AND company_id = <row>.company_id)`

### Schema cache error fix
- **Audit + fix both**: First investigate migration history to confirm `00018_user_company_access.sql` is present and ordered correctly in the merged branch
- Then apply fix: either add a NOTIFY migration or confirm missing migration is the root cause

### Seed data scope
- **User profiles**: All seeded GA Staff users must have `company_id`, `division_id`, `role` in `raw_app_meta_data`
- **Requests / Jobs / Assets**: All seeded domain records must have correct `company_id` matching their owning company (not all using the same company)
- **user_company_access rows**: Add seed rows granting at least one GA Staff user access to a second company for testing multi-company scenario

### Claude's Discretion
- Migration naming convention: follow existing `000NN_snake_case.sql` pattern
- Seed file structure: follow existing seed file conventions in `supabase/seed.sql`
- RLS policy naming: follow existing pattern `{table}_{action}_policy`

</decisions>

<specifics>
## Specific Requirements

- Error message seen: `Failed to clear company access: Could not find the table 'public.user_company_access' in the schema cache`
- This error surfaces in the UI when admin saves user company access settings
- The `user_company_access` table was added in migration `00018_user_company_access.sql`
- Likely cause: migration exists but Supabase local hasn't been reset/migrated after branch merge
- Secondary concern: seed data from merged mock-data branch may not assign multi-company records
- The fix must NOT break existing single-company users — they should see only their company's data as before

</specifics>
