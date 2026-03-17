---
plan: 260317-g1o
status: complete
started: 2026-03-17T04:33:00.000Z
finished: 2026-03-17T04:34:00.000Z
duration_minutes: 1
commits:
  - hash: "1280929"
    message: "fix(quick-260317-g1o): block asset transfer for broken status in UI and server action"
---
# Quick Task 260317-g1o: Summary
## What Changed
- `asset-columns.tsx`: Added `&& asset.status !== 'broken'` to `canTransfer` guard
- `asset-actions.ts`: Added `if (asset.status === 'broken')` check in `createTransfer` throwing clear error
## Tasks: 1/1
