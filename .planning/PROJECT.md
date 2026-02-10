# PROJECT.md — GA Operations Tool

## Vision

A web-based General Affairs (GA) operations tool for a corporate group to centralize internal maintenance requests, job execution, inventory management, and preventive maintenance scheduling. GA staff can receive, triage, and resolve internal requests with full traceability — eliminating manual paperwork and providing management real-time operational visibility.

## Organization Context

- **Structure:** Corporate group with 5-15 subsidiaries sharing a centralized GA team
- **Users:** 100-500 across all subsidiaries
- **Language:** English only
- **Currency:** IDR (Indonesian Rupiah)
- **Design:** Desktop-first

## Roles

| Role | Description |
|------|-------------|
| **General User** | Submits requests, tracks own requests, accepts completed work |
| **GA Staff** | Receives/executes jobs, updates status, manages inventory |
| **GA Lead** | Triages requests, assigns priority/category/PIC, delegates jobs, oversees operations |
| **Finance Approver (CEO)** | Approves/rejects requests that involve money |
| **Admin** | Manages users, companies, locations, divisions, categories, system configuration |

## Access Control

- Division-scoped: users only see data from their own division
- Role-based access control (RBAC) with Supabase Row-Level Security (RLS)
- Admin-only user creation (no self-registration)

## Core Workflows

### Request Flow
1. **Submit** — General User creates a request
2. **GA Triage** — GA Lead assigns category, priority, and PIC
3. **Job Creation** — Job created from request (or standalone)
4. **CEO Approval** — Required if request involves money/budget
5. **Execution** — GA Staff executes job, updates status with GPS capture
6. **Completion** — Job marked complete
7. **Auto-Accept** — 7-day window for requester to accept/reject; auto-accepts if no response
8. **Feedback** — Optional requester feedback after acceptance

### Inventory Management
- Asset CRUD with auto-generated human-readable IDs
- Movement tracking with receiver acceptance workflow
- Invoice upload for assets
- Broken/sold status auto-pauses linked maintenance schedules
- Warranty info visible on dashboard (no active alerts)

### Preventive Maintenance
- Category-specific templates (linear form builder)
- Multiple templates per item allowed
- Scheduling with configurable intervals
- Auto-generates jobs on schedule
- Auto-pauses when item is broken or sold

## Key Features

### Media Handling
- Client-side image compression before upload
- WhatsApp-style image annotation (draw, text overlay)
- Google Vision API for auto-generating image descriptions
- Supabase Storage for file storage

### Communication
- Comment threads on jobs (not real-time chat)
- In-app notification system (bell/inbox)

### Data Management
- Soft delete everything (no hard deletes)
- Excel exports for reports
- Human-readable IDs for requests and jobs
- Deduplication awareness for similar requests

### Accountability
- GPS capture on every job status change
- Full audit trail for all operations

## Authentication

- Google OAuth (primary) + manual email/password login
- Admin-only user creation
- Auth emails only via Supabase (no custom email service)
- Rate limiting on auth endpoints
- Remember me functionality

## Dashboards

- Request volume and age metrics
- Job status distribution
- Inventory counts and movement
- Maintenance due/overdue items

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Storage | Supabase Storage |
| Validation | Zod |
| Deployment | Vercel |
| Vision AI | Google Vision API |

## Non-Functional Requirements

- Multi-tenant data isolation via RLS
- Responsive but desktop-first design
- Soft delete across all entities
- English-only interface
- IDR currency formatting
