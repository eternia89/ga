# Bug Fix Protocol Sweep 3 — Security: adminSupabase Without Company Scoping

**Researched:** 2026-03-26
**Domain:** Server-side authorization — adminSupabase (service-role) mutations
**Confidence:** HIGH

## Summary

Exhaustive sweep of all `adminSupabase` / `createAdminClient()` usage across the codebase. Analyzed 15 action files, 5 upload API routes, 1 vision API route, 1 server component, and 1 notification helper. Every mutation (`.insert`, `.update`, `.delete`, `.upsert`) through the service-role client was classified for company-scoping safety.

**Overall finding:** The codebase is in good shape after prior security sweeps. Most adminSupabase mutations are properly protected. However, several specific issues remain, ranging from MEDIUM to LOW risk.

**Primary recommendation:** Fix the 3 MEDIUM-risk issues identified below. The LOW-risk issues are defense-in-depth improvements that should also be addressed.

## Methodology

For each `adminSupabase`/`createAdminClient()` usage:
1. Classified as READ or MUTATION
2. For mutations: checked for company_id filter or prior entity ownership verification
3. Assessed whether a malicious client could manipulate IDs to target another company's data
4. Checked `assertCompanyAccess` adoption across all action files

---

## Finding 1: `deactivateUser` — No Company Access Check

**File:** `app/actions/user-actions.ts`, line 183-207
**Risk:** MEDIUM
**Client chain:** `adminActionClient` (admin role required)

```typescript
export const deactivateUser = adminActionClient
  .schema(z.object({
    id: z.string().uuid(),
    reason: z.string().max(200).optional(),
  }))
  .action(async ({ parsedInput }): Promise<ActionOk> => {
    const adminSupabase = createAdminClient();
    // NO assertCompanyAccess — admin can deactivate ANY user in ANY company
    const { error } = await adminSupabase
      .from('user_profiles')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', parsedInput.id);   // <-- no company_id filter
```

**Issue:** An admin user with multi-company access could deactivate users from companies they do not have access to. The `ctx` parameter is not even destructured — `profile` is unavailable.

**Compare with:** `createUser` and `updateUser` in the same file both call `assertCompanyAccess`. `deactivateUser` does not.

**Fix:** Fetch the target user's `company_id`, then call `assertCompanyAccess(adminSupabase, ctx.profile.id, targetUser.company_id, ctx.profile.company_id)` before the update. Must also destructure `ctx` in the action handler.

---

## Finding 2: `reactivateUser` — No Company Access Check

**File:** `app/actions/user-actions.ts`, line 210-256
**Risk:** MEDIUM
**Client chain:** `adminActionClient` (admin role required)

```typescript
export const reactivateUser = adminActionClient
  .schema(z.object({ id: z.string().uuid(), reason: z.string().max(200).optional() }))
  .action(async ({ parsedInput }): Promise<ActionOk> => {
    const adminSupabase = createAdminClient();
    // NO assertCompanyAccess
    // ...fetches user, checks duplicate email, then:
    const { error } = await adminSupabase
      .from('user_profiles')
      .update({ deleted_at: null, is_active: true, ... })
      .eq('id', parsedInput.id);   // <-- no company_id filter
```

**Issue:** Same as Finding 1 — admin can reactivate users from companies they don't have access to. `ctx` is not destructured.

**Fix:** Fetch target user's `company_id` (already fetched — add `company_id` to the select), then call `assertCompanyAccess` before the update. Must also accept `ctx` in the action handler.

---

## Finding 3: `company-settings-actions.ts` — Hardcoded `.eq('company_id', profile.company_id)`

**File:** `app/actions/company-settings-actions.ts`, lines 17-95
**Risk:** MEDIUM (functional limitation, not a direct exploit)
**Client chain:** `authActionClient` (any authenticated user)

```typescript
// getCompanySettings — reads only from profile.company_id
const { data, error } = await supabase
  .from('company_settings')
  .select('key, value')
  .eq('company_id', profile.company_id);

// updateCompanySetting — writes only to profile.company_id
const { data: existing } = await supabase
  .from('company_settings')
  .select('id')
  .eq('company_id', profile.company_id)
  .eq('key', parsedInput.key)
  .maybeSingle();
```

**Issue:** A multi-company admin who has access to Company A and Company B can only view/update Company A's settings (their primary company). There's no way to pass a `company_id` to manage settings for Company B. This is not a cross-company exploit, but it **blocks legitimate multi-company admin workflows**.

