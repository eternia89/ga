---
plan: 260317-n9i
status: complete
commits:
  - hash: "81d05ef"
    message: "fix(quick-260317-n9i): set holder_id in seed data"
---
# Quick Task 260317-n9i: Summary
## What Changed
### scripts/seed-ops.ts
- Added `JN_ALL_USERS` array (9 users: agus, eva, dwiky, ria, hadi, makmur, amil, maldini, rudy)
- Asset creation: `holder_id` set via round-robin across all users for non-sold_disposed assets, null for sold_disposed
- After movement insertion: accepted movements update asset's holder_id to receiver_id

### Distribution
- 30 non-sold assets distributed across 9 holders (~3-4 assets each)
- Hadi (index 4) holds assets at seq 5, 14, 23 → ~3 assets
- sold_disposed assets (seq 31-40) have null holder_id
- Accepted movements override the initial holder with the movement receiver
## Tasks: 1/1
