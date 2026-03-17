---
plan: 260317-lu3
status: complete
commits:
  - hash: "5c8a30d"
    message: "fix(quick-260317-lu3): add consistent asset info header to Change Status and Transfer dialogs"
---
# Quick Task 260317-lu3: Summary
## What Changed
- **asset-status-change-dialog.tsx**: Added rounded muted info section at top: display_id + name, brand·model·serial, current status
- **asset-transfer-dialog.tsx**: Same pattern: display_id + name, brand·model·serial, current location. Replaced the old "Current location" subtitle under DialogTitle.
Both match the respond modal's `rounded-md border bg-muted/30 p-4` pattern.
## Tasks: 1/1
