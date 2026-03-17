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

**Focus: Multi-company security hardening, shared code extraction, and UI cleanup**

- **Multi-company comprehensive fix (quick-81):** Expanded RLS policies for INSERT/UPDATE to support multi-company access. Removed 17 redundant action-level company_id filters. Scoped all export routes to user's accessible companies. Updated page dropdowns to fetch from all accessible companies.
- **Security/correctness bug fixes (quick-79):** Fixed non-RFC-4122 UUIDs in seed scripts. Replaced `.single()` with `.maybeSingle()` where 0 rows is valid. Added duplicate email check on user reactivation. Added company access validation on user creation.
- **Shared helpers extraction (quick-80):** Created `assertCompanyAccess` helper to replace 8 inline company access patterns. Created `isoDateString` Zod helper for date validation. Adopted across 5 action files.
- **Multi-company data isolation (standalone):** Added RLS policies for supporting tables (comments, status changes, media). Updated all detail pages and supporting queries for multi-company scope.
- **UI cleanups:** Removed warranty_expiry column from asset table (quick-82). Moved Transfer button from modal sticky bar to table row actions (quick-83). Removed Type/Interval columns from maintenance schedules table. Fixed primary company display in user form.
- **GSD framework update:** Updated tooling with new UI research/audit agents, autonomous workflow, stats command.

**Total: ~30 commits, ~50 files changed**
