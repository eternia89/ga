# GA Operations Tool — Product Requirements (User-Facing)

> This PRD is a representation of what this app is about, written for humans to understand the concept, features, goals, and purpose.

## What Is This?

A web-based General Affairs (GA) operations tool for a corporate group (5–15 subsidiaries, 100–500 users). It centralizes internal maintenance requests, job execution, inventory management, and preventive maintenance scheduling — replacing manual paperwork with full digital traceability and management visibility.

## Who Uses It?

| Role | What They Do |
|------|-------------|
| **General User** | Submits maintenance/service requests, tracks their own requests, accepts/rejects completed work |
| **GA Staff** | Executes assigned jobs, updates status with GPS capture, manages asset inventory |
| **GA Lead** | Triages incoming requests, assigns priority/category/PIC, delegates jobs, oversees all operations |
| **Finance Approver (CEO)** | Approves or rejects jobs that require budget expenditure |
| **Admin** | Manages users, companies, divisions, locations, categories, and system configuration |

## Core Workflows

### Request → Job → Completion
1. A General User submits a maintenance/service request
2. GA Lead triages it — assigns category, priority, and person-in-charge (PIC)
3. A job is created from the request (or standalone by GA staff)
4. If budget is involved, Finance Approver must approve first
5. GA Staff executes the job, updating status with GPS-verified check-ins
6. On completion, the requester has 7 days to accept or reject — auto-accepts if no response
7. Optional feedback after acceptance

### Asset Inventory
- Full asset CRUD with auto-generated display IDs (e.g., `AST-AC26-001`)
- Movement tracking between locations with receiver acceptance workflow
- Invoice upload, warranty tracking
- When assets are marked broken/sold, linked maintenance schedules auto-pause

### Preventive Maintenance
- Category-specific templates with configurable checklist items
- Scheduling with intervals (daily, weekly, monthly, etc.)
- Auto-generates PM jobs on schedule
- Auto-pauses when linked asset is broken or sold
- Transfer workflow for assets between companies

## Key Features
- **Multi-company access:** Users can access data across multiple subsidiaries they're authorized for
- **Photo uploads** with client-side compression and WhatsApp-style annotation
- **Google Vision AI** auto-generates image descriptions
- **Comment threads** on jobs for team communication
- **In-app notifications** (bell/inbox)
- **Excel exports** for reports
- **Soft delete** everywhere — deactivate/reactivate instead of permanent deletion
- **Full audit trail** with GPS capture on every status change
- **Dashboard** with request volume, job status, inventory counts, and maintenance due/overdue metrics

## Tech Stack
Next.js 16 (App Router), TypeScript (strict), React 19, shadcn/ui + Tailwind CSS v4, Supabase (PostgreSQL + Auth + Storage), Zod validation, Vercel deployment.

---

## Recent Development Activity

### 17-Mar-2026

**Focus: Asset transfer workflow hardening, custody tracking, and multi-company security**

**Morning — Multi-company & security (quick-79–83):**
- Expanded RLS write policies (migration 00027). Removed 17 redundant company filters. Scoped exports.
- Fixed RFC-4122 UUIDs, `.single()` → `.maybeSingle()`, duplicate email on reactivate.
- Extracted `assertCompanyAccess` + `isoDateString` shared helpers (quick-80).
- UI cleanups: removed warranty_expiry column, moved Transfer to table row actions.

**Afternoon — Asset transfer hardening (quick-91–111, 20 tasks):**
- **Transfer scoping (quick-91):** Scoped transfer dialog users/locations to asset's company.
- **Receiver respond flow (quick-92):** Created `AssetTransferRespondModal` with accept/reject/reason/photos.
- **Notification logging (quick-93):** Added `.catch()` error logging to all 15 `createNotifications` calls.
- **Transfer validation (quick-94–99):** In-transit badge overwrite, Edit Transfer for admins, block under_repair/broken transfers, prevent same-location moves, receiver name in table.
- **Component consolidation (quick-100):** Merged old respond dialog into single `AssetTransferRespondModal`.
- **UX polish (quick-101–105):** Receiver active validation, initialMode prop, action-specific success messages, lightbox z-index fix.
- **UI audit fixes (quick-106–108):** Removed auto-redirect, fixed blue shade, improved error messages.
- **Custody tracking (quick-109):** Added `holder_id` column to `inventory_items` — tracks who physically holds each asset. Display in table, modal, detail page.
- **Seed data (quick-110):** Set holder_id in seed data (round-robin across Jaknot users).
- **Transfer to any user (quick-111):** Allow transferring to any user in company, not just GA roles.

**Total: ~58 commits, ~80 files changed**
