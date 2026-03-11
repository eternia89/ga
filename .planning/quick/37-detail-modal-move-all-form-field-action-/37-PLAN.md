---
phase: quick-37
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-view-modal.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "All view modal action buttons that trigger mutations appear exclusively in the sticky bottom bar"
    - "Asset view modal has no duplicate action buttons between the inline section and the sticky bar"
    - "Transfer, Accept Transfer, Reject Transfer, Cancel Transfer dialogs still open correctly from the sticky bar"
    - "Post Comment (in job modal timeline) and Add Invoice File stay in their current inline positions"
    - "asset-detail-client.tsx (full detail page) is not touched — inline AssetDetailActions there is correct"
  artifacts:
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Asset view modal with action buttons consolidated to sticky bar only"
      contains: "AssetTransferDialog, AssetTransferRespondDialog rendered outside DialogContent"
  key_links:
    - from: "components/assets/asset-view-modal.tsx sticky bar"
      to: "AssetTransferDialog, AssetTransferRespondDialog"
      via: "showTransferDialog, showTransferRespondDialog state"
      pattern: "setShowTransferDialog|setShowTransferRespondDialog"
---

<objective>
Consolidate action buttons in asset-view-modal.tsx so they appear only in the sticky bottom bar, eliminating the duplicate button set that currently appears inline in the scrollable left column via `AssetDetailActions`.

Purpose: UI consistency — all view modals should have action buttons only in the sticky bottom bar, not scattered inline.
Output: `asset-view-modal.tsx` with `AssetDetailActions` removed from the left column, dialogs wired directly.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Interfaces used in this task:

From `components/assets/asset-detail-actions.tsx`:
```typescript
// This component renders: Transfer button, Accept Transfer, Reject Transfer, Cancel Transfer buttons
// AND manages: AssetTransferDialog, AssetTransferRespondDialog, cancel AlertDialog internally
// It is currently rendered inline in asset-view-modal.tsx left column (lines 468-483)
// It is also used in asset-detail-client.tsx (full page) — leave that one alone
export function AssetDetailActions({
  asset, pendingTransfer, currentUserId, currentUserRole,
  onTransfer, onTransferRespond,
  showTransferDialog, onTransferDialogChange,
  showTransferRespondDialog, onTransferRespondDialogChange, transferRespondMode,
  locations, gaUsers, onActionSuccess,
}: AssetDetailActionsProps)
```

From `components/assets/asset-transfer-dialog.tsx`:
```typescript
// Opens when Transfer button is clicked
export function AssetTransferDialog({ open, onOpenChange, asset, currentLocationName, gaUsers, locationNames, onSuccess })
```

From `components/assets/asset-transfer-respond-dialog.tsx`:
```typescript
// Opens when Accept/Reject Transfer is clicked
export function AssetTransferRespondDialog({ open, onOpenChange, movement, mode, onSuccess })
```

Current sticky bar in asset-view-modal.tsx already renders (lines 507-533):
- Save Changes (form submit)
- Change Status → opens showStatusDialog
- Transfer → setShowTransferDialog(true)
- Accept Transfer → openTransferRespond('accept')
- Reject Transfer → openTransferRespond('reject')

The AssetDetailActions inline section (lines 468-483) renders the SAME Transfer/Accept/Reject buttons plus Cancel Transfer — all duplicating the sticky bar.

