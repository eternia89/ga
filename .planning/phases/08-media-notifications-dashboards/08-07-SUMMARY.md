---
phase: 08-media-notifications-dashboards
plan: "07"
subsystem: exports
tags: [excel, exceljs, export, data-table, requests, jobs, inventory, maintenance]
dependency_graph:
  requires:
    - lib/supabase/server
    - lib/constants/request-status
    - components/data-table/data-table-toolbar
  provides:
    - lib/exports/excel-helpers
    - app/api/exports/requests
    - app/api/exports/jobs
    - app/api/exports/inventory
    - app/api/exports/maintenance
  affects:
    - components/data-table/data-table
    - components/requests/request-table
tech_stack:
  added:
    - exceljs (Excel file generation)
  patterns:
    - ExcelJS workbook with styled worksheets
    - fetch+blob+createObjectURL for browser file download
    - Role-based export access control via API route auth check
key_files:
  created:
    - lib/exports/excel-helpers.ts
    - app/api/exports/requests/route.ts
    - app/api/exports/jobs/route.ts
    - app/api/exports/inventory/route.ts
    - app/api/exports/maintenance/route.ts
  modified:
    - components/data-table/data-table-toolbar.tsx
    - components/data-table/data-table.tsx
    - components/requests/request-table.tsx
decisions:
  - "ExcelJS on Node.js runtime only — no edge runtime on export routes"
  - "Export always fetches ALL data regardless of active client-side filters"
  - "Entity-only columns — no cross-entity denormalized data in exports"
  - "Export button only visible to authorized roles (ga_lead, admin, finance_approver for requests/jobs)"
  - "fetch+blob+createObjectURL pattern for browser download — better UX than window.location.href"
metrics:
  duration: 3min
  completed: "2026-02-25"
  tasks_completed: 2
  files_created: 5
  files_modified: 3
---

# Phase 8 Plan 7: Excel Exports Summary

**One-liner:** ExcelJS-powered Excel exports for all major entities (requests, jobs, inventory, maintenance) with blue header styling, frozen rows, thin borders, and toolbar download button.

## What Was Built

### Shared ExcelJS Helpers (`lib/exports/excel-helpers.ts`)

Three utilities shared by all export routes:

- **`createStyledWorkbook(sheetName, columns)`** — Creates an ExcelJS workbook with a frozen header row (`ySplit: 1`) and defined columns
- **`applyStandardStyles(sheet)`** — Applies: bold white text, blue background (FF4472C4) on row 1, height 24, thin borders on all cells, auto-fit column widths (max of header length + 4, min 10)
- **`generateExcelResponse(workbook, filename)`** — Writes buffer and returns `NextResponse` with correct MIME type and `Content-Disposition` header

### Export API Routes

All routes follow the same pattern: auth check → role check → fetch ALL data → build styled workbook → return .xlsx.

| Route | Authorized Roles | Table | Filename |
|-------|-----------------|-------|----------|
| `GET /api/exports/requests` | ga_lead, admin, finance_approver | requests | `requests-export-{dd-MM-yyyy}.xlsx` |
| `GET /api/exports/jobs` | ga_lead, admin, finance_approver | jobs | `jobs-export-{dd-MM-yyyy}.xlsx` |
| `GET /api/exports/inventory` | ga_staff, ga_lead, admin | inventory_items | `inventory-export-{dd-MM-yyyy}.xlsx` |
| `GET /api/exports/maintenance` | ga_lead, admin | maintenance_schedules | `maintenance-export-{dd-MM-yyyy}.xlsx` |

### DataTable Toolbar Export Button

`DataTableToolbar` now accepts an optional `exportUrl?: string` prop. When provided:

- A "Export" button with a `Download` icon from lucide-react appears on the right side of the toolbar (before the create button)
- Uses `fetch` + `blob` + `createObjectURL` approach for file download — reads filename from `Content-Disposition` header
- Shows animated spinner and "Exporting..." text while downloading
- Button is disabled during export to prevent duplicate requests

`DataTable` also accepts `exportUrl` and threads it to the toolbar.

### Request Table Integration

`RequestTable` passes `/api/exports/requests` as `exportUrl` to `DataTable` only when `currentUserRole` is in `['ga_lead', 'admin', 'finance_approver']`. General users and ga_staff do not see the export button on the requests list.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

| Item | Status |
|------|--------|
| ExcelJS installed and in package.json | FOUND |
| lib/exports/excel-helpers.ts | FOUND |
| app/api/exports/requests/route.ts | FOUND |
| app/api/exports/jobs/route.ts | FOUND |
| app/api/exports/inventory/route.ts | FOUND |
| app/api/exports/maintenance/route.ts | FOUND |
| exportUrl prop in toolbar | FOUND |
| TypeScript: 0 errors | PASSED |

## Self-Check: PASSED
