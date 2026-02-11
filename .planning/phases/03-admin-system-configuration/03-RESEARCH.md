# Phase 3: Admin & System Configuration - Research

**Researched:** 2026-02-11
**Domain:** Admin CRUD interfaces with data tables, modal forms, and user management in Next.js 16 App Router
**Confidence:** HIGH

## Summary

Phase 3 implements admin interfaces for managing organizational hierarchy (companies, divisions, locations, categories) and user accounts using shadcn/ui components with TanStack Table for data display and modal dialogs for create/edit forms. The research confirms that shadcn/ui with Tailwind CSS v4 provides a complete component ecosystem for building admin CRUD pages with sortable/filterable tables, validated modal forms, and accessible UI patterns. Next.js 16 Server Actions with React 19's useActionState hook offer type-safe form submissions with built-in error handling. The stack is mature, well-documented, and specifically designed for this exact use case.

**Primary recommendation:** Install shadcn/ui components incrementally using the CLI (npx shadcn@latest add [component]), implement data tables with TanStack Table for list views, use Dialog components with react-hook-form + Zod for validated modal forms, handle mutations with Server Actions validated using next-safe-action or manual Zod validation, and manage tab state with URL query parameters for Settings page navigation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### CRUD Page Patterns
- **List display:** Data tables (sortable, filterable) for all admin entities
- **Form style:** Modal dialogs for create/edit forms (not drawers or dedicated pages)
- **Delete confirmation:** Type-name-to-confirm pattern for all soft-delete actions
- **Bulk actions:** Checkbox multi-select with bulk delete/export on all tables
- **Table filters:** Inline toolbar above the table (search bar + filter dropdowns, always visible)
- **Pagination:** Classic pagination with page numbers (10/25/50 per page), no infinite scroll
- **Sidebar counts:** Show entity count badges next to each entity type in sidebar (e.g. "Divisions (12)")
- **Soft-deleted items:** Hidden by default; admin can toggle a filter to reveal deactivated items for review/restore
- **Action feedback:** Inline feedback (brief row highlight or near-action success message), not toast notifications
- **Empty states:** Minimal text + create button, no illustrations
- **Undo on delete:** No undo toast — admin must use the deactivated filter to find and restore items

#### Admin Navigation
- **Settings page:** Single Settings page with tab navigation across entity types (Companies, Divisions, Locations, Categories)
- **User Management:** Separate dedicated page (not a Settings tab) — its own sidebar link

#### Entity Relationships
- **Company scoping for divisions/locations:** Admin's company auto-fills as default, but a dropdown allows selecting other companies
- **Divisions tab:** Shows all divisions across all companies in one table with a company column
- **Locations tab:** Same pattern — all locations across companies with a company column
- **Locations structure:** Flat list (no parent-child hierarchy)
- **Categories:** Global/shared across all companies (not company-scoped), with sub-tabs for "Request Categories" and "Asset Categories"
- **Delete blocking:** Cannot delete a division/location that has active dependencies (users, etc.) — show count-only error message (e.g. "Cannot delete — 5 users assigned")

