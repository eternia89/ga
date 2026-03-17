---
plan: 260317-lxl
status: complete
commits:
  - hash: "45b4a45"
    message: "fix(quick-260317-lxl): filter inventory for general users"
---
# Quick Task 260317-lxl: Summary
## What Changed
### app/(dashboard)/inventory/page.tsx
- Added `location_id` to profile select query
- General users (`general_user` role): inventory query filtered to show only assets at their location OR assets with pending transfers where they are the receiver
- Handles 4 edge cases: location+transfers, transfers-only, location-only, neither
- All other roles (ga_staff, ga_lead, admin, finance_approver) continue to see all assets
- Uses Supabase `.or()` filter with dynamic condition string for combined queries
## Tasks: 1/1
