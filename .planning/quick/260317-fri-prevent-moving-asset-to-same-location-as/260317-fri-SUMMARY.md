---
plan: 260317-fri
status: complete
started: 2026-03-17T04:21:00.000Z
finished: 2026-03-17T04:22:00.000Z
duration_minutes: 1
commits:
  - hash: pending
    message: "fix(quick-260317-fri): prevent moving asset to same location as current"
---

# Quick Task 260317-fri: Summary

## What Changed

### components/assets/asset-transfer-dialog.tsx
- `locationOptions` now filters out `asset.location_id` so the current location cannot be selected as destination

### app/actions/asset-actions.ts
- Added `if (parsedInput.to_location_id === asset.location_id)` guard before the insert, throwing "Destination location is the same as the current location"

## Tasks Completed: 1/1
