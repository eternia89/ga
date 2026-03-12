---
phase: quick-59
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/seed.sql
  - scripts/seed-ops.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Running npm run seed:ops creates asset categories for fire extinguisher, AC split, genset, and FRP water filter"
    - "Running npm run seed:ops creates at least one asset for each of the four equipment types"
    - "Running npm run seed:ops creates six maintenance templates: one monthly template per equipment type (4), one monthly general cleaning checklist, one weekly general inventory audit"
    - "Running npm run seed:ops creates maintenance schedules that link the new assets to the new templates"
    - "Running npm run wipe:ops removes all new assets, templates, and schedules cleanly (existing wipe logic already handles these tables)"
    - "seed:ops and wipe:ops complete without errors after the changes"
  artifacts:
    - path: "supabase/seed.sql"
      provides: "Four new asset categories (IDs 021-024) for the maintenance equipment types"
      contains: "ASET_PERAWATAN or equivalent asset category names"
    - path: "scripts/seed-ops.ts"
      provides: "New assets and maintenance templates/schedules seeded for Jaknot"
      contains: "seedMaintenanceTemplates updates with 6 templates"
  key_links:
    - from: "supabase/seed.sql (new category IDs 021-024)"
      to: "scripts/seed-ops.ts (CAT map)"
      via: "hardcoded UUID constants referenced in ACAT map"
    - from: "seedMaintenanceTemplates (template IDs)"
      to: "seedMaintenanceSchedules (templateIds param)"
      via: "returned IDs array passed from main()"
    - from: "new asset inventory_items"
      to: "seedMaintenanceSchedules (activeItemIds param)"
      via: "returned activeItemIds from seedJaknotInventory"
---

<objective>
Add seed data for four maintenance-relevant asset categories and equipment assets, then create six maintenance templates (with schedules) covering per-equipment monthly PM and two general checklists.

Purpose: Provide realistic demo data for the maintenance module — showing templates tied to specific equipment categories and general operational checklists.
Output: Updated supabase/seed.sql with 4 new asset categories; updated scripts/seed-ops.ts with new equipment assets, 6 maintenance templates, and their schedules.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@supabase/seed.sql
@scripts/seed-ops.ts
@scripts/wipe-ops.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add four asset categories to seed.sql</name>
  <files>supabase/seed.sql</files>
  <action>
Add four new asset categories under Jaknot (company `00000000-0000-4000-a000-000000000001`) at the end of the categories block, continuing the UUID sequence from the last existing ID (`00000000-0000-4000-a003-000000000020`):

```sql
-- Jaknot — maintenance equipment asset categories (4)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000021', '00000000-0000-4000-a000-000000000001', 'APAR & Fire Safety',    'asset'),
  ('00000000-0000-4000-a003-000000000022', '00000000-0000-4000-a000-000000000001', 'AC Split',              'asset'),
  ('00000000-0000-4000-a003-000000000023', '00000000-0000-4000-a000-000000000001', 'Genset',                'asset'),
  ('00000000-0000-4000-a003-000000000024', '00000000-0000-4000-a000-000000000001', 'Filter Air FRP',        'asset');
```

Insert this block directly after the existing Jaknot CP request category insert (`00000000-0000-4000-a003-000000000020`) and before the auth users section.
  </action>
  <verify>
    <automated>grep -c '00000000-0000-4000-a003-00000000002' supabase/seed.sql</automated>
  </verify>
  <done>seed.sql contains four new category rows with IDs 021-024, all type='asset', company=Jaknot. The grep above returns 4.</done>
</task>

<task type="auto">
  <name>Task 2: Add new assets and maintenance templates/schedules to seed-ops.ts</name>
  <files>scripts/seed-ops.ts</files>
  <action>
Make the following changes to `scripts/seed-ops.ts`:

**1. Extend the CAT constants map** — add four new keys after the existing `kendaraan_jm` entry:

```typescript
  apar_jn:     '00000000-0000-4000-a003-000000000021',
  ac_split_jn: '00000000-0000-4000-a003-000000000022',
  genset_jn:   '00000000-0000-4000-a003-000000000023',
  filter_jn:   '00000000-0000-4000-a003-000000000024',
```

**2. Add four equipment assets to the `ASSET_TEMPLATES` array** — append after the last existing entry (`Mesin Fotokopi Ricoh MP 2014`):

```typescript
  { name: 'APAR Dry Powder 6kg',            cat: 'apar',      brand: 'Protecta',   model: 'DP-6',           cond: 'good'      },
  { name: 'AC Split Daikin 2PK',            cat: 'ac_split',  brand: 'Daikin',     model: 'FTKC60NVM',      cond: 'good'      },
  { name: 'Genset Perkins 100kVA',          cat: 'genset',    brand: 'Perkins',    model: '1103A-33G',      cond: 'good'      },
  { name: 'Filter Air FRP 10 inch',         cat: 'frp_water', brand: 'Pentair',    model: 'FRP-1054',       cond: 'good'      },
```

**3. Extend the `catIdFor` function** — add four new entries to the map inside `catIdFor`:

