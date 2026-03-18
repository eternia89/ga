---
phase: quick
plan: 260318-bnb
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/types/action-responses.ts
  - app/actions/approval-actions.ts
  - app/actions/asset-actions.ts
  - app/actions/category-actions.ts
  - app/actions/company-actions.ts
  - app/actions/company-settings-actions.ts
  - app/actions/division-actions.ts
  - app/actions/job-actions.ts
  - app/actions/location-actions.ts
  - app/actions/pm-job-actions.ts
  - app/actions/profile-actions.ts
  - app/actions/request-actions.ts
  - app/actions/schedule-actions.ts
  - app/actions/template-actions.ts
  - app/actions/user-actions.ts
  - app/actions/user-company-access-actions.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Every server action has an explicit return type annotation"
    - "All return types derive from a shared ActionResponse<T> base type"
    - "No runtime behavior changes — only TypeScript type annotations added"
    - "npm run build succeeds with zero type errors"
  artifacts:
    - path: "lib/types/action-responses.ts"
      provides: "ActionResponse<T> base type and specific response types"
      exports: ["ActionResponse", "ActionOk", "CreateEntityResponse", "DeactivateResponse", "PhotosResponse", "InvoicesResponse"]
    - path: "app/actions/asset-actions.ts"
      provides: "Return type annotations on all asset actions"
    - path: "app/actions/request-actions.ts"
      provides: "Return type annotations on all request actions"
  key_links:
    - from: "app/actions/*.ts"
      to: "lib/types/action-responses.ts"
      via: "import type"
      pattern: "import.*ActionResponse.*from.*action-responses"
---

<objective>
Standardize all 76 server actions to use a shared `ActionResponse<T>` type system.

Purpose: Currently actions return 24+ unique ad-hoc shapes (`{ success: true, movementId }`, `{ success: true, deleted, blocked }`, etc.) with no shared type. Consumers must grep action source to discover return fields. Adding explicit return type annotations using a shared base type gives IDE hover-to-discover and compile-time safety.

Output: A new `lib/types/action-responses.ts` with the base type and common response shapes, plus return type annotations on all 76 actions across 15 files. No runtime changes — flat return shapes stay flat.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/safe-action.ts
@lib/types/database.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ActionResponse type system</name>
  <files>lib/types/action-responses.ts</files>
  <action>
Create `lib/types/action-responses.ts` with the following types:

```typescript
/**
 * Base response type for all server actions.
 * Actions return flat objects: { success: true, ...extraFields }.
 * The generic T represents extra fields beyond `success`.
 *
 * next-safe-action wraps the return in { data?, serverError? },
 * so the client accesses result?.data?.success, result?.data?.fieldName.
 * We keep returns FLAT (no nested data property) to avoid double-nesting.
 */
export type ActionResponse<T extends Record<string, unknown> = Record<string, never>> =
  { success: true } & T;

/** Shorthand for actions that only return { success: true } */
export type ActionOk = ActionResponse;

/** Create entity actions — return the new entity's ID and optionally display_id */
export type CreateEntityResponse = ActionResponse<{
  [key: string]: string; // e.g., assetId, requestId, jobId, scheduleId, templateId, commentId, movementId
}>;

/** Deactivate actions — return count of deactivated and blocked items */
export type DeactivateResponse = ActionResponse<{
  deleted: number;
  blocked: number;
}>;

/** Photo fetch actions — return signed photo URLs */
export type PhotosResponse = ActionResponse<{
  photos: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    file_name: string;
    url: string;
    created_at: string;
  }>;
}>;

/** Invoice fetch actions — return signed invoice URLs */
export type InvoicesResponse = ActionResponse<{
  invoices: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    file_name: string;
    url: string;
    created_at: string;
  }>;
}>;

/** Photo deletion actions */
export type DeleteAttachmentsResponse = ActionResponse<{
  deleted: number;
}>;

/** PM checklist save — return completed/total counts */
export type ChecklistProgressResponse = ActionResponse<{
  completedCount: number;
  totalCount: number;
}>;

/** PM checklist complete — return completed count */
export type ChecklistCompleteResponse = ActionResponse<{
  completedCount: number;
}>;

/** Schedule advance — return whether it advanced and next due date */
export type AdvanceScheduleResponse = ActionResponse<{
  advanced: boolean;
  nextDueAt?: string;
}>;
```

Notes:
- Keep types simple and flat — mirrors the actual return shapes
- Do NOT create a discriminated union or nested `data` property
- Export all types for use in action files
- The `CreateEntityResponse` is intentionally loose (string index) because different actions return different ID field names (assetId, jobId, etc.). The specific return type annotation on each action will constrain this further.

