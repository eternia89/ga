---
phase: 06-inventory
plan: 01
subsystem: inventory
tags: [migration, types, constants, validation, server-actions, file-upload, asset-management, transfer-workflow]
dependency_graph:
  requires: [03-admin-system-configuration, 01-database-schema-supabase-setup]
  provides: [asset-crud-actions, transfer-workflow-actions, asset-photo-upload, asset-invoice-upload]
  affects: [06-02, 06-03, 07-maintenance]
tech_stack:
  added: []
  patterns: [authActionClient-role-check, rpc-display-id-generation, concurrent-transfer-guard, auto-pause-maintenance, entity-type-polymorphic-uploads]
key_files:
  created:
    - supabase/migrations/00009_inventory_phase6.sql
    - lib/constants/asset-status.ts
    - lib/validations/asset-schema.ts
    - app/actions/asset-actions.ts
    - app/api/uploads/asset-photos/route.ts
    - app/api/uploads/asset-invoices/route.ts
  modified:
    - lib/types/database.ts
decisions:
  - sold_disposed is the single terminal state (merges old sold + disposed); old rows updated in migration
  - movement status updated from (pending, in_transit, received, cancelled) to (pending, accepted, rejected, cancelled)
  - unique partial index idx_one_pending_movement enforces one pending transfer per asset at DB level, action also checks in code for clean error
  - maintenance_schedules auto-pause fires on both broken and sold_disposed transitions
  - asset-photos bucket (5MB, images only); asset-invoices bucket (10MB, image+PDF)
  - photo upload API accepts photo_type field and maps to 5 distinct entity_types for polymorphic media_attachments
metrics:
  duration: 4min
  completed: 2026-02-25
  tasks_completed: 2
  files_modified: 7
---

# Phase 6 Plan 1: Inventory Backend Foundation Summary

**One-liner:** Complete inventory backend with AST-YY-NNNN IDs, 9 server actions, concurrent transfer guard, maintenance auto-pause, and dual-bucket file upload (photos + invoices).

## What Was Built

Full backend layer for the Inventory module — no UI, all data/logic/validation:

1. **Migration (00009_inventory_phase6.sql):** Adds brand/model/serial_number/acquisition_date to inventory_items; adds receiver_id/rejection_reason/rejected_at/cancelled_at to inventory_movements; drops and recreates status CHECK constraints (sold_disposed terminal state; pending/accepted/rejected/cancelled for movements); unique partial index for concurrent transfer guard; generate_asset_display_id SECURITY DEFINER function (AST-YY-NNNN pattern); asset-photos (5MB, image) and asset-invoices (10MB, image+PDF) storage buckets; RLS policies on both buckets, inventory_items, and inventory_movements.

2. **Types (lib/types/database.ts):** InventoryItem, InventoryItemWithRelations, InventoryMovement, InventoryMovementWithRelations — all with correct nullable fields matching DB schema.

3. **Constants (lib/constants/asset-status.ts):** ASSET_STATUSES, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_STATUS_TRANSITIONS (sold_disposed has empty array — terminal), MOVEMENT_STATUSES, MOVEMENT_STATUS_LABELS.

4. **Schemas (lib/validations/asset-schema.ts):** 7 Zod schemas — assetCreateSchema, assetEditSchema (same as create), assetStatusChangeSchema, assetTransferSchema, transferAcceptSchema, transferRejectSchema, transferCancelSchema — all with correct max lengths per CLAUDE.md rules.

5. **Server actions (app/actions/asset-actions.ts):** 9 actions using authActionClient with role checks in action body — createAsset (RPC for display ID), updateAsset (blocks sold_disposed edits), changeAssetStatus (validates transitions + auto-pauses maintenance), createTransfer (concurrent guard), acceptTransfer (moves asset location), rejectTransfer, cancelTransfer, getAssetPhotos (asset + transfer photos with signed URLs), getAssetInvoices (signed URLs from asset-invoices bucket).

6. **Photo upload API (app/api/uploads/asset-photos/route.ts):** Accepts photo_type field mapping to 5 entity_types (asset_creation, asset_status_change, asset_transfer_send, asset_transfer_receive, asset_transfer_reject); transfer types use movement_id as entity_id; max 5 files, 5MB each, image-only MIME types.

7. **Invoice upload API (app/api/uploads/asset-invoices/route.ts):** asset_invoice entity_type, asset-invoices bucket; max 5 files, 10MB each, image+PDF MIME types.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 8a6e94e | feat(06-01): database migration, types, constants, and Zod schemas |
| Task 2 | 53eea38 | feat(06-01): server actions and file upload API routes |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Migration file numbered 00009 (not 00008)**
- **Found during:** Task 1
- **Issue:** The plan frontmatter listed filename as `00008_inventory_phase6.sql` but `00008_jobs_phase5.sql` already exists (Phase 5 migration). Using 00008 would conflict.
- **Fix:** Named file `00009_inventory_phase6.sql` instead — sequential numbering preserved.
- **Files modified:** supabase/migrations/00009_inventory_phase6.sql

**2. [Rule 2 - Missing critical functionality] Role guard added to upload API routes**
- **Found during:** Task 2
- **Issue:** Plan spec for upload routes said "auth required" but did not explicitly specify role check. Since these are GA-only operations, added role check (ga_staff, ga_lead, admin) to both upload routes for security.
- **Fix:** Added role check after profile fetch in both API routes.
- **Files modified:** app/api/uploads/asset-photos/route.ts, app/api/uploads/asset-invoices/route.ts

## Self-Check: PASSED

All created files verified to exist. TypeScript compiled with zero errors. Key pattern counts confirmed:
- Constants file: 7 exports (ASSET_STATUSES, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_STATUS_TRANSITIONS, MOVEMENT_STATUSES, MOVEMENT_STATUS_LABELS, AssetStatus/MovementStatus types)
- Schema file: 14 export lines (7 schemas + 7 type exports)
- Asset actions: 9 exported server actions
- generate_asset_display_id: 3 references in migration (function header, UPDATE, INSERT)
- maintenance_schedules auto-pause: confirmed in changeAssetStatus
- 5 distinct entity_types mapped in photo upload route
