# Vision API Security Fix - Research

**Researched:** 2026-03-26
**Domain:** API route authorization / cross-company access control
**Confidence:** HIGH

## Summary

The `app/api/vision/describe/route.ts` endpoint has a cross-company data poisoning vulnerability. It accepts an `attachmentId` and uses `adminClient` (bypasses RLS) to update `media_attachments.description` without verifying that the attachment belongs to a company the authenticated user can access. Any authenticated user can overwrite the description of any attachment in the system.

The fix is straightforward: fetch the attachment first to get its `company_id`, then validate the user's access before allowing the update.

**Primary recommendation:** Follow the established pattern from export routes -- expand the profile query to include `company_id`, build an accessible company list from `user_company_access`, then gate the update on the attachment's `company_id` being in that list. Use `assertCompanyAccess` from `lib/auth/company-access.ts`.

## Current Vulnerability

### Route: `app/api/vision/describe/route.ts`

**Lines 95-105 -- the vulnerable code:**
```typescript
if (description) {
  const adminClient = createAdminClient();
  const { error: updateError } = await adminClient
    .from('media_attachments')
    .update({ description })
    .eq('id', attachmentId);  // <-- no company check
}
```

**Why it's dangerous:**
- `adminClient` uses the Supabase service role key, bypassing ALL RLS policies
- The `attachmentId` comes directly from the request body with no ownership validation
- Any authenticated user (even deactivated-then-reactivated) can target any attachment ID

**Attack scenario:** User from Company A sends `{ attachmentId: "<company-B-attachment-uuid>", imageBase64: "<crafted-image>" }` and overwrites Company B's attachment description.

## Existing Patterns to Follow

### Pattern 1: assertCompanyAccess (from lib/auth/company-access.ts)

```typescript
import { assertCompanyAccess } from '@/lib/auth/company-access';

// Usage: throws if user doesn't have access to targetCompanyId
await assertCompanyAccess(supabase, userId, targetCompanyId, profileCompanyId);
```

- Skips DB query if `targetCompanyId === profileCompanyId` (primary company)
- Checks `user_company_access` table for secondary companies
- Throws `Error('You do not have access to the selected company.')` on failure

**Confidence:** HIGH -- read directly from source code.

### Pattern 2: Profile query in API routes (from export routes)

```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('id, company_id, role, deleted_at')
  .eq('id', user.id)
  .single();
```

The vision route currently only selects `id, deleted_at` -- must add `company_id`.

**Confidence:** HIGH -- read directly from source code.

### Pattern 3: Fetch-then-validate (from schedule-actions.ts)

For update/delete operations on existing records, the codebase first fetches the entity to get its `company_id`, then calls `assertCompanyAccess`:

```typescript
// From schedule-actions.ts (deactivateSchedule, reactivateSchedule, etc.)
const { data: existing } = await adminSupabase
  .from('maintenance_schedules')
  .select('id, company_id, ...')
  .eq('id', parsedInput.id)
  .single();

await assertCompanyAccess(adminSupabase, profile.id, existing.company_id, profile.company_id);
```

**Confidence:** HIGH -- read directly from source code.

## Schema Confirmation

### media_attachments table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| **company_id** | uuid | FK -> companies(id), NOT NULL |
| entity_type | text | NOT NULL |
| entity_id | uuid | NOT NULL |
| description | text | nullable -- this is the field being updated |
| deleted_at | timestamptz | nullable |

The `company_id` column exists and is NOT NULL, confirming we can always use it for access validation.

**RLS policies on media_attachments:**
- SELECT: `company_id = current_user_company_id() OR EXISTS (user_company_access)`
- INSERT: same check
- UPDATE: same check (USING + WITH CHECK)

RLS would block this if the route used the user's `supabase` client, but it uses `adminClient` which bypasses RLS entirely.

**Confidence:** HIGH -- read directly from `docs/db_schema.md`.

## Implementation Plan

### Changes needed in `app/api/vision/describe/route.ts`:

1. **Expand profile query** (line 36): Add `company_id` to the select:
   ```typescript
   .select('id, company_id, deleted_at')
   ```

2. **Fetch attachment before update** (after line 95): Use `adminClient` to get the attachment's `company_id`:
   ```typescript
   const adminClient = createAdminClient();
   const { data: attachment } = await adminClient
     .from('media_attachments')
     .select('id, company_id')
     .eq('id', attachmentId)
     .single();

   if (!attachment) {
     // Attachment not found -- skip silently (non-fatal, same as current behavior)
     return NextResponse.json({ description });
   }
   ```

3. **Validate company access** (before the update):
   ```typescript
   await assertCompanyAccess(supabase, user.id, attachment.company_id, profile.company_id);
   ```

   Note: Use `supabase` (user client) here, not `adminClient`, since `assertCompanyAccess` queries `user_company_access` which has RLS SELECT policies. Alternatively, use `adminClient` since the helper is already used with `adminSupabase` in schedule-actions.ts. Either works -- the `user_company_access` table's SELECT policy allows users to see their own rows.

4. **Handle the access denied case**: If `assertCompanyAccess` throws, catch it and return 403:
   ```typescript
   try {
     await assertCompanyAccess(supabase, user.id, attachment.company_id, profile.company_id);
   } catch {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

### Error handling consideration

The route currently treats vision failures as non-fatal (returns `{ description: null }` on errors). For the security check, we should NOT be silent -- a 403 is appropriate because this represents a deliberate access violation, not a graceful degradation scenario.

## Common Pitfalls

### Pitfall 1: Using supabase client instead of adminClient for the attachment fetch
**What goes wrong:** The user's supabase client already has RLS filtering, so it would only return attachments the user can see -- which seems like it solves the problem. But this creates a silent failure mode where the update just doesn't happen, with no security error logged.
**How to avoid:** Fetch with `adminClient` to get the attachment regardless of RLS, then explicitly check company access. This provides a clear security boundary with proper error responses.

### Pitfall 2: Moving adminClient creation inside the description block
**What goes wrong:** The `adminClient` is currently only created when `description` is truthy (line 97). The fix needs `adminClient` earlier (to fetch the attachment).
**How to avoid:** Move `adminClient` creation to before the attachment fetch, outside the `if (description)` block. We need to validate access regardless of whether Vision API returned labels.

**Wait -- re-reading the code:** Actually, the access check should only matter when we're about to write. If Vision API returns no description, there's nothing to write and no security issue. So the check can stay inside the `if (description)` block. Just move `adminClient` creation to before the fetch-then-validate sequence within that block.

### Pitfall 3: Not handling deleted attachments
**What goes wrong:** A deleted attachment (`deleted_at IS NOT NULL`) still has a `company_id`. We should not update deleted attachments.
**How to avoid:** Add `.is('deleted_at', null)` to the attachment fetch query.

## Sources

### Primary (HIGH confidence)
- `app/api/vision/describe/route.ts` -- full route source, vulnerability confirmed
- `lib/auth/company-access.ts` -- assertCompanyAccess helper source
- `docs/db_schema.md` -- media_attachments schema with company_id column confirmed
- `app/actions/schedule-actions.ts` -- fetch-then-validate pattern reference
- `app/api/exports/jobs/route.ts` -- API route profile query pattern reference

## Metadata

**Confidence breakdown:**
- Vulnerability: HIGH -- read source code directly
- Fix approach: HIGH -- follows existing codebase patterns exactly
- Schema: HIGH -- confirmed from db_schema.md

**Research date:** 2026-03-26
**Valid until:** No expiration -- security fix based on static code analysis