```typescript
    apar:      CAT.apar_jn,
    ac_split:  CAT.ac_split_jn,
    genset:    CAT.genset_jn,
    frp_water: CAT.filter_jn,
```

**4. Replace `seedMaintenanceTemplates`** — replace the entire function body with 6 templates (keep existing 5 plus add the 2 new general ones, OR rewrite to 6 distinct templates that serve the demo better). Use this set:

Template 1 — Monthly fire extinguisher (category: `CAT.apar_jn`):
```
name: 'Pemeriksaan Bulanan APAR'
description: 'Inspeksi rutin APAR (Alat Pemadam Api Ringan) setiap bulan sesuai standar K3.'
checklist (7 items):
  Cek segel dan pin pengaman APAR masih utuh
  Periksa tekanan pressure gauge (jarum di zona hijau)
  Cek kondisi fisik tabung (tidak berkarat, penyok, atau bocor)
  Bersihkan dan cek selang/nozzle dari kerusakan
  Verifikasi label inspeksi dan tanggal kadaluarsa
  Pastikan APAR mudah dijangkau dan tidak terhalang
  Catat nomor seri dan kondisi dalam log pemeriksaan
```

Template 2 — Monthly AC split service (category: `CAT.ac_split_jn`):
```
name: 'Servis Rutin Bulanan AC Split'
description: 'Pembersihan dan pengecekan AC split setiap bulan untuk menjaga performa optimal.'
checklist (7 items):
  Bersihkan filter udara bagian dalam dengan vakum atau air
  Semprot evaporator dengan cairan pembersih khusus AC
  Cek dan bersihkan saluran pembuangan air kondensasi
  Periksa kondisi remote control dan pengaturan suhu
  Ukur suhu udara keluar (harus 8-12°C di bawah suhu ruangan)
  Cek unit outdoor: bersihkan kondenser dari debu dan daun
  Dokumentasikan kondisi unit dan laporkan anomali
```

Template 3 — Monthly genset maintenance (category: `CAT.genset_jn`):
```
name: 'Perawatan Bulanan Genset'
description: 'Servis dan uji coba genset setiap bulan untuk kesiapan saat listrik PLN padam.'
checklist (7 items):
  Cek level oli mesin dan tambahkan jika kurang
  Periksa level air radiator dan kondisi selang radiator
  Cek kondisi aki: tegangan, air aki, dan terminal
  Bersihkan filter udara dan saringan bahan bakar
  Lakukan uji coba start dan jalankan beban selama 15 menit
  Catat jam operasional dan konsumsi bahan bakar
  Periksa kebocoran oli, air, atau bahan bakar
```

Template 4 — Monthly FRP water filter (category: `CAT.filter_jn`):
```
name: 'Perawatan Bulanan Filter Air FRP'
description: 'Pemeriksaan dan backwash filter air FRP setiap bulan untuk kualitas air bersih.'
checklist (7 items):
  Cek tekanan inlet dan outlet filter (beda tekanan maks 5 PSI)
  Lakukan proses backwash selama 10 menit
  Cek kondisi valve multi-port (tidak bocor atau macet)
  Periksa kondisi media filter (tidak menggumpal)
  Cek kualitas air output (TDS, kekeruhan)
  Bersihkan housing dan area sekitar filter
  Catat tanggal backwash dan kondisi filter dalam log
```

Template 5 — Monthly general cleaning checklist (no category, `category_id: null`):
```
name: 'Checklist Kebersihan Bulanan'
description: 'Checklist pemeriksaan kebersihan umum kantor setiap bulan.'
checklist (8 items):
  Periksa kondisi lantai semua area (bersih, tidak rusak, tidak licin)
  Cek kondisi plafon dan dinding (tidak bocor, tidak berjamur)
  Periksa toilet dan kamar mandi (saluran lancar, tidak bocor)
  Cek kondisi kaca jendela dan pintu (bersih, tidak retak)
  Periksa area dapur/pantry (bersih, peralatan berfungsi)
  Cek area parkir dan loading dock (bebas sampah dan hambatan)
  Verifikasi tempat sampah tersedia di semua titik dan berfungsi
  Dokumentasikan temuan dan tindak lanjut yang diperlukan
```

Template 6 — Weekly 10-pcs employee inventory audit (no category, `category_id: null`):
```
name: 'Audit Inventaris Karyawan 10 Pcs'
description: 'Audit mingguan 10 aset karyawan secara acak untuk memverifikasi kondisi dan keberadaan.'
checklist (6 items):
  Pilih 10 aset secara acak dari daftar inventaris aktif
  Verifikasi keberadaan fisik aset sesuai lokasi tercatat
  Cek kondisi aset (bandingkan dengan kondisi terakhir di sistem)
  Scan atau catat nomor seri / kode aset
  Perbarui kondisi aset di sistem jika ada perubahan
  Laporkan aset yang tidak ditemukan atau kondisinya menurun
```

