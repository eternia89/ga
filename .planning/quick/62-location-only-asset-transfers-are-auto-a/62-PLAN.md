---
phase: quick-62
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/asset-actions.ts
  - components/assets/asset-transfer-dialog.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Transferring an asset to a location (no receiver) completes immediately — no pending state, no accept step"
    - "The asset's location_id updates to the destination as soon as the location-only transfer is submitted"
    - "Photos are optional (not required) when doing a location-only transfer"
    - "Transferring to a user still creates a pending movement requiring receiver acceptance (unchanged)"
    - "Cancelling a location-only transfer is not possible — it never enters pending state"
  artifacts:
    - path: "app/actions/asset-actions.ts"
      provides: "createTransfer auto-accepts location-only movements"
      contains: "status: 'accepted'"
    - path: "components/assets/asset-transfer-dialog.tsx"
      provides: "Location mode removes photos requirement and shows instant feedback"
  key_links:
    - from: "asset-transfer-dialog.tsx (mode=location)"
      to: "createTransfer action"
      via: "receiver_id: undefined"
      pattern: "receiver_id.*undefined"
    - from: "createTransfer action"
      to: "inventory_items.location_id"
      via: "auto-update when receiver_id is null"
      pattern: "to_location_id.*item_id"
---

<objective>
Location-only asset transfers (Move to Location mode, no receiver user) should be immediately accepted without a pending state — there is no receiver to accept the transfer, so the asset moves directly to the destination.

Purpose: Eliminate a broken flow where location-only transfers get stuck in "pending" with no way to accept them (since acceptTransfer checks receiver_id === profile.id, which fails for NULL).
Output: createTransfer auto-accepts when receiver_id is absent; dialog removes the photo requirement for location-only mode.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Auto-accept location-only movements in createTransfer action</name>
  <files>app/actions/asset-actions.ts</files>
  <action>
In the `createTransfer` action (around line 261), after all validation passes, branch on whether `parsedInput.receiver_id` is present:

**When receiver_id IS provided (user transfer — unchanged):**
Insert with `status: 'pending'`, do NOT update asset location. Return `{ success: true, movementId: data.id }` as today.

**When receiver_id is NOT provided (location-only transfer — new auto-accept path):**
1. Insert the movement row with `status: 'accepted'`, `received_by: profile.id`, `received_at: new Date().toISOString()`. receiver_id remains null.
2. Immediately update `inventory_items` set `location_id = parsedInput.to_location_id` where `id = parsedInput.asset_id`.
3. If either DB call errors, throw the error message.
4. Revalidate and return `{ success: true, movementId: data.id }`.

The insert block should look like:
```ts
const isLocationOnly = !parsedInput.receiver_id;

const { data, error } = await supabase
  .from('inventory_movements')
  .insert({
    company_id: profile.company_id,
    item_id: parsedInput.asset_id,
    from_location_id: asset.location_id,
    to_location_id: parsedInput.to_location_id,
    initiated_by: profile.id,
    receiver_id: parsedInput.receiver_id ?? null,
    status: isLocationOnly ? 'accepted' : 'pending',
    received_by: isLocationOnly ? profile.id : null,
    received_at: isLocationOnly ? new Date().toISOString() : null,
    notes: parsedInput.notes ?? null,
  })
  .select('id')
  .single();

if (error) throw new Error(error.message);

if (isLocationOnly) {
  const { error: itemError } = await supabase
    .from('inventory_items')
    .update({ location_id: parsedInput.to_location_id })
    .eq('id', parsedInput.asset_id);
  if (itemError) throw new Error(itemError.message);
}
```

Do not touch acceptTransfer, rejectTransfer, or cancelTransfer — they are unchanged.
  </action>
  <verify>npm run build 2>&1 | grep -E "error|Error" | head -20; echo "Build check done"</verify>
  <done>createTransfer inserts accepted movement and updates asset location when receiver_id is absent. User-mode transfers still create pending movements unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Remove photo requirement and update submit label for location-only transfer mode</name>
  <files>components/assets/asset-transfer-dialog.tsx</files>
  <action>
Two changes in `AssetTransferDialog`:

**1. Make photos optional in location mode (canSubmit):**
Change the `canSubmit` computation (around line 93) so location mode does NOT require photos:
```ts
const canSubmit =
  mode === 'user'
    ? receiverId !== '' && resolvedLocationId !== '' && photos.length > 0
    : toLocationId !== '';
```

**2. Remove the photos section entirely in location mode:**
The `PhotoUpload` section (starting around line 278 "Condition Photos") is always rendered regardless of mode. Wrap it in a conditional so it only shows in user mode:
```tsx
{mode === 'user' && (
  <div className="space-y-1.5">
    <Label>
      Condition Photos <span className="text-destructive">*</span>
    </Label>
    <p className="text-xs text-muted-foreground">
      Document the asset condition before transfer. At least 1 photo required.
    </p>
    <PhotoUpload
      onChange={setPhotos}
      maxPhotos={5}
      required
      showCount
      disabled={isSubmitting}
      enableAnnotation={false}
    />
  </div>
)}
```

**3. Update submit button text for location mode:**
Change the submit button label from `'Move Asset'` to `'Move Asset'` — keep this as is, it already reads correctly. No change needed here.

Also add a small helper text below the location combobox in location mode explaining the immediate move:
```tsx
{mode === 'location' && toLocationId && (
  <p className="text-xs text-muted-foreground">
    Asset will be moved to this location immediately.
  </p>
)}
```

Place this p tag right after the Combobox closing tag inside the "Location Transfer mode" block.
  </action>
  <verify>npm run build 2>&1 | grep -E "error|Error" | head -20; echo "Build check done"</verify>
  <done>Location mode shows no photo upload section, canSubmit only requires toLocationId, and a helper message confirms immediate move.</done>
</task>

</tasks>

<verification>
After both tasks:
1. `npm run build` passes with no TypeScript errors
2. In the app: open Transfer dialog in location mode — no photo upload shown, submit button enabled once location is selected
3. In the app: open Transfer dialog in user mode — photo upload still required, unchanged behavior
4. Check DB after a location-only transfer: movement row has `status=accepted`, `received_at` set; asset row has updated `location_id`
5. No Accept/Reject buttons appear for location-only transfers (since movement never enters pending state — view modal button guard `pendingTransfer.receiver_id === currentUserId` is already correct)
</verification>

<success_criteria>
- Location-only asset transfers complete immediately (status=accepted, location updated) in a single createTransfer call
- No pending movement is created for location-only mode — the flow has no accept step
- User-mode transfers are completely unchanged
- Photos are optional (not shown) for location-only transfers
- Build passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/62-location-only-asset-transfers-are-auto-a/62-SUMMARY.md`
</output>
