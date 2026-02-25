'use client';

import { useMemo } from 'react';
import { useQueryStates } from 'nuqs';
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { DataTable } from '@/components/data-table/data-table';
import { AuditTrailFilters, auditFilterParsers } from './audit-trail-filters';
import { auditTrailColumns } from './audit-trail-columns';
import type { AuditLogRow } from './audit-trail-columns';

interface AuditTrailTableProps {
  data: AuditLogRow[];
  users: { id: string; full_name: string | null; email: string }[];
}

// Maps raw DB operations to user-friendly labels (mirrors audit-trail-columns logic)
function getActionLabel(row: AuditLogRow): string {
  const { operation, old_data, new_data } = row;
  if (operation === 'INSERT') return 'Created';
  if (operation === 'DELETE') return 'Deleted';
  if (operation === 'UPDATE') {
    const oldStatus = old_data?.status;
    const newStatus = new_data?.status;
    if (oldStatus !== undefined && newStatus !== undefined && oldStatus !== newStatus) {
      return 'Status Changed';
    }
    return 'Updated';
  }
  return operation;
}

export function AuditTrailTable({ data, users }: AuditTrailTableProps) {
  const [filters] = useQueryStates(auditFilterParsers);

  // Client-side filtering based on URL-synced filter state
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // User filter
      if (filters.user && row.user_id !== filters.user) return false;

      // Action filter
      if (filters.action) {
        const label = getActionLabel(row);
        if (label !== filters.action) return false;
      }

      // Entity type filter
      if (filters.entityType && row.table_name !== filters.entityType) return false;

      // Date range filter (based on performed_at)
      if (filters.dateFrom) {
        const fromDate = startOfDay(parseISO(filters.dateFrom));
        if (isBefore(parseISO(row.performed_at), fromDate)) return false;
      }
      if (filters.dateTo) {
        const toDate = endOfDay(parseISO(filters.dateTo));
        if (isAfter(parseISO(row.performed_at), toDate)) return false;
      }

      return true;
    });
  }, [data, filters]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <AuditTrailFilters users={users} />

      <DataTable
        columns={auditTrailColumns}
        data={filteredData}
        emptyMessage="No audit log entries found"
        pageSize={25}
        defaultColumnFilters={[]}
      />
    </div>
  );
}