**5. Update `seedMaintenanceSchedules`** to create schedules for the new templates. The function already receives `templateIds` (now 6 items) and `activeItemIds`. Ensure the schedule generation logic correctly handles 6 templates — if using `templateIds.flatMap`, the existing logic `count = tIdx < 2 ? 3 : 2` will naturally produce 3+3+2+2+2+2 = 14 schedules. For templates 4-5 (cleaning/audit, `category_id: null`), set `item_id` to any active asset (they are general checklists not tied to a specific asset). This is fine — the FK only requires a valid `inventory_items.id`. Use `activeItemIds[(tIdx * 3 + i + 20) % activeItemIds.length]` for templates index 4 and 5 to pick different items. Set `interval_days: 30` for monthly templates (1-5), `interval_days: 7` for the weekly template (6, index 5).

For the schedule interval logic, replace the array-based `interval = [7, 14, 30, 90, 180][tIdx % 5]` with:
```typescript
const interval = tIdx === 5 ? 7 : 30; // template 6 (index 5) = weekly; all others monthly
```

**6. Update `main()` summary log** at the bottom to reflect 6 templates:
```typescript
console.log('  Jaknot  : 110 requests | 60 jobs | 40 assets | 40 movements | 6 templates | 14 schedules');
```
And update the console.log calls:
```typescript
console.log('🗓️  Maintenance templates (6)...');
console.log('📅 Maintenance schedules (14)...');
```

**Do NOT change** the wipe-ops.ts — it already wipes `maintenance_templates` and `maintenance_schedules` in the correct FK order.
  </action>
  <verify>
    <automated>npx tsx scripts/seed-ops.ts --help 2>&1 || npx tsc --noEmit scripts/seed-ops.ts 2>&1 | head -20</automated>
  </verify>
  <done>
    - CAT map has `apar_jn`, `ac_split_jn`, `genset_jn`, `filter_jn` keys with correct UUIDs 021-024
    - ASSET_TEMPLATES has 4 new entries with cat values matching catIdFor map keys
    - catIdFor map handles `apar`, `ac_split`, `genset`, `frp_water`
    - seedMaintenanceTemplates inserts 6 templates (2 with null category_id for general checklists)
    - seedMaintenanceSchedules produces 14 schedules (weekly interval for template index 5)
    - TypeScript compiles without errors on the file
  </done>
</task>

<task type="auto">
  <name>Task 3: Smoke-test the full seed/wipe cycle</name>
  <files></files>
  <action>
Run the wipe and seed scripts in sequence to confirm no runtime errors. This verifies the complete end-to-end cycle with the real database.

Step 1: Wipe operational data
```
npm run wipe:ops
```
Confirm output shows all tables deleted cleanly with no errors.

Step 2: Seed operational data
```
npm run seed:ops
```
Confirm:
- "Maintenance templates (6)..." line appears and shows `✓ 6 templates created`
- "Maintenance schedules (14)..." line appears and shows `✓ 14 schedules created`
- Final summary line reads: `Jaknot  : 110 requests | 60 jobs | 40 assets | 40 movements | 6 templates | 14 schedules`
- Script exits with `✅ Seed complete!`

If any error occurs (Supabase RLS, FK violation, schema mismatch), fix the root cause in seed-ops.ts or seed.sql before marking done.

Note: The new categories in seed.sql only apply on `supabase db reset`. The seed-ops.ts script targets `inventory_items` and `maintenance_*` tables via the service role client (bypasses RLS), so it does not depend on the new category rows existing via seed.sql specifically — as long as the category UUIDs 021-024 exist in the live database. If the categories don't exist yet in the live DB (because supabase db reset hasn't been run), the inventory_items insert for the new equipment assets will fail on FK violation. In that case, add an upsert step at the top of `seedJaknotInventory` (or a dedicated `seedAssetCategories` function called from `main()`) that inserts the four categories with `ON CONFLICT (id) DO NOTHING` via the service role client, so seed-ops.ts is self-contained.
  </action>
  <verify>
    <automated>npm run seed:ops 2>&1 | grep -E '(templates created|schedules created|Seed complete|❌)'</automated>
  </verify>
  <done>Output shows "6 templates created", "14 schedules created", and "Seed complete!" with no errors.</done>
</task>

</tasks>

<verification>
1. `supabase/seed.sql` contains 4 new rows with IDs `00000000-0000-4000-a003-000000000021` through `...024`, all `type='asset'`, company=Jaknot
2. `scripts/seed-ops.ts` TypeScript compiles without errors
3. `npm run seed:ops` completes with `6 templates created`, `14 schedules created`, and `✅ Seed complete!`
4. `npm run wipe:ops` completes cleanly (no changes needed — existing wipe logic already handles these tables)
</verification>

<success_criteria>
- seed.sql has 4 new asset categories (APAR, AC Split, Genset, Filter Air FRP) for Jaknot
- seed-ops.ts seeds 6 maintenance templates: 4 equipment-specific monthly + 1 general monthly cleaning + 1 weekly inventory audit
- Templates 5 and 6 have null `category_id` (general purpose)
- seed-ops.ts seeds 14 maintenance schedules across the 6 templates
- Weekly template (audit) uses `interval_days: 7`; all others use `interval_days: 30`
- Full wipe + reseed cycle completes without errors
</success_criteria>

<output>
After completion, create `.planning/quick/59-seed-ops-data-asset-categories-assets-ma/59-SUMMARY.md`
</output>
