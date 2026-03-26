---
phase: quick
plan: 260326-fca
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/vision/describe/route.ts
autonomous: true
requirements: [SECURITY-VISION-01]

must_haves:
  truths:
    - "Vision describe endpoint cannot update attachments belonging to a company the user has no access to"
    - "Valid requests from users with correct company access still succeed and update the description"
    - "Requests targeting nonexistent or deleted attachments return early without updating"
  artifacts:
    - path: "app/api/vision/describe/route.ts"
      provides: "Secured vision describe endpoint with company access validation"
      contains: "assertCompanyAccess"
  key_links:
    - from: "app/api/vision/describe/route.ts"
      to: "lib/auth/company-access.ts"
      via: "assertCompanyAccess import and call"
      pattern: "assertCompanyAccess\\(adminClient.*attachment\\.company_id.*profile\\.company_id\\)"
    - from: "app/api/vision/describe/route.ts"
      to: "media_attachments"
      via: "fetch-then-validate before update"
      pattern: "\\.select\\('id, company_id'\\)"
---

<objective>
Fix cross-company data poisoning vulnerability in the Vision API describe route.

Purpose: The route uses adminClient (bypasses RLS) to update media_attachments.description by ID without verifying the attachment belongs to a company the authenticated user can access. Any authenticated user can overwrite any attachment's description system-wide.

Output: Secured route that validates company access before allowing the update, following the established fetch-then-validate pattern used in schedule-actions.ts and other server actions.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/api/vision/describe/route.ts
@lib/auth/company-access.ts
@.planning/quick/260326-fca-vision-api-security-fix-add-company-acce/260326-fca-RESEARCH.md

<interfaces>
From lib/auth/company-access.ts:
```typescript
export async function assertCompanyAccess(
  supabase: SupabaseClient,
  userId: string,
  targetCompanyId: string,
  profileCompanyId: string
): Promise<void>;
// Throws Error('You do not have access to the selected company.') on failure
// Skips DB query if targetCompanyId === profileCompanyId (primary company)
```

From lib/supabase/admin.ts:
```typescript
export function createAdminClient(): SupabaseClient;
// Returns service-role client that bypasses RLS
```

media_attachments schema (relevant columns):
- id: uuid PK
- company_id: uuid NOT NULL (FK -> companies)
- description: text (nullable -- the field being updated)
- deleted_at: timestamptz (nullable)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add company access validation to vision describe route</name>
  <files>app/api/vision/describe/route.ts</files>
  <action>
Apply the fetch-then-validate pattern to the vision describe route. All changes are within the `POST` handler:

1. **Add import** at top of file:
   ```typescript
   import { assertCompanyAccess } from '@/lib/auth/company-access';
   ```

2. **Expand profile query** (line 37): Change `.select('id, deleted_at')` to `.select('id, company_id, deleted_at')` so we have the user's primary company_id for the access check.

3. **Inside the `if (description)` block** (line 95-106), replace the current direct-update code with the fetch-then-validate-then-update pattern:

   a. Create `adminClient` (already exists at line 97).

   b. **Fetch the attachment first** to get its company_id, filtering out deleted attachments:
      ```typescript
      const { data: attachment } = await adminClient
        .from('media_attachments')
        .select('id, company_id')
        .eq('id', attachmentId)
        .is('deleted_at', null)
        .single();
      ```

   c. **If attachment not found** (deleted or nonexistent), skip the update silently and return the description. This matches the route's existing non-fatal error philosophy for downstream operations:
      ```typescript
      if (!attachment) {
        return NextResponse.json({ description });
      }
      ```

   d. **Validate company access** using assertCompanyAccess with adminClient (consistent with schedule-actions.ts pattern where assertCompanyAccess is called with the admin client). Wrap in try/catch and return 403 on access denial -- this is a deliberate security boundary, NOT a graceful degradation:
      ```typescript
      try {
        await assertCompanyAccess(adminClient, user.id, attachment.company_id, profile.company_id);
      } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      ```

   e. **Then proceed with the existing update** (unchanged):
      ```typescript
      const { error: updateError } = await adminClient
        .from('media_attachments')
        .update({ description })
        .eq('id', attachmentId);
      ```

The complete `if (description)` block should be approximately 25 lines with fetch, access check, and update.

**Do NOT change:** The Vision API call logic, error handling for Vision API failures, or the response format. Only the update path needs securing.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit app/api/vision/describe/route.ts 2>&1 | head -20 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
- `assertCompanyAccess` is imported and called before the adminClient update
- Profile query selects `company_id` in addition to `id` and `deleted_at`
- Attachment is fetched with `.is('deleted_at', null)` before the update
- Missing/deleted attachments return `{ description }` without updating
- Failed company access returns 403 Forbidden
- TypeScript compiles without errors
- Build succeeds
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify no similar vulnerability in other API routes</name>
  <files>app/api/vision/describe/route.ts</files>
  <action>
Per CLAUDE.md Bug Fix Protocol: scan the entire codebase for the same or similar vulnerability pattern -- an adminClient/createAdminClient being used for data mutations (insert/update/delete on business tables) without a preceding company access check.

Run these grep commands to audit:
1. `grep -rn "adminClient\|createAdminClient\|adminSupabase" app/api/ --include="*.ts"` -- find all admin client usage in API routes
2. For each hit, verify it either (a) only does storage uploads (not business data mutations), or (b) has a company access check before the mutation.

Based on research already done: the upload routes (asset-photos, job-photos, entity-photos, request-photos, asset-invoices) all use adminClient exclusively for Supabase Storage uploads, not for business table mutations. The vision describe route was the only API route performing an unguarded business table update with adminClient. No additional fixes needed.

Document findings as a comment at the top of the route file (single line):
```typescript
// Security: company access validated via assertCompanyAccess before adminClient update (2026-03-26)
```
Actually, do NOT add this comment -- the code should be self-documenting. The assertCompanyAccess call is clear enough. Just confirm the audit is clean and note it in the SUMMARY.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -rn "createAdminClient\|adminClient\|adminSupabase" app/api/ --include="*.ts" | grep -v "node_modules" | grep -v "storage" | grep -v "\.upload(" | grep -v "\.from('media_attachments')" | head -20</automated>
  </verify>
  <done>
- All API routes using adminClient/adminSupabase have been audited
- No other API routes perform unguarded business table mutations with admin client
- Upload routes confirmed to use admin client only for storage operations
- The vision describe route is the sole instance of this vulnerability class
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit app/api/vision/describe/route.ts`
2. Build passes: `npm run build`
3. Code review: Confirm `assertCompanyAccess` call exists between attachment fetch and update
4. Grep confirmation: `grep -n "assertCompanyAccess" app/api/vision/describe/route.ts` shows the call
5. Profile query: `grep -n "company_id" app/api/vision/describe/route.ts` shows company_id in select
</verification>

<success_criteria>
- The vision describe route validates company access before updating media_attachments
- Cross-company attachment description poisoning is no longer possible
- Legitimate same-company requests continue to work unchanged
- No TypeScript errors, build passes
- No similar unguarded admin mutations exist in other API routes
</success_criteria>

<output>
After completion, create `.planning/quick/260326-fca-vision-api-security-fix-add-company-acce/260326-fca-SUMMARY.md`
</output>