Actually, revise: instead of loose `CreateEntityResponse`, define specific ones per entity since the action annotations themselves will be the precise types. The shared types only cover repeated patterns (deactivate, photos, invoices, advance). For create actions, the annotation will be inline like `ActionResponse<{ assetId: string; displayId: string }>`.

Final file should export: `ActionResponse`, `ActionOk`, `DeactivateResponse`, `PhotosResponse`, `InvoicesResponse`, `DeleteAttachmentsResponse`, `ChecklistProgressResponse`, `ChecklistCompleteResponse`, `AdvanceScheduleResponse`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit lib/types/action-responses.ts 2>&1 | head -20</automated>
  </verify>
  <done>lib/types/action-responses.ts exists, exports all response types, compiles with no errors</done>
</task>

<task type="auto">
  <name>Task 2: Add return type annotations to all 76 server actions</name>
  <files>
    app/actions/approval-actions.ts
    app/actions/asset-actions.ts
    app/actions/category-actions.ts
    app/actions/company-actions.ts
    app/actions/company-settings-actions.ts
    app/actions/division-actions.ts
    app/actions/job-actions.ts
    app/actions/location-actions.ts
    app/actions/pm-job-actions.ts
    app/actions/profile-actions.ts
    app/actions/request-actions.ts
    app/actions/schedule-actions.ts
    app/actions/template-actions.ts
    app/actions/user-actions.ts
    app/actions/user-company-access-actions.ts
  </files>
  <action>
For each of the 15 action files, add an import for the response types at the top and add explicit return type annotations to the `.action(async (...) => { ... })` callback. This is TYPE ANNOTATIONS ONLY — do NOT change any runtime return values.

**Import to add at top of each file:**
```typescript
import type { ActionOk, DeactivateResponse, PhotosResponse, ... } from '@/lib/types/action-responses';
// Only import the types actually used in that file
```

**How to annotate:** The `.action()` callback's return type should use a type assertion or explicit annotation. Since next-safe-action's `.action()` infers the return type from the callback, we add a `satisfies` check or explicit return type to the callback:

```typescript
// BEFORE:
.action(async ({ parsedInput, ctx }) => {
  // ...
  return { success: true };
})

// AFTER:
.action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
  // ...
  return { success: true };
})
```

**Mapping of actions to return types:**

FILE: approval-actions.ts (4 actions)
- `approveJob` → `ActionOk`
- `rejectJob` → `ActionOk`
- `approveCompletion` → `ActionOk`
- `rejectCompletion` → `ActionOk`

FILE: asset-actions.ts (12 actions)
- `createAsset` → `ActionResponse<{ assetId: string; displayId: string }>`
- `updateAsset` → `ActionOk`
- `changeAssetStatus` → `ActionOk`
- `createTransfer` → `ActionResponse<{ movementId: string }>`
- `acceptTransfer` → `ActionOk`
- `rejectTransfer` → `ActionOk`
- `cancelTransfer` → `ActionOk`
- `getAssetPhotos` → `PhotosResponse`
- `getAssetInvoices` → `InvoicesResponse`
- `deleteAssetPhotos` → `DeleteAttachmentsResponse`

FILE: category-actions.ts (5 actions)
- `createCategory` → `ActionResponse<{ data: object }>` (returns the created row — use the actual Supabase row type or keep generic)
- `updateCategory` → `ActionResponse<{ data: object }>`
- `deactivateCategory` → `DeactivateResponse`
- `reactivateCategory` → `ActionOk`
- `bulkDeactivateCategories` → `ActionOk`

For admin CRUD actions (company, division, location, category) that return `{ success: true, data }` where `data` is the created/updated DB row: annotate as `ActionResponse<{ data: Company }>` etc., importing the entity type from `@/lib/types/database`. If the DB type is complex or not exported, use a generic shape like `ActionResponse<{ data: Record<string, unknown> }>` — but prefer the specific type.

FILE: company-actions.ts (5 actions)
- `createCompany` → `ActionResponse<{ data: Company }>`
- `updateCompany` → `ActionResponse<{ data: Company }>`
- `deactivateCompany` → `DeactivateResponse`
- `reactivateCompany` → `ActionOk`
- `bulkDeactivateCompanies` → `ActionOk`

FILE: company-settings-actions.ts (2 actions)
- `getCompanySettings` — this one returns raw Supabase data, not `{ success }`. Check its actual return shape and annotate accordingly. If it returns `{ success: true }` annotate as `ActionOk`.
- `updateCompanySetting` → `ActionOk`

FILE: division-actions.ts (6 actions)
- `getCompanies` → `ActionResponse<{ data: Company[] }>` (check actual return)
- `createDivision` → `ActionResponse<{ data: Division }>`
- `updateDivision` → `ActionResponse<{ data: Division }>`
- `deactivateDivision` → `DeactivateResponse`
- `reactivateDivision` → `ActionOk`
- `bulkDeactivateDivisions` → `ActionOk`