#### User Management
- **User creation:** Admin enters email, name, role, company (defaults to admin's company), and division — no invite email sent. User discovers account during onboarding and either logs in via Google OAuth or uses "Forgot password" to set password for the first time
- **User status:** Created users are immediately active (no "pending" state). Last login date shows null until first login
- **User list scope:** Default to admin's company, with a company filter dropdown to view users from other companies
- **User list columns:** Name, email, role, division, status (active/deactivated), company, last login date, created date
- **Role changes:** Admin can change any user's role at any time — takes effect immediately, no confirmation warning
- **Company assignment:** Admin can assign new users to any company via dropdown (defaults to admin's company)
- **Division assignment:** One division per user only
- **Deactivation:** Optional reason text field (not required), user account preserved
- **Reactivation:** Admin can reactivate deactivated users — account and history preserved

#### Profile & Self-Service
- **Editable fields:** Name only — no avatar upload
- **Avatar:** Auto-generated initials with a single hardcoded background color (Tailwind CSS variable, same for all users)
- **Read-only info:** Profile shows role, division, company as non-editable fields
- **Profile access:** User menu dropdown at bottom of sidebar — clicking "Profile" opens an inline drawer (no URL change)
- **Password change:** Separate dialog opened from a link within the profile drawer (current password + new password)
- **Logout:** Already implemented in the existing user menu from Phase 2 — no changes needed

### Claude's Discretion
- Exact data table component implementation (shadcn/ui data table patterns)
- Form validation rules and error message styling
- Exact tab component styling within Settings page
- Modal sizing and responsive behavior
- Loading states within modals and tables
- Exact inline feedback animation/styling

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | latest | UI component library | Industry-standard accessible components built on Radix UI, designed for copy-paste customization, high adoption in Next.js ecosystem |
| TanStack Table | v8.x | Headless table library | Most powerful React table solution with 1831 code snippets in Context7, handles sorting/filtering/pagination/selection, used by Linear and Notion |
| react-hook-form | v7.66.0+ | Form state management | Performant form library with 274+ snippets, minimal re-renders, excellent DX with TypeScript |
| zod | latest | Schema validation | TypeScript-first validation with type inference, works seamlessly with react-hook-form via @hookform/resolvers |
| next-safe-action | latest | Type-safe Server Actions | Wraps Next.js Server Actions with Zod validation and error handling, eliminates boilerplate |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nuqs | latest | URL state management | For tab state in Settings page — type-safe useState-like API synced to URL query params |
| lucide-react | latest | Icon library | Default icon library for shadcn/ui, tree-shakeable, consistent styling |
| @tanstack/react-query | v5.x (optional) | Server state | If implementing optimistic updates or complex client-side caching (may defer to later phases) |
| date-fns | latest | Date formatting | Lightweight alternative to moment.js for last login dates, created dates |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui | Material UI or Chakra UI | More opinionated, heavier bundle, less customization — shadcn/ui preferred for Tailwind v4 integration |
| TanStack Table | AG Grid or React Table v7 | AG Grid is enterprise-focused with licensing costs; v7 is deprecated — TanStack Table v8 is the clear choice |
| next-safe-action | Manual Zod validation | Less boilerplate but more verbose Server Actions — next-safe-action worth the dependency |
| nuqs | Manual useSearchParams | More code, no type safety — nuqs is lightweight and eliminates bugs |

**Installation:**

```bash
# shadcn/ui initialization (creates components.json)
npx shadcn@latest init

# Install core components
npx shadcn@latest add table dialog form input button select tabs sheet alert-dialog checkbox dropdown-menu

# Install dependencies
npm install @tanstack/react-table react-hook-form @hookform/resolvers zod next-safe-action nuqs date-fns lucide-react
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── (dashboard)/
│   ├── admin/
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings page with tabs (Companies | Divisions | Locations | Categories)
│   │   ├── users/
│   │   │   └── page.tsx          # User Management page (separate from Settings)
│   │   └── layout.tsx            # Admin layout (permission gate wrapper)
│   └── profile/                  # May implement as Sheet instead of route
│       └── page.tsx
├── actions/
│   ├── company-actions.ts        # Server Actions for company CRUD
│   ├── division-actions.ts       # Server Actions for division CRUD
│   ├── location-actions.ts       # Server Actions for location CRUD
│   ├── category-actions.ts       # Server Actions for category CRUD
│   └── user-actions.ts           # Server Actions for user management
components/
├── ui/                           # shadcn/ui components (CLI-generated)
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── tabs.tsx
│   ├── sheet.tsx
│   └── ...
├── data-tables/                  # Reusable data table components
│   ├── company-table.tsx
│   ├── division-table.tsx
│   ├── location-table.tsx
│   ├── category-table.tsx
│   └── user-table.tsx
├── forms/                        # Modal form components
│   ├── company-form-dialog.tsx
│   ├── division-form-dialog.tsx
│   ├── location-form-dialog.tsx
│   ├── category-form-dialog.tsx
│   └── user-form-dialog.tsx
└── profile/
    └── profile-sheet.tsx         # Inline drawer for profile access
lib/
├── validations/                  # Zod schemas for forms
│   ├── company-schema.ts
│   ├── division-schema.ts
│   ├── location-schema.ts
│   ├── category-schema.ts
│   └── user-schema.ts
└── utils/
    └── table-helpers.ts          # Reusable table utilities (export, soft-delete toggle)
```

### Pattern 1: Data Table with Server-Side Data

**What:** TanStack Table configured for client-side sorting/filtering with server-fetched data
**When to use:** Admin list pages with < 1000 rows per entity (suitable for this project)

**Example:**

```typescript
// Source: Context7 /shadcn-ui/ui and /websites/tanstack_table
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDelete?: (ids: string[]) => Promise<void>;
  onExport?: (ids: string[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDelete,
  onExport,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div>
      {/* Inline toolbar - always visible */}
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {selectedRowCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedRowCount} selected</span>
            {onExport && (
              <Button variant="outline" size="sm" onClick={() => onExport(/* selected IDs */)}>
                Export
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(/* selected IDs */)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {/* Table implementation */}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

### Pattern 2: Modal Form with Server Action and Validation

**What:** Dialog containing react-hook-form with Zod validation, submitting to Server Action
**When to use:** All create/edit operations (user requirement: modal dialogs, not dedicated pages)

**Example:**

```typescript
// Source: Context7 /shadcn-ui/ui and /react-hook-form/react-hook-form
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const companySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  initialData?: CompanyFormData;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CompanyFormDialogProps) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData || { name: '', code: '', email: '' },
  });

  const handleSubmit = async (data: CompanyFormData) => {
    await onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Company' : 'Create Company'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update company details.' : 'Add a new company to the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <span className="text-sm text-red-500">{form.formState.errors.name.message}</span>
              )}
            </div>
            {/* Additional fields */}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 3: Type-to-Confirm Delete Dialog

