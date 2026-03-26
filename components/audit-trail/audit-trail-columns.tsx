'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { getEntityRoute } from '@/lib/constants/entity-routes';
import { DisplayId } from '@/components/display-id';

export type AuditLogRow = {
  id: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  performed_at: string;
  company_id: string | null;
  // Joined fields
  user_full_name?: string | null;
  record_display_id?: string | null;
};

// Maps raw DB table names to user-friendly labels
const TABLE_LABELS: Record<string, string> = {
  requests: 'Request',
  jobs: 'Job',
  inventory_items: 'Asset',
  user_profiles: 'User',
  companies: 'Company',
  divisions: 'Division',
  locations: 'Location',
  categories: 'Category',
  maintenance_templates: 'Template',
  maintenance_schedules: 'Schedule',
  job_comments: 'Comment',
  media_attachments: 'Media',
  notifications: 'Notification',
  inventory_movements: 'Movement',
  job_status_changes: 'Job Status',
};

// Maps raw DB operations to user-friendly action labels
function getActionLabel(row: AuditLogRow): string {
  const { operation, old_data, new_data } = row;

  if (operation === 'INSERT') return 'Created';
  if (operation === 'DELETE') return 'Deactivated';

  if (operation === 'UPDATE') {
    // If the status field changed, show "Status Changed" instead of "Updated"
    const oldStatus = old_data?.status;
    const newStatus = new_data?.status;
    if (oldStatus !== undefined && newStatus !== undefined && oldStatus !== newStatus) {
      return 'Status Changed';
    }
    return 'Updated';
  }

  return operation;
}

// Returns Badge variant based on action
function getActionVariant(label: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (label) {
    case 'Created':
      return 'default';
    case 'Deactivated':
      return 'destructive';
    case 'Status Changed':
      return 'secondary';
    default:
      return 'outline';
  }
}

export const auditTrailColumns: ColumnDef<AuditLogRow>[] = [
  {
    accessorKey: 'performed_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('performed_at') as string;
      return (
        <span className="font-mono text-xs whitespace-nowrap">
          {format(new Date(value), 'dd-MM-yyyy, HH:mm:ss')}
        </span>
      );
    },
    enableSorting: true,
    size: 165,
  },
  {
    id: 'user',
    header: 'User',
    accessorFn: (row) => row.user_full_name ?? row.user_email ?? row.user_id ?? '—',
    cell: ({ row }) => {
      const name = row.original.user_full_name;
      const email = row.original.user_email;
      const display = name ?? email ?? '—';
      return (
        <span className="truncate block max-w-[160px]" title={display}>
          {display}
        </span>
      );
    },
    size: 160,
  },
  {
    id: 'action',
    header: 'Action',
    accessorFn: (row) => getActionLabel(row),
    cell: ({ row }) => {
      const label = getActionLabel(row.original);
      const variant = getActionVariant(label);
      return <Badge variant={variant}>{label}</Badge>;
    },
    size: 120,
  },
  {
    id: 'entity_type',
    header: 'Entity Type',
    accessorFn: (row) => TABLE_LABELS[row.table_name] ?? row.table_name,
    cell: ({ row }) => {
      const label = TABLE_LABELS[row.original.table_name] ?? row.original.table_name;
      return (
        <span className="truncate block max-w-[110px]" title={label}>
          {label}
        </span>
      );
    },
    size: 110,
  },
  {
    id: 'entity',
    header: 'Entity',
    cell: ({ row }) => {
      const { table_name, record_id, record_display_id } = row.original;
      const route = getEntityRoute(table_name, record_id);
      const displayText = record_display_id ?? record_id.slice(0, 8);

      if (!route || route === '#') {
        return (
          <DisplayId className="text-xs text-muted-foreground">
            {displayText}
          </DisplayId>
        );
      }

      return (
        <Link
          href={route}
          className="text-xs text-blue-600 hover:underline hover:text-blue-700 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <DisplayId>{displayText}</DisplayId>
        </Link>
      );
    },
    size: 120,
    meta: { grow: true },
  },
];