FILE: job-actions.ts (7 actions)
- `createJob` → `ActionResponse<{ jobId: string; displayId: string }>`
- `updateJob` → `ActionOk`
- `assignJob` → `ActionOk`
- `updateJobStatus` → `ActionOk`
- `cancelJob` → `ActionOk`
- `addJobComment` → `ActionResponse<{ commentId: string }>`
- `deleteJobAttachment` → `ActionOk`

FILE: location-actions.ts (5 actions)
- `createLocation` → `ActionResponse<{ data: Location }>`
- `updateLocation` → `ActionResponse<{ data: Location }>`
- `deactivateLocation` → `DeactivateResponse`
- `reactivateLocation` → `ActionOk`
- `bulkDeactivateLocations` → `ActionOk`

FILE: pm-job-actions.ts (4 actions)
- `savePMChecklistItem` → `ChecklistProgressResponse`
- `savePMChecklistPhoto` → `ActionOk`
- `completePMChecklist` → `ChecklistCompleteResponse`
- `advanceFloatingSchedule` → `AdvanceScheduleResponse`

FILE: profile-actions.ts (2 actions)
- `updateProfile` → `ActionOk`
- `changePassword` → `ActionOk`

FILE: request-actions.ts (12 actions)
- `createRequest` → `ActionResponse<{ requestId: string; displayId: string }>`
- `updateRequest` → `ActionOk`
- `triageRequest` → `ActionOk`
- `cancelRequest` → `ActionOk`
- `rejectRequest` → `ActionOk`
- `completeRequest` → `ActionOk`
- `deleteMediaAttachment` → `ActionOk`
- `acceptRequest` → `ActionOk`
- `rejectCompletedWork` → `ActionOk`
- `submitFeedback` → `ActionOk`
- `getRequestPhotos` → `PhotosResponse`

FILE: schedule-actions.ts (8 actions)
- `createSchedule` → `ActionResponse<{ scheduleId: string }>`
- `updateSchedule` → `ActionOk`
- `deactivateSchedule` → `ActionOk`
- `activateSchedule` → `ActionOk`
- `deleteSchedule` → `ActionOk`
- `getSchedules` → `ActionResponse<{ schedules: unknown[] }>` (check actual type of the schedules array and use it)
- `getSchedulesByAssetId` → same as getSchedules

FILE: template-actions.ts (6 actions)
- `createTemplate` → `ActionResponse<{ templateId: string }>`
- `updateTemplate` → `ActionOk`
- `deactivateTemplate` → `ActionOk`
- `reactivateTemplate` → `ActionOk`
- `getTemplates` → `ActionResponse<{ templates: unknown[] }>` (check actual type)
- `getTemplateById` → `ActionResponse<{ template: unknown }>` (check actual type)

FILE: user-actions.ts (4 actions)
- `getUsers` — check return shape. It may not return `{ success }`. Annotate accordingly.
- `createUser` → `ActionOk`
- `updateUser` → `ActionOk`
- `deactivateUser` → `ActionOk`
- `reactivateUser` → `ActionOk`

FILE: user-company-access-actions.ts (2 actions)
- `getUserCompanyAccess` — check return shape (may return data, not `{ success }`)
- `updateUserCompanyAccess` → `ActionOk`

**IMPORTANT RULES:**
1. Read each file before modifying to check actual return shapes
2. Do NOT change any runtime `return` statements
3. Only add type imports and return type annotations to the async callback
4. If a file already has correct types, skip it
5. For actions that return DB entity data (`{ success: true, data }`) where the entity type is imported from `@/lib/types/database`, use the specific type
6. For actions returning query results (getSchedules, getTemplates, etc.), read the actual return shape and annotate with a specific type — use `unknown` only as last resort
7. Run `npm run build` at the end to verify no type errors were introduced
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>All 76 server actions across 15 files have explicit return type annotations using shared types from lib/types/action-responses.ts. npm run build succeeds with zero type errors. No runtime behavior changed.</done>
</task>

</tasks>

<verification>
1. `npm run build` — zero type errors
2. `npm run lint` — no new lint warnings
3. Spot-check: hover over any imported action in a component and verify the return type is visible in IDE tooltip
4. Grep check: `grep -r "\.action(async" app/actions/ | grep -v "Promise<"` should return zero lines (all actions annotated)
</verification>

<success_criteria>
- lib/types/action-responses.ts exists with ActionResponse<T> base type and 8 specific response types
- All 76 server actions have explicit Promise<SomeResponseType> return type annotations
- Zero runtime changes — all return statements unchanged
- npm run build succeeds
- npm run lint passes
</success_criteria>

<output>
After completion, create `.planning/quick/260318-bnb-standardize-server-action-response-shape/260318-bnb-SUMMARY.md`
</output>
