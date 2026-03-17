---
phase: quick
plan: 260317-fot
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
  - app/actions/asset-actions.ts
autonomous: true
requirements: [QUICK-BLOCK-TRANSFER-UNDER-REPAIR]

must_haves:
  truths:
    - "Transfer button is hidden for assets with under_repair status"
    - "Change Status button still works for under_repair assets (not blocked)"
    - "createTransfer server action rejects under_repair assets with clear error message"
  artifacts:
    - path: "components/assets/asset-columns.tsx"
      provides: "Separate canTransfer guard that blocks under_repair"
      contains: "canTransfer"
    - path: "app/actions/asset-actions.ts"
      provides: "under_repair check in createTransfer action"
      contains: "under_repair"
  key_links: []
---

<objective>
Block asset transfers for under_repair status. Hide the Transfer button from table row actions and add server-side validation in createTransfer.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-columns.tsx
@app/actions/asset-actions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Separate canTransfer from canChangeStatus and block under_repair</name>
  <files>components/assets/asset-columns.tsx, app/actions/asset-actions.ts</files>
  <action>
**asset-columns.tsx:**
1. After `canChangeStatus`, add a separate `canTransfer` variable:
   ```typescript
   const canTransfer =
     canChangeStatus &&
     asset.status !== 'under_repair';
   ```
2. Change the Transfer button guard from `{canChangeStatus && (` to `{canTransfer && (`.
   The Change Status button keeps `canChangeStatus` — unaffected.

**asset-actions.ts:**
1. In `createTransfer` action, after the `sold_disposed` check (line ~238), add:
   ```typescript
   if (asset.status === 'under_repair') {
     throw new Error('Cannot transfer an asset that is under repair');
   }
   ```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    - Transfer button hidden for under_repair assets
    - Change Status still visible for under_repair assets
    - Server action rejects under_repair with clear error message
  </done>
</task>

</tasks>

<output>
After completion, create `.planning/quick/260317-fot-block-asset-transfer-for-under-repair-st/260317-fot-SUMMARY.md`
</output>
