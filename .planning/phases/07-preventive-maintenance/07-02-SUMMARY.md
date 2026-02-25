---
phase: 07-preventive-maintenance
plan: 02
subsystem: maintenance-template-ui
tags: [dnd-kit, template-builder, drag-and-drop, react-hook-form, data-table, sidebar]
dependency_graph:
  requires: [07-01, 03-admin-system-configuration]
  provides: [template-builder-ui, template-list-page, template-create-page, template-detail-page, maintenance-sidebar]
  affects: [sidebar.tsx, maintenance-templates-route]
tech_stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2"]
  patterns: [DndContext-SortableContext, react-hook-form-zod, DataTable-with-meta, inline-edit-toggle, authActionClient-server-actions]
key_files:
  created:
    - components/maintenance/template-builder.tsx
    - components/maintenance/template-builder-item.tsx
    - components/maintenance/template-columns.tsx
    - components/maintenance/template-list.tsx
    - components/maintenance/template-create-form.tsx
    - components/maintenance/template-detail.tsx
    - app/(dashboard)/maintenance/templates/page.tsx
    - app/(dashboard)/maintenance/templates/new/page.tsx
    - app/(dashboard)/maintenance/templates/[id]/page.tsx
  modified:
    - components/sidebar.tsx
    - package.json
    - package-lock.json
decisions:
  - "TemplateCreateForm and TemplateDetail are separate components (not a shared form component) for clarity — create navigates away, edit stays on page with inline toggle"
  - "Sidebar Templates nav item activated at plan 02 completion; Schedules remains built: false until plan 03"
  - "Template detail page uses max-w-3xl layout matching the create page for visual consistency"
metrics:
  duration: "4 min"
  completed_date: "2026-02-25"
  tasks: 2
  files: 11
---

# Phase 7 Plan 02: Template Builder UI Summary

**One-liner:** dnd-kit drag-and-drop template builder with 6 type-specific add buttons, sortable checklist items, and full CRUD pages (list, create, detail/edit) under the activated Maintenance > Templates sidebar nav.

## What Was Built

### Task 1: Install dnd-kit and Build Template Builder Components

**dnd-kit packages installed:**
- `@dnd-kit/core@6.3.1` — DndContext, sensors, collision detection
- `@dnd-kit/sortable@10.0.0` — SortableContext, useSortable, arrayMove
- `@dnd-kit/utilities@3.2.2` — CSS.Transform for drag styling

**TemplateBuilder (components/maintenance/template-builder.tsx):**
- `DndContext` with `closestCenter` collision detection
- `PointerSensor` + `KeyboardSensor` (with `sortableKeyboardCoordinates`) for accessibility
- `SortableContext` with `verticalListSortingStrategy`
- `handleDragEnd`: uses `arrayMove` then re-indexes `sort_order` on all items
- 6 type-specific add buttons: `+ Checkbox`, `+ Pass/Fail`, `+ Numeric`, `+ Text`, `+ Photo`, `+ Dropdown`
- Each button calls `createItem(type, items.length)` with `crypto.randomUUID()` for stable ID
- Dropdown type initializes with `options: ['']` (one empty option slot)
- Empty state: dashed border placeholder message instead of blank list

**TemplateBuilderItem (components/maintenance/template-builder-item.tsx):**
- `useSortable({ id: item.id })` with `CSS.Transform.toString(transform)` for smooth drag
- Layout: drag handle (GripVertical) + colored type badge + label input + type config + delete button
- Type-specific configuration:
  - `checkbox`, `pass_fail`, `text`, `photo`: label only (no extra config)
  - `numeric`: optional unit `<Input>` (placeholder "Unit (e.g., PSI, °C, kg)", maxLength=20)
  - `dropdown`: add/remove chips UX — existing options as removable chips (X), add via input + button; max 20 options; Enter key shortcut to add
- Colored type badges via `TYPE_COLORS` map (blue/green/purple/orange/pink/yellow)
- `isDragging` state reduces opacity and disables inputs via `pointer-events-none`

### Task 2: Template List, Create, Detail Pages with Sidebar Activation

**TemplateColumns (components/maintenance/template-columns.tsx):**
- `name` — clickable link to `/maintenance/templates/{id}` (blue, hover underline)
- `category_name` — joined category name via `accessorFn`
- `item_count` — computed from `item_count` or `checklist.length`
- `created_at` — formatted `dd-MM-yyyy` (per CLAUDE.md)
- `is_active` — Active (green) / Inactive (gray) badge
- `actions` — Deactivate / Reactivate button for ga_lead/admin (via `TemplateTableMeta`)

**TemplateList (components/maintenance/template-list.tsx):**
- Client component wrapping `DataTable` with `templateColumns`
- Handles `deactivateTemplate` / `reactivateTemplate` server actions via `useTransition`
- `InlineFeedback` for success/error (persistent, manually dismissed)
- "New Template" button only visible to ga_lead/admin

**Template list page (app/(dashboard)/maintenance/templates/page.tsx):**
- Server component; fetches templates with category join
- Normalizes `category` (Supabase returns FK as array), computes `item_count`
- Breadcrumb: Maintenance > Templates
- Page header with description

**TemplateCreateForm (components/maintenance/template-create-form.tsx):**
- `react-hook-form` + `zodResolver(templateCreateSchema)`
- Fields: name (maxLength=100), category Combobox (asset categories only), description Textarea (maxLength=200), checklist via `TemplateBuilder`
- Calls `createTemplate` server action; on success navigates to `/maintenance/templates`
- `InlineFeedback` for errors (persistent)
- Char counter on description field

**Create template page (app/(dashboard)/maintenance/templates/new/page.tsx):**
- Server component; role guard — redirects non-ga_lead/admin to list
- Fetches asset-type categories
- Breadcrumb: Maintenance > Templates > New

**TemplateDetail (components/maintenance/template-detail.tsx):**
- Status/meta bar: Active/Inactive badge, item count, created date
- Read-only view: info card (name, category, description) + ordered checklist list with type badges
- Edit toggle: switches to full edit form with TemplateBuilder
- Edit form uses `updateTemplate` server action
- Deactivate/Reactivate buttons call respective server actions
- All actions via `useTransition`; `router.refresh()` after mutations
- `InlineFeedback` for all feedback (persistent)

**Template detail page (app/(dashboard)/maintenance/templates/[id]/page.tsx):**
- Server component; fetches template by id + company_id guard
- `notFound()` if template not in company
- Fetches asset categories for edit form Combobox
- Breadcrumb: Maintenance > Templates > {template.name}

**Sidebar activation (components/sidebar.tsx):**
- Templates item: `built: false` → `built: true`
- Schedules item remains `built: false` (Plan 03)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- `components/maintenance/template-builder.tsx` — FOUND
- `components/maintenance/template-builder-item.tsx` — FOUND
- `components/maintenance/template-columns.tsx` — FOUND
- `components/maintenance/template-list.tsx` — FOUND
- `components/maintenance/template-create-form.tsx` — FOUND
- `components/maintenance/template-detail.tsx` — FOUND
- `app/(dashboard)/maintenance/templates/page.tsx` — FOUND
- `app/(dashboard)/maintenance/templates/new/page.tsx` — FOUND
- `app/(dashboard)/maintenance/templates/[id]/page.tsx` — FOUND
- `components/sidebar.tsx` (modified) — FOUND
- Commit 5e42ede (Task 1) — FOUND
- Commit d5d2d3d (Task 2) — FOUND
- `npm run build` — PASSED (all 3 maintenance routes rendered)
