---
plan: 260318-bah
status: complete
commits:
  - hash: "54a3b7d"
    message: "fix(quick-260318-bah): 5 security/correctness fixes in asset transfer actions"
---
# Quick Task 260318-bah: Summary
## What Changed
### app/actions/asset-actions.ts
1. **createTransfer**: Added `receiver.company_id !== asset.company_id` check after fetching receiver
2. **acceptTransfer**: Added rollback — if asset update fails, movement reverted to pending with null received_by/received_at
3. **createTransfer (location-only)**: Added `holder_id: null` to the asset update to clear stale holder
4. **cancelTransfer**: Added `.eq('company_id', movement.company_id)` to adminSupabase update

### components/assets/asset-transfer-respond-modal.tsx
5. Added `response.ok` check on both photo upload calls (accept + reject). Shows warning via InlineFeedback, calls onSuccess + router.refresh so action isn't blocked
## Tasks: 1/1