**What:** Alert dialog requiring user to type entity name before confirming soft-delete
**When to use:** All soft-delete operations (user requirement: type-name-to-confirm pattern)

**Example:**

```typescript
// Source: https://www.shadcn.io/patterns/alert-dialog-destructive-1
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityType: string;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = inputValue === entityName;

  const handleConfirm = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
      setInputValue('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType}</AlertDialogTitle>
          <AlertDialogDescription>
            This will soft-delete "{entityName}". Type the {entityType.toLowerCase()} name to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="confirm-name">Type "{entityName}" to confirm</Label>
          <Input
            id="confirm-name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={entityName}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setInputValue('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete || isDeleting}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Pattern 4: Server Action with Validation

**What:** Type-safe Server Action with Zod validation using next-safe-action
**When to use:** All mutation operations (create, update, delete)

**Example:**

```typescript
// Source: https://next-safe-action.dev/
'use server';

import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const createCompanyAction = actionClient
  .schema(createCompanySchema)
  .action(async ({ parsedInput: data }) => {
    const supabase = await createClient();

    // Check authentication and permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') throw new Error('Forbidden');

    // Insert company
    const { data: company, error } = await supabase
      .from('companies')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/settings');
    return { success: true, company };
  });
```

### Pattern 5: Tab Navigation with URL State

**What:** Tabs component synced to URL query parameter for Settings page
**When to use:** Settings page navigation (Companies | Divisions | Locations | Categories tabs)

**Example:**

```typescript
// Source: https://nuqs.dev and Context7 /shadcn-ui/ui
'use client';

import { useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'companies' });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="companies">
          {/* Company data table */}
        </TabsContent>
        <TabsContent value="divisions">
          {/* Division data table */}
        </TabsContent>
        <TabsContent value="locations">
          {/* Location data table */}
        </TabsContent>
        <TabsContent value="categories">
          {/* Category data table with sub-tabs */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Pattern 6: Profile Sheet (Inline Drawer)

**What:** Sheet component (slide-out panel) for profile editing without URL change
**When to use:** User profile access from sidebar menu (user requirement: inline drawer, no URL change)

**Example:**

```typescript
// Source: https://ui.shadcn.com/docs/components/radix/sheet
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfileSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
          Profile
        </button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Profile</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {/* Avatar with initials (read-only) */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold">
              AB
            </div>
            <p className="text-sm text-gray-500">Auto-generated initials</p>
          </div>

          {/* Editable: Name only */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Alice Brown" />
          </div>

          {/* Read-only: Role, Division, Company */}
          <div>
            <Label>Role</Label>
            <p className="text-sm text-gray-700">Admin</p>
          </div>
          <div>
            <Label>Division</Label>
            <p className="text-sm text-gray-700">IT Department</p>
          </div>
          <div>
            <Label>Company</Label>
            <p className="text-sm text-gray-700">Acme Corp</p>
          </div>

          {/* Password change link */}
          <Button variant="link" className="px-0">
            Change Password
          </Button>

          <Button className="w-full">Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Anti-Patterns to Avoid

- **DON'T define columns/data inline:** Causes infinite re-render loops with TanStack Table — always memoize with useMemo
- **DON'T mutate table data in place:** Use immutable updates — even inline .filter() can cause infinite loops
- **DON'T throw errors from Server Actions for validation:** Return error objects instead — throwing is for unexpected errors
- **DON'T call redirect inside try/catch:** redirect works by throwing an error, so call it after try/catch
- **DON'T skip keyboard navigation testing:** Radix UI provides accessibility by default, but always test Escape, Tab, Enter in dialogs
- **DON'T use toast notifications for action feedback:** User requirement specifies inline feedback only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data table sorting/filtering/pagination | Custom table with manual state | TanStack Table | Handles edge cases like multi-column sort, filter composition, pagination state sync — 8+ years of production battle-testing |
| Form validation | Manual Zod checks in each form | react-hook-form + zodResolver | Eliminates re-render thrashing, manages touched/dirty state, handles focus management, integrates error display |
| Server Action validation | Manual try/catch + Zod parse | next-safe-action | Type-safe end-to-end, eliminates boilerplate, consistent error handling, middleware support for auth/logging |
| Delete confirmation dialogs | Custom confirm() or modal state | shadcn/ui AlertDialog + type-to-confirm pattern | Accessible (focus trap, keyboard nav), consistent UX, prevents accidental deletes with explicit confirmation |
| URL state management | Manual useSearchParams parsing | nuqs | Type-safe, automatic serialization/deserialization, familiar useState API, prevents common bugs |
| Accessible dialogs | Custom modal with overlay | shadcn/ui Dialog (Radix UI primitive) | Focus trapping, scroll locking, keyboard navigation, screen reader support, Return-to-trigger focus management |

**Key insight:** Admin CRUD interfaces have deceptively complex requirements (accessible keyboard navigation, proper focus management, error state handling, race condition prevention, optimistic updates). shadcn/ui + TanStack Table + react-hook-form represent 10+ years of community learning encoded into libraries. Building custom solutions means rediscovering all the edge cases these libraries already handle.

## Common Pitfalls

### Pitfall 1: TanStack Table Infinite Re-render Loops

**What goes wrong:** Table enters infinite loop, browser freezes, console floods with re-render warnings

**Why it happens:** Columns or data defined inline without memoization, causing new references on every render. Even stable references can cause issues if data is mutated in place (e.g., data.filter() inside render).

**How to avoid:**
```typescript
// ❌ WRONG - inline definition
function MyTable() {
  const columns = [{ accessorKey: 'name' }]; // New reference every render!
  return <DataTable columns={columns} data={data} />;
}

// ✅ CORRECT - memoized
function MyTable() {
  const columns = React.useMemo(() => [{ accessorKey: 'name' }], []);
  return <DataTable columns={columns} data={data} />;
}
```

**Warning signs:** Sluggish UI, browser tab consuming 100% CPU, React DevTools showing repeated renders

**Source:** [Making Tanstack Table 1000x faster with a 1 line change](https://jpcamara.com/2023/03/07/making-tanstack-table.html), [Material React Table V3 Docs - Memoization Guide](https://www.material-react-table.com/docs/guides/memoization)

### Pitfall 2: Server Action Error Handling Confusion

**What goes wrong:** Validation errors crash the app, expected errors treated as unexpected, redirect fails inside try/catch

**Why it happens:** Developers throw errors for validation failures (should return error objects instead), or call redirect() inside try/catch (redirect works by throwing, so it gets caught)

**How to avoid:**
```typescript
// ❌ WRONG - throwing validation errors
export async function createCompany(data: unknown) {
  const parsed = companySchema.parse(data); // Throws on invalid data
  // ...
}

// ✅ CORRECT - return error objects for validation
export async function createCompany(data: unknown) {
  const result = companySchema.safeParse(data);
  if (!result.success) {
    return { error: 'Validation failed', issues: result.error.issues };
  }
  // ...
  // redirect() AFTER try/catch, not inside
}
```

**Warning signs:** Cryptic error boundaries, validation errors showing generic "Something went wrong", redirect not working

**Source:** [Next.js Server Actions: The Complete Guide (2026)](https://makerkit.dev/blog/tutorials/nextjs-server-actions), [Next.js Error Handling best practices](https://devanddeliver.com/blog/frontend/next-js-15-error-handling-best-practices-for-code-and-routes)

### Pitfall 3: Missing Soft-Delete Dependency Checks

**What goes wrong:** Admin deletes a division, then other queries referencing that division fail or show broken state

**Why it happens:** No validation before soft-delete — failing to check if entity has active dependencies (e.g., users assigned to division)

**How to avoid:**
```typescript
// Server Action before soft-delete
const { count } = await supabase
  .from('user_profiles')
  .select('*', { count: 'exact', head: true })
  .eq('division_id', divisionId)
  .is('deleted_at', null);

if (count > 0) {
  return { error: `Cannot delete — ${count} users assigned` };
}

// Proceed with soft-delete
await supabase
  .from('divisions')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', divisionId);
```

**Warning signs:** Orphaned records, cascade delete issues, "Cannot read property 'name' of null" errors

**Source:** [Supabase Cascade Deletes](https://supabase.com/docs/guides/database/postgres/cascade-deletes), Phase 1 database schema showing FK relationships

### Pitfall 4: Race Conditions in Concurrent Form Submissions

**What goes wrong:** User double-clicks submit button, creates duplicate records or inconsistent state

**Why it happens:** No request deduplication, isSubmitting state not properly tracked, missing disabled state on submit button

**How to avoid:**
```typescript
const form = useForm({
  resolver: zodResolver(schema),
});

// Use isSubmitting from formState
const { isSubmitting } = form.formState;

return (
  <form onSubmit={form.handleSubmit(handleSubmit)}>
    {/* Fields */}
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </Button>
  </form>
);
```

**Warning signs:** Duplicate records created on fast submit clicks, inconsistent state after rapid actions

**Source:** [React Hook Form formState.isSubmitting](https://react-hook-form.com/docs/useform), [Next.js Server Actions race conditions](https://github.com/vercel/next.js/issues/85416)

### Pitfall 5: Forgetting to Revalidate Cache After Mutations

**What goes wrong:** User creates/edits/deletes an entity, but UI doesn't update — stale data persists

**Why it happens:** Next.js aggressive caching — Server Actions must explicitly call revalidatePath or revalidateTag

**How to avoid:**
```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function createCompany(data: FormData) {
  // Perform mutation
  await supabase.from('companies').insert(data);

  // CRITICAL: Revalidate affected paths
  revalidatePath('/admin/settings');
  revalidatePath('/admin/users'); // If user list shows company names
}
```

**Warning signs:** UI not updating after mutations, requiring manual page refresh to see changes

**Source:** [Next.js revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath), [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Pitfall 6: Accessibility Violations in Custom Dialogs

**What goes wrong:** Keyboard users can't navigate dialogs, focus escapes modal, screen readers announce incorrect states

**Why it happens:** Building custom modals without proper focus trap, missing aria attributes, no Escape key handler, forgetting to return focus to trigger

**How to avoid:** Use shadcn/ui Dialog (built on Radix UI) — provides all accessibility features by default:
- Focus trap (Tab/Shift+Tab stay inside)
- Escape key to close
- Click-outside to dismiss
- Return-to-trigger focus on close
- Proper ARIA attributes

**Warning signs:** Keyboard users complaining, focus jumping outside modal, screen reader confusion

**Source:** [Dialog - shadcn/ui](https://ui.shadcn.com/docs/components/radix/dialog), [Accessible Dialogs with ShadCN](https://vueschool.io/articles/vuejs-tutorials/accessible-alerts-dialogs-and-alert-dialogs-with-shadcn-vue/)

## Code Examples

Verified patterns from official sources:

### Checkbox Column for Row Selection

```typescript
// Source: https://github.com/shadcn-ui/ui (Context7 /shadcn-ui/ui)
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Company>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Other columns...
];
```

### React 19 useActionState with Form Validation

```typescript
// Source: https://aurorascharff.no/posts/handling-form-validation-errors-and-resets-with-useactionstate/
'use client';