**Note from CLAUDE.md:** "Never hardcode dimension filters (`.eq('company_id', profile.company_id)`) when RLS already enforces scoping... Prefer letting RLS handle access control; only add action-level filters when RLS is insufficient or when using `adminSupabase` (service role)."

However, this action uses `authActionClient` with the user's own supabase client, so RLS does enforce scoping. The hardcoded filter is redundant but not exploitable — RLS would already limit the query. The real issue is that the action has no mechanism for a multi-company admin to specify which company's settings to manage.

**Fix:** Add an optional `company_id` field to the schema. If provided and different from `profile.company_id`, call `assertCompanyAccess`. Use `effectiveCompanyId` pattern consistent with other actions.

---

## Finding 4: `deleteMediaAttachment` (request-actions.ts) — No company_id Filter on adminSupabase Update

**File:** `app/actions/request-actions.ts`, lines 374-422
**Risk:** LOW (mitigated by prior ownership check)

```typescript
// Ownership verified via RLS-scoped query first:
const { data: attachment } = await supabase     // <-- RLS-scoped client
  .from('media_attachments')
  .select('id, entity_id, entity_type')
  .eq('id', parsedInput.attachmentId)
  .is('deleted_at', null)
  .single();

// Then verified request belongs to user:
const { data: request } = await supabase
  .from('requests')
  .select('id, status, requester_id')
  .eq('id', attachment.entity_id)
  .eq('requester_id', profile.id)
  .eq('status', 'submitted')
  .single();

// But the actual mutation has no company_id filter:
const { error } = await adminSupabase
  .from('media_attachments')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', parsedInput.attachmentId);   // <-- only ID filter
```

