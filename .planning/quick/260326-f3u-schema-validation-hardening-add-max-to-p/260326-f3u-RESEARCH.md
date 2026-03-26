# Quick Task: Schema Validation Hardening - Research

**Researched:** 2026-03-26
**Domain:** Zod schema validation gaps
**Confidence:** HIGH

## Summary

Five schema validation gaps need hardening: unbounded password strings, missing UUID validation on a checklist itemId, and three unbounded arrays. All changes are additive constraints on existing schemas -- no breaking changes expected. Each file and its UI consumers have been verified.

**Primary recommendation:** Apply all five fixes as straightforward Zod constraint additions. Two UI files need `maxLength` attributes added to password inputs. No downstream schema consumers will break since all existing data already conforms to these constraints.

## Findings

### 1. Password fields missing `.max(255)` -- profile-actions.ts (lines 38-39)

**Current state:**
```typescript
currentPassword: z.string().min(1, "Current password is required"),
newPassword: z.string().min(8, "Password must be at least 8 characters"),
```

**Fix:** Add `.max(255)` to both fields. 255 is a reasonable ceiling -- Supabase Auth / bcrypt typically has a 72-byte input limit anyway, but 255 prevents absurd payloads.

**UI consumers requiring `maxLength` attributes:**
- `components/profile/password-change-dialog.tsx` -- has a **duplicate local schema** (line 33-40) with the same gap. This local `passwordSchema` also needs `.max(255)` on `currentPassword`, `newPassword`, AND `confirmPassword`. The `<Input type="password">` elements at lines 110, 125, and 138 need `maxLength={255}`.
- `app/(auth)/update-password/page.tsx` -- uses raw `<input>` elements (NOT the action schema), with `minLength={8}` but no `maxLength`. Add `maxLength={255}` to both password inputs at lines 140 and 159.

**Note:** The password-change-dialog has its own local Zod schema separate from the action schema. Both must be updated.

### 2. `itemId` missing `.uuid()` -- pm-job-actions.ts (lines 19, 107)

**Current state:**
```typescript
// savePMChecklistItem (line 19)
itemId: z.string(),

// savePMChecklistPhoto (line 107)
itemId: z.string(),
```

**Fix:** Change to `z.string().uuid()` on both. The `itemId` references `ChecklistItem.id` from the template schema, which is defined as `z.string().uuid()` in `template-schema.ts` line 8. The UI component (`pm-checklist-item.tsx` line 57) passes `item.item_id` which originates from template UUIDs. No Input element exists for this field -- it is programmatically set.

### 3. `photoUrls` array missing `.max(20)` -- pm-job-actions.ts (line 108)

**Current state:**
```typescript
photoUrls: z.array(z.string().max(2048)),
```

**Fix:** Add `.max(20)` to cap the array length: `z.array(z.string().max(2048)).max(20)`. 20 photos per checklist item is generous. The existing codebase pattern uses `.max(10)` for `photo_ids` in `asset-actions.ts` line 630 and `.max(20)` for dropdown options in `template-schema.ts` line 27.

No UI input to update -- photos are uploaded programmatically.

### 4. `linked_request_ids` array missing `.max(50)` -- job-schema.ts (lines 17, 41)

**Current state:**
```typescript
// createJobSchema (line 17)
linked_request_ids: z.array(z.string().uuid()).default([]),

// updateJobSchema (line 41)
linked_request_ids: z.array(z.string().uuid()).optional(),
```

**Fix:** Add `.max(50)` to both:
- `z.array(z.string().uuid()).max(50).default([])`
- `z.array(z.string().uuid()).max(50).optional()`

50 linked requests per job is far beyond any realistic use case. The UI (`job-form.tsx`) uses a multi-select from eligible requests -- no text input needs `maxLength`.

### 5. `checklist` array missing `.max(100)` -- template-schema.ts (line 52)

**Current state:**
```typescript
checklist: z.array(checklistItemSchema).min(1, 'At least one checklist item required'),
```

**Fix:** Add `.max(100)`: `z.array(checklistItemSchema).min(1, 'At least one checklist item required').max(100, 'Maximum 100 checklist items')`. 100 items per template is generous -- real PM checklists rarely exceed 30-40 items.

The UI components (`template-create-form.tsx`, `template-detail.tsx`) dynamically add items but have no explicit count limit in the UI. The Zod schema constraint will serve as the safety net.

## Change Inventory

| File | Line(s) | Change | UI Impact |
|------|---------|--------|-----------|
| `app/actions/profile-actions.ts` | 38-39 | Add `.max(255)` to both password fields | None (action schema) |
| `components/profile/password-change-dialog.tsx` | 34-36, 110, 125, 138 | Add `.max(255)` to 3 schema fields + `maxLength={255}` to 3 Inputs | Password inputs get maxLength |
| `app/(auth)/update-password/page.tsx` | 140, 159 | Add `maxLength={255}` to 2 raw password inputs | Password inputs get maxLength |
| `app/actions/pm-job-actions.ts` | 19, 107 | Change `z.string()` to `z.string().uuid()` for itemId | None (programmatic) |
| `app/actions/pm-job-actions.ts` | 108 | Add `.max(20)` to photoUrls array | None (programmatic) |
| `lib/validations/job-schema.ts` | 17, 41 | Add `.max(50)` to both linked_request_ids arrays | None (hidden field) |
| `lib/validations/template-schema.ts` | 52 | Add `.max(100)` to checklist array | None (dynamic list) |

## Risks

**Breaking changes: NONE.** All changes are tightening constraints. Existing valid data is well within these limits:
- No one enters 255+ character passwords
- All checklist item IDs are already UUIDs from templates
- No one uploads 20+ photos to a single checklist item
- No one links 50+ requests to a single job
- No template has 100+ checklist items

**Duplicate schema note:** The password-change-dialog has a LOCAL Zod schema that duplicates the action schema. Both must be updated for consistency. This is an existing pattern (the dialog adds `confirmPassword` validation that the action doesn't need).

## Sources

- Direct code inspection of all 5 target files (HIGH confidence)
- Cross-reference with existing `.max()` patterns in `asset-actions.ts` and `template-schema.ts` (HIGH confidence)
- UI consumer verification via grep for all schema field names (HIGH confidence)