Cancel Transfer in AssetDetailActions uses its own internal AlertDialog state (`cancelOpen`). We need to bring Cancel Transfer into the sticky bar too, with its own state in the modal.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove AssetDetailActions from left column, wire dialogs directly in modal</name>
  <files>components/assets/asset-view-modal.tsx</files>
  <action>
    The goal: remove the `AssetDetailActions` inline render from the left column and instead wire its dialog components directly into the modal, adding Cancel Transfer to the sticky bar.

    Step 1 — Remove `AssetDetailActions` import and its render from the left column.
    The left column currently renders:
    ```tsx
    <AssetDetailActions
      asset={asset}
      pendingTransfer={pendingTransfer}
      ...
    />
    ```
    Delete this entire block (lines ~468-483 in the current file).

    Step 2 — Add imports for components that `AssetDetailActions` was housing:
    - `AssetTransferDialog` from `./asset-transfer-dialog`
    - `AssetTransferRespondDialog` from `./asset-transfer-respond-dialog`
    - `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` from `@/components/ui/alert-dialog`
    - `cancelTransfer` from `@/app/actions/asset-actions`
    - `Ban` from `lucide-react`
    - `GAUserWithLocation` type from `./asset-transfer-dialog`

    Remove the `AssetDetailActions` import since it will no longer be used in this file.

    Step 3 — Add Cancel Transfer state variables alongside existing state in the component:
    ```tsx
    const [showCancelTransferDialog, setShowCancelTransferDialog] = useState(false);
    const [cancelTransferLoading, setCancelTransferLoading] = useState(false);
    const [cancelTransferError, setCancelTransferError] = useState<string | null>(null);
    ```

    Step 4 — Add Cancel Transfer handler:
    ```tsx
    const handleCancelTransfer = async () => {
      if (!pendingTransfer) return;
      setCancelTransferLoading(true);
      setCancelTransferError(null);
      try {
        const result = await cancelTransfer({ movement_id: pendingTransfer.id });
        if (result?.serverError) {
          setCancelTransferError(result.serverError);
          return;
        }
        setShowCancelTransferDialog(false);
        handleActionSuccess();
      } catch (err) {
        setCancelTransferError(err instanceof Error ? err.message : 'Failed to cancel transfer');
      } finally {
        setCancelTransferLoading(false);
      }
    };
    ```

    Step 5 — Add Cancel Transfer button to the sticky bar. The sticky bar currently has buttons split into left (`ga_staff+` actions) and right (receiver actions). Add Cancel Transfer to the right side after Reject Transfer:

    Permission check: `canCancelTransfer = !!pendingTransfer && (pendingTransfer.initiated_by === currentUserId || currentUserRole === 'admin')`

    In the sticky bar right-side div, add:
    ```tsx
    {canCancelTransfer && (
      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowCancelTransferDialog(true)}>
        <Ban className="mr-2 h-4 w-4" />
        Cancel Transfer
      </Button>
    )}
    ```

    Step 6 — Render dialogs outside DialogContent (after the closing `</Dialog>` tag, before the final `</>`). Add:
    ```tsx
    {/* Transfer dialogs — rendered outside DialogContent for z-index stacking */}
    {asset && (
      <>
        <AssetTransferDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          asset={asset}
          currentLocationName={asset.location?.name ?? ''}
          gaUsers={gaUsers as GAUserWithLocation[]}
          locationNames={Object.fromEntries(locations.map((l) => [l.id, l.name]))}
          onSuccess={handleActionSuccess}
        />
        {pendingTransfer && (
          <AssetTransferRespondDialog
            open={showTransferRespondDialog}
            onOpenChange={setShowTransferRespondDialog}
            movement={pendingTransfer}
            mode={transferRespondMode}
            onSuccess={handleActionSuccess}
          />
        )}
        <AlertDialog open={showCancelTransferDialog} onOpenChange={setShowCancelTransferDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Transfer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this pending transfer? The asset will remain at its current location.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {cancelTransferError && (
              <InlineFeedback type="error" message={cancelTransferError} onDismiss={() => setCancelTransferError(null)} />
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelTransferLoading}>Keep Transfer</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelTransfer}
                disabled={cancelTransferLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelTransferLoading ? 'Cancelling...' : 'Cancel Transfer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )}
    ```

    Note: The `AssetStatusChangeDialog` is already rendered inside DialogContent at the bottom — leave it there (it works fine in its current position).

    After these changes, the left column should only contain `AssetDetailInfo` (no action buttons), and all asset actions live in the sticky bar.

    Run `npm run build` to confirm no TypeScript errors. If there are type errors on `gaUsers`, cast it: `gaUsers as GAUserWithLocation[]` since `gaUsers` state type is `{ id: string; name: string; location_id: string | null }[]` which matches `GAUserWithLocation`.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `AssetDetailActions` no longer imported or rendered in `asset-view-modal.tsx`
    - Left column contains only `AssetDetailInfo`
    - Sticky bar contains: Save Changes, Change Status, Transfer, Accept Transfer, Reject Transfer, Cancel Transfer (all conditionally shown)
    - `AssetTransferDialog`, `AssetTransferRespondDialog`, Cancel Transfer `AlertDialog` render outside `DialogContent`
    - `npm run build` passes with no errors
  </done>
</task>

</tasks>

<verification>
After task completes:
1. Open the app, navigate to Inventory, click View on any asset
2. Confirm the left column shows only info fields (no action buttons)
3. Sticky bar shows the appropriate action buttons for the current user/asset state
4. Click Transfer → AssetTransferDialog opens correctly
5. For an asset with pending transfer where current user is receiver: Accept Transfer / Reject Transfer buttons appear and open AssetTransferRespondDialog
6. For an asset with pending transfer where current user is initiator or admin: Cancel Transfer button appears and AlertDialog opens
7. `npm run lint` passes
</verification>

<success_criteria>
- Zero inline action buttons in the asset view modal scrollable area
- All asset mutation actions reachable exclusively from the sticky bottom bar
- No regressions on job modal (Post Comment stays inline), request modal, schedule modal, template modal
- Build succeeds with no TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/37-detail-modal-move-all-form-field-action-/37-SUMMARY.md`
</output>
