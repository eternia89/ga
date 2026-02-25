'use client';

import { useQueryStates, parseAsString } from 'nuqs';
import { useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/combobox';

export const auditFilterParsers = {
  user: parseAsString,
  action: parseAsString,
  entityType: parseAsString,
  dateFrom: parseAsString,
  dateTo: parseAsString,
};

const ACTION_OPTIONS = [
  { label: 'Created', value: 'Created' },
  { label: 'Updated', value: 'Updated' },
  { label: 'Status Changed', value: 'Status Changed' },
  { label: 'Deleted', value: 'Deleted' },
];

const ENTITY_TYPE_OPTIONS = [
  { label: 'Request', value: 'requests' },
  { label: 'Job', value: 'jobs' },
  { label: 'Asset', value: 'inventory_items' },
  { label: 'User', value: 'user_profiles' },
  { label: 'Company', value: 'companies' },
  { label: 'Division', value: 'divisions' },
  { label: 'Location', value: 'locations' },
  { label: 'Category', value: 'categories' },
  { label: 'Template', value: 'maintenance_templates' },
  { label: 'Schedule', value: 'maintenance_schedules' },
  { label: 'Comment', value: 'job_comments' },
  { label: 'Media', value: 'media_attachments' },
  { label: 'Notification', value: 'notifications' },
  { label: 'Movement', value: 'inventory_movements' },
];

interface AuditTrailFiltersProps {
  users: { id: string; full_name: string | null; email: string }[];
}

export function AuditTrailFilters({ users }: AuditTrailFiltersProps) {
  const [filters, setFilters] = useQueryStates(auditFilterParsers, { shallow: false });

  const hasActiveFilters =
    !!filters.user ||
    !!filters.action ||
    !!filters.entityType ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  const clearFilters = useCallback(() => {
    void setFilters({
      user: null,
      action: null,
      entityType: null,
      dateFrom: null,
      dateTo: null,
    });
  }, [setFilters]);

  const userOptions = users.map((u) => ({
    label: u.full_name ?? u.email,
    value: u.id,
  }));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* User filter (combobox — list may be large) */}
      <div className="w-[200px]">
        <Combobox
          options={[{ label: 'All users', value: '' }, ...userOptions]}
          value={filters.user ?? ''}
          onValueChange={(val) => void setFilters({ user: val || null })}
          placeholder="All users"
          searchPlaceholder="Search users..."
          emptyText="No users found."
        />
      </div>

      {/* Action filter */}
      <Select
        value={filters.action ?? 'all'}
        onValueChange={(val) =>
          void setFilters({ action: val === 'all' ? null : val })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {ACTION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Entity type filter */}
      <Select
        value={filters.entityType ?? 'all'}
        onValueChange={(val) =>
          void setFilters({ entityType: val === 'all' ? null : val })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All entity types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entity types</SelectItem>
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range */}
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => void setFilters({ dateFrom: e.target.value || null })}
          className="w-[140px] text-sm"
          aria-label="From date"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => void setFilters({ dateTo: e.target.value || null })}
          className="w-[140px] text-sm"
          aria-label="To date"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
