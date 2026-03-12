---
phase: quick-59
plan: 01
subsystem: seed-data
tags: [seed, maintenance, assets, templates, schedules]
dependency_graph:
  requires: []
  provides: [maintenance-seed-data, asset-categories-021-024]
  affects: [scripts/seed-ops.ts, supabase/seed.sql]
tech_stack:
  added: []
  patterns: [self-contained-upsert, service-role-bypass-rls]
key_files:
  created: []
  modified:
    - supabase/seed.sql
    - scripts/seed-ops.ts
decisions:
  - seedMaintenanceAssetCategories upserts the 4 new categories via service role client so seed-ops.ts is self-contained and works without running supabase db reset first
  - Template 5 (weekly inventory audit) uses interval_days=7; all others monthly (30 days)
  - General checklist templates (cleaning, audit) use null category_id; use offset item picks so different assets are selected vs the equipment-specific templates
  - Schedule count formula: 3+3+2+2+2+2=14 from the existing tIdx<2?3:2 count logic applied to 6 templates
metrics:
  duration: 12min
  completed_date: 2026-03-12
---

# Phase quick-59 Plan 01: Seed Ops Data — Asset Categories, Assets, Maintenance Templates and Schedules Summary

One-liner: Added 4 maintenance equipment asset categories (IDs 021-024), self-contained category upsert, 4 new equipment assets, and rewrote maintenance templates from 5 to 6 (4 equipment-specific monthly PM + 1 monthly cleaning + 1 weekly inventory audit) producing 14 schedules.

## What Was Built

Expanded seed data for the maintenance module:

**seed.sql** — 4 new asset categories for Jaknot (company 001), continuing UUID sequence from 020:
- `00000000-0000-4000-a003-000000000021`: APAR & Fire Safety (asset)
- `00000000-0000-4000-a003-000000000022`: AC Split (asset)
- `00000000-0000-4000-a003-000000000023`: Genset (asset)
- `00000000-0000-4000-a003-000000000024`: Filter Air FRP (asset)

**scripts/seed-ops.ts** changes:
1. `CAT` map extended with `apar_jn`, `ac_split_jn`, `genset_jn`, `filter_jn` keys
2. `ASSET_TEMPLATES` extended with 4 equipment entries (APAR Dry Powder 6kg, AC Split Daikin 2PK, Genset Perkins 100kVA, Filter Air FRP 10 inch)
3. `catIdFor()` extended to handle `apar`, `ac_split`, `genset`, `frp_water` keys
4. `seedMaintenanceAssetCategories()` — new function that upserts the 4 categories via service role (self-contained, no db reset required)
5. `seedMaintenanceTemplates()` — rewritten from 5 templates to 6:
   - Template 1: Pemeriksaan Bulanan APAR (category: apar_jn, 7 items)
   - Template 2: Servis Rutin Bulanan AC Split (category: ac_split_jn, 7 items)
   - Template 3: Perawatan Bulanan Genset (category: genset_jn, 7 items)
   - Template 4: Perawatan Bulanan Filter Air FRP (category: filter_jn, 7 items)
   - Template 5: Checklist Kebersihan Bulanan (category: null, 8 items)
   - Template 6: Audit Inventaris Karyawan 10 Pcs (category: null, 6 items)
6. `seedMaintenanceSchedules()` — updated interval logic: `tIdx === 5 ? 7 : 30` (template 6 weekly, all others monthly); 3+3+2+2+2+2=14 schedules total
7. `main()` summary logs updated to reflect 6 templates and 14 schedules

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add four asset categories to seed.sql | c0971c6 | supabase/seed.sql |
| 2 | Add new assets and maintenance templates/schedules to seed-ops.ts | e669372 | scripts/seed-ops.ts |
| 3 | Smoke-test the full seed/wipe cycle | 3c2c139 | scripts/seed-ops.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FK violation: new categories not in live DB**
- **Found during:** Task 3 (smoke-test)
- **Issue:** `seed-ops.ts` inserts `inventory_items` with `category_id` referencing IDs 021-024. These IDs only exist in `seed.sql` which applies on `supabase db reset`. The live DB did not have them, causing FK violation.
- **Fix:** Added `seedMaintenanceAssetCategories()` function that upserts the 4 categories via service role client with `onConflict: 'id'` (idempotent). Called from `main()` before `seedJaknotInventory`.
- **Files modified:** scripts/seed-ops.ts
- **Commit:** 3c2c139

## Verification Results

All success criteria met:

1. `supabase/seed.sql` contains 4 new rows with IDs 021-024, all `type='asset'`, company=Jaknot
2. `scripts/seed-ops.ts` TypeScript compiles without errors (verified with `npx tsc --noEmit`)
3. `npm run seed:ops` output: "6 templates created", "14 schedules created", "Seed complete!"
4. `npm run wipe:ops` cleanly removes 14 schedules, 6 templates, 50 items (40+10), 40 movements, 6 counters

## Self-Check: PASSED

- supabase/seed.sql: IDs 021-024 present with correct type='asset' and company=Jaknot
- scripts/seed-ops.ts: TypeScript no errors
- Commits c0971c6, e669372, 3c2c139 verified in git log
- Smoke test output matches expected: 6 templates, 14 schedules, no errors