import { useActionState } from 'react';
import { createCompanyAction } from '@/app/actions/company-actions';

type FormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function CompanyForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createCompanyAction,
    { message: undefined, errors: undefined }
  );

  return (
    <form action={formAction}>
      <input name="name" />
      {state.errors?.name && (
        <span className="text-red-500">{state.errors.name[0]}</span>
      )}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Company'}
      </button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Server Action Error Handling Pattern

```typescript
// Source: https://makerkit.dev/blog/tutorials/nextjs-server-actions
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  name: z.string().min(1),
});

export async function createCompany(prevState: any, formData: FormData) {
  // Validation
  const result = schema.safeParse({
    name: formData.get('name'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    // Mutation logic
    const { data, error } = await supabase
      .from('companies')
      .insert({ name: result.data.name });

    if (error) throw error;

    revalidatePath('/admin/settings');
    return { message: 'Company created successfully' };
  } catch (error) {
    return { message: 'Failed to create company' };
  }
}
```

### Inline Feedback Animation (CSS-Only)

```css
/* Brief row highlight after mutation - user requirement: inline feedback, not toasts */
@keyframes highlight {
  0%, 100% { background-color: transparent; }
  50% { background-color: hsl(var(--success-light)); }
}

.row-updated {
  animation: highlight 1s ease-in-out;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Hook Form with useFormState (react-dom) | React Hook Form with useActionState (react) | React 19 (Dec 2024) | useActionState is now the standard — lives in react package, not react-dom |
| Tailwind v3 with @layer directives | Tailwind v4 with @theme and simplified syntax | Tailwind v4 (2024) | Simpler config, no @layer base needed, @theme for color variables |
| Manual Server Action error handling | next-safe-action library | 2024-2025 | Eliminates boilerplate, provides type-safe validation pipeline |
| react-query for all server state | Server Components + selective react-query | Next.js 13+ App Router | Most data fetching happens in Server Components, react-query only for client-side mutations/optimistic updates |
| Custom URL state management | nuqs library | 2024-2025 | Type-safe, React 19 compatible, eliminates manual parsing bugs |

**Deprecated/outdated:**
- **react-table v7:** Replaced by TanStack Table v8 (API changed, v7 no longer maintained)
- **useFormState from react-dom:** Replaced by useActionState in react package (React 19)
- **Tailwind @layer base for dark mode:** Tailwind v4 uses simpler :root and .dark without @layer
- **Custom confirm() for delete:** Accessibility nightmare — use AlertDialog with type-to-confirm pattern

## Open Questions

1. **Server-side pagination vs client-side filtering**
   - What we know: TanStack Table supports both; user requirements suggest < 1000 rows per entity (suitable for client-side)
   - What's unclear: Actual row counts — might need server-side pagination if companies/divisions/users scale to 10k+
   - Recommendation: Start with client-side (simpler), measure performance, migrate to server-side if needed (manualPagination flag is a 5-line change)

2. **Optimistic updates for mutations**
   - What we know: React 19 useOptimistic hook enables instant UI updates; next-safe-action supports it
   - What's unclear: User expectation — inline feedback suggests waiting for server confirmation, not optimistic
   - Recommendation: Implement standard (non-optimistic) flow first, add optimistic updates in Phase 8 if needed for UX polish

3. **Export format preference**
   - What we know: User requirements specify bulk export; common formats are CSV, Excel, JSON
   - What's unclear: Specific format — CSV is simplest, Excel requires additional library (xlsx)
   - Recommendation: Implement CSV export first (simple, universal), add Excel in Phase 8 if requested

## Sources

### Primary (HIGH confidence)

- [shadcn/ui Documentation](https://ui.shadcn.com/docs/installation/next) - Official installation and component docs
- [TanStack Table Documentation](https://tanstack.com/table/latest/docs) - Pagination, sorting, filtering patterns
- Context7 /shadcn-ui/ui - 1729 code snippets for shadcn/ui components
- Context7 /websites/tanstack_table - 1831 code snippets for TanStack Table
- Context7 /react-hook-form/react-hook-form - 274 code snippets for form validation
- [next-safe-action Documentation](https://next-safe-action.dev/) - Type-safe Server Actions with validation
- [React 19 useActionState](https://react.dev/reference/react/useActionState) - Official React 19 hook docs

### Secondary (MEDIUM confidence)

- [Next.js Server Actions: The Complete Guide (2026)](https://makerkit.dev/blog/tutorials/nextjs-server-actions) - Error handling patterns
- [Handling Form Validation Errors with useActionState](https://aurorascharff.no/posts/handling-form-validation-errors-and-resets-with-useactionstate/) - React 19 form patterns
- [Making Tanstack Table 1000x faster](https://jpcamara.com/2023/03/07/making-tanstack-table.html) - Memoization pitfalls
- [nuqs Documentation](https://nuqs.dev) - Type-safe URL state management
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) - Tailwind v4 migration
- [Data Table Bulk Actions Pattern](https://www.shadcn.io/blocks/tables-bulk-actions) - Bulk action UI patterns
- [Type-to-Confirm Delete Pattern](https://www.shadcn.io/patterns/alert-dialog-destructive-1) - Destructive confirmation dialog
- [Supabase Cascade Deletes](https://supabase.com/docs/guides/database/postgres/cascade-deletes) - RESTRICT vs CASCADE for dependencies
- [Sheet Component for Profile](https://ui.shadcn.com/docs/components/radix/sheet) - Inline drawer pattern
- [Accessible Dialogs](https://vueschool.io/articles/vuejs-tutorials/accessible-alerts-dialogs-and-alert-dialogs-with-shadcn-vue/) - Keyboard navigation best practices

### Tertiary (LOW confidence)

- [Next.js 16 URL State Management](https://medium.com/@roman_j/mastering-state-in-next-js-app-router-with-url-query-parameters-a-practical-guide-03939921d09c) - Tab state patterns (Medium article)
- [Optimistic Updates in Next.js](https://www.buildwithmatija.com/blog/my-approach-crud-forms-react19-useactionstate) - useOptimistic patterns (personal blog)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries confirmed via Context7 + official docs, actively maintained, production-ready
- Architecture: HIGH - Patterns verified from official shadcn/ui examples, TanStack Table docs, next-safe-action docs
- Pitfalls: HIGH - Sourced from official issue trackers, performance analyses, and Next.js error handling guides

**Research date:** 2026-02-11
**Valid until:** ~60 days (stable ecosystem — React 19, Next.js 16, shadcn/ui, TanStack Table are mature)