**Mitigating factors:**
- The attachment ID was verified via RLS-scoped query (user can only see their company's data)
- The parent request was verified as owned by the user AND in submitted status
- An attacker would need to guess a valid attachment UUID from another company

**Defense-in-depth fix:** Add `.eq('company_id', requestRecord.company_id)` or similar to the adminSupabase update. This requires fetching the attachment's company_id in the initial query (add to select).

---

## Finding 5: `deleteJobAttachment` (job-actions.ts) — No company_id Filter on adminSupabase Update

**File:** `app/actions/job-actions.ts`, lines 778-830
**Risk:** LOW (mitigated by prior ownership check)

```typescript
// Verified via RLS-scoped queries:
const { data: attachment } = await supabase...
const { data: job } = await supabase...   // verifies job exists in user's company

// But actual mutation:
const { error } = await adminSupabase
  .from('media_attachments')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', parsedInput.attachmentId);   // <-- only ID filter
```

**Same pattern as Finding 4.** The RLS-scoped read provides ownership verification, but the adminSupabase mutation operates solely on ID.

**Defense-in-depth fix:** Add company_id filter to the adminSupabase update.

---

## Finding 6: `deleteAssetPhotos` (asset-actions.ts) — ALREADY PROPERLY HANDLED

**File:** `app/actions/asset-actions.ts`, lines 644-694
**Risk:** NONE

This action already:
1. Uses `adminSupabase` to fetch attachments (gets `company_id`)
2. Calls `assertCompanyAccess` for each unique company_id
3. Then performs the soft-delete

**This is the GOLD STANDARD pattern.** Other deletion actions should follow this model.

---

## Finding 7: `cancelTransfer` (asset-actions.ts) — PROPERLY HANDLED

**File:** `app/actions/asset-actions.ts`, lines 468-512
**Risk:** NONE

```typescript
// Movement fetched via RLS-scoped query first, gets company_id
const { data: movement } = await supabase...
// Authorization verified (initiator, ga_lead, or admin)
// Then adminSupabase mutation WITH company_id filter:
const { error } = await adminSupabase
  .from('inventory_movements')
  .update({ status: 'cancelled', ... })
  .eq('id', parsedInput.movement_id)
  .eq('company_id', movement.company_id);   // <-- GOOD
```

---

## Finding 8: Notification Helper — Intentionally Unscoped

**File:** `lib/notifications/helpers.ts`
**Risk:** NONE (by design)

The `createNotifications` function uses `createAdminClient()` to insert into the `notifications` table. This is correct because:
- Notifications table has no INSERT policy for regular users
- The `company_id` is always passed from the calling action
- The `user_id` for each notification is explicitly set from verified recipient lists
- Notification insertion failure never blocks the triggering action

---

## Finding 9: Upload API Routes — Company Scoping Via Profile

**Files:**
- `app/api/uploads/request-photos/route.ts`
- `app/api/uploads/asset-photos/route.ts`
- `app/api/uploads/entity-photos/route.ts`
- `app/api/uploads/job-photos/route.ts`
- `app/api/uploads/asset-invoices/route.ts`

**Risk:** LOW

All upload routes follow the same pattern:
1. Verify auth via `createClient()` (RLS-scoped)
2. Fetch user profile
3. Verify entity ownership/existence via RLS-scoped query
4. Create `adminSupabase` for storage uploads and `media_attachments` inserts
5. Set `company_id` on the insert from `profile.company_id` or `entity.company_id`

**Potential issue:** `asset-photos/route.ts` uses `profile.company_id` for the media_attachment insert. If the asset belongs to a different company (multi-company access), the attachment's company_id would be wrong (set to the uploader's primary company, not the asset's company).

However: the asset existence check uses the RLS-scoped client, which would only return assets the user can see. And the asset's company_id is not used in the insert. This is a **data integrity issue** (wrong company_id on the attachment), not a security vulnerability.

**Recommendation:** Use the asset's/entity's company_id from the verified record, not `profile.company_id`.

---

## Finding 10: Vision API Route — PROPERLY HANDLED

**File:** `app/api/vision/describe/route.ts`
**Risk:** NONE

The route:
1. Authenticates the user
2. Fetches the attachment via admin client
3. Calls `assertCompanyAccess` before updating
4. Returns 403 if access denied

This was fixed in a prior security sweep (260326-fca).

---

## Finding 11: Admin Settings Page (Server Component) — Intentionally Unscoped READs

**File:** `app/(dashboard)/admin/settings/page.tsx`
**Risk:** NONE (by design)

Uses `createAdminClient()` to read ALL companies, divisions, locations, categories, and users. This is correct because:
- The page is admin-only (route-level protection)
- Admins need full cross-company visibility for system configuration
- These are READ operations, not mutations

---

## Finding 12: Schedule Actions — PROPERLY HANDLED

**File:** `app/actions/schedule-actions.ts`
**Risk:** NONE

All mutations through `gaLeadActionClient` (which provides `adminSupabase`):
- `createSchedule`: uses `assertCompanyAccess` when company_id differs
- `updateSchedule`: calls `assertCompanyAccess(adminSupabase, profile.id, existing.company_id, ...)`
- `deactivateSchedule`: calls `assertCompanyAccess`
- `activateSchedule`: calls `assertCompanyAccess`
- `deleteSchedule`: calls `assertCompanyAccess`

All correctly verified. The helper functions (`pauseSchedulesForAsset`, `resumeSchedulesForAsset`, `deactivateSchedulesForAsset`) use the caller's supabase client (RLS-scoped), not adminSupabase.

---

## Finding 13: Admin Entity Actions — Admin Role Required, No Company Scoping

**Files:**
- `app/actions/company-actions.ts`
- `app/actions/division-actions.ts`
- `app/actions/location-actions.ts`
- `app/actions/category-actions.ts`

**Risk:** NONE (accepted design)

All use `adminActionClient` which provides `adminSupabase` (aliased as `supabase` within each action). These actions manage companies, divisions, locations, and categories — entities that admins should be able to manage across companies.

None of these have `assertCompanyAccess` because:
- Admin role is enforced by the action client chain
- Admins are expected to manage all companies/divisions/locations/categories
- These are system configuration entities, not tenant-scoped operational data

This is the correct design for admin settings management.

---

## Finding 14: `updateUserCompanyAccess` — No Target User Company Validation

**File:** `app/actions/user-company-access-actions.ts`, lines 30-61
**Risk:** LOW

```typescript
export const updateUserCompanyAccess = adminActionClient
  .schema(z.object({
    userId: z.string().uuid(),
    companyIds: z.array(z.string().uuid()).max(50),
  }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const adminSupabase = createAdminClient();
    // Deletes ALL access rows and reinserts — no check that admin has access to target user's company
    const { error: deleteError } = await adminSupabase
      .from('user_company_access')
      .delete()
      .eq('user_id', userId);
```

**Issue:** An admin could theoretically modify company access for users outside their own company scope. However, this is behind `adminActionClient` (admin role required), and the current system design assumes admins have global management authority.

**Mitigating factors:** Admin role is the highest operational role. The UI only shows users the admin can see. But a crafted request could target any user.

**Defense-in-depth fix:** Fetch the target user's `company_id`, validate the admin has access to that company via `assertCompanyAccess`.

---

## assertCompanyAccess Adoption Summary

| Action File | Has assertCompanyAccess? | Notes |
|---|---|---|
| `asset-actions.ts` | YES | `createAsset`, `deleteAssetPhotos` |
| `request-actions.ts` | YES | `createRequest` |
| `job-actions.ts` | YES | `createJob` |
| `approval-actions.ts` | YES | All 4 actions |
| `schedule-actions.ts` | YES | All 5 mutation actions |
| `user-actions.ts` | PARTIAL | `createUser` YES, `updateUser` YES, `deactivateUser` NO, `reactivateUser` NO |
| `user-company-access-actions.ts` | NO | `updateUserCompanyAccess` has no check |
| `company-settings-actions.ts` | NO | Hardcodes `profile.company_id` |
| `company-actions.ts` | N/A | Admin manages all companies by design |
| `division-actions.ts` | N/A | Admin manages all divisions by design |
| `location-actions.ts` | N/A | Admin manages all locations by design |
| `category-actions.ts` | N/A | Admin manages all categories by design |
| `template-actions.ts` | N/A | Uses `authActionClient` with RLS, no adminSupabase |
| `profile-actions.ts` | N/A | Self-update only, no adminSupabase |
| `pm-job-actions.ts` | N/A | Uses `authActionClient` with RLS, no adminSupabase |

---

## Prioritized Fix List

### MEDIUM Risk (should fix)

| # | File | Action | Issue | Fix |
|---|---|---|---|---|
| 1 | `user-actions.ts` | `deactivateUser` | No `assertCompanyAccess`, no company_id filter | Add company access check |
| 2 | `user-actions.ts` | `reactivateUser` | No `assertCompanyAccess`, no company_id filter | Add company access check |
| 3 | `company-settings-actions.ts` | `getCompanySettings` / `updateCompanySetting` | Hardcoded `profile.company_id` blocks multi-company admin | Add optional `company_id` input + `assertCompanyAccess` |

### LOW Risk (defense-in-depth)

| # | File | Action | Issue | Fix |
|---|---|---|---|---|
| 4 | `request-actions.ts` | `deleteMediaAttachment` | adminSupabase update by ID only | Add company_id filter to update |
| 5 | `job-actions.ts` | `deleteJobAttachment` | adminSupabase update by ID only | Add company_id filter to update |
| 6 | `user-company-access-actions.ts` | `updateUserCompanyAccess` | No target user company validation | Add assertCompanyAccess for target user |
| 7 | Upload routes (all 5) | `media_attachments` insert | Uses `profile.company_id` instead of entity's company_id in some cases | Use entity's verified company_id |

### NO ACTION NEEDED

- `cancelTransfer` (already has company_id filter on adminSupabase)
- `deleteAssetPhotos` (gold standard — assertCompanyAccess on attachment company_ids)
- `createNotifications` helper (intentionally unscoped INSERT, company_id passed from caller)
- Admin settings entities (companies, divisions, locations, categories — admin manages all by design)
- Schedule actions (all have assertCompanyAccess)
- Approval actions (all have assertCompanyAccess)
- Vision API route (has assertCompanyAccess after prior fix)
- Admin settings page RSC (read-only, admin-only route)
- Scripts (`seed-ops.ts`, `wipe-ops.ts` — CLI tooling, not server endpoints)

## Sources

### Primary (HIGH confidence)
- Direct code analysis of all 15 action files
- Direct code analysis of all 6 API routes
- Direct code analysis of `lib/safe-action.ts`, `lib/supabase/admin.ts`, `lib/auth/company-access.ts`
- Direct code analysis of `lib/notifications/helpers.ts`

## Metadata

**Confidence breakdown:**
- Completeness: HIGH — every file with adminSupabase/createAdminClient was read in full
- Classification accuracy: HIGH — mutation vs read, company-scoped vs not
- Risk assessment: HIGH — based on exploit feasibility analysis

**Research date:** 2026-03-26
**Valid until:** Until next action file is added or modified
