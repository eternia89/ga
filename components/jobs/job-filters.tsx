'use client';

import { useQueryStates, parseAsString } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/combobox';
import { JOB_STATUS_LABELS, JOB_STATUSES, PRIORITY_LABELS, PRIORITIES } from '@/lib/constants/job-status';

export const jobFilterParsers = {
  status: parseAsString,
  priority: parseAsString,
  pic_id: parseAsString,
  from: parseAsString,
  to: parseAsString,
  mine: parseAsString,
  q: parseAsString,
};

interface JobFiltersProps {
  users: { id: string; name: string }[];
  currentUserRole: string;
}

export function JobFilters({ users, currentUserRole }: JobFiltersProps) {
  const [filters, setFilters] = useQueryStates(jobFilterParsers, { shallow: false });
  const [searchInput, setSearchInput] = useState(filters.q ?? '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      void setFilters({ q: searchInput || null });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  const hasActiveFilters =
    !!filters.status ||
    !!filters.priority ||
    !!filters.pic_id ||
    !!filters.from ||
    !!filters.to ||
    !!filters.mine ||
    !!filters.q;

  const clearFilters = useCallback(() => {
    setSearchInput('');
    void setFilters({
      status: null,
      priority: null,
      pic_id: null,
      from: null,
      to: null,
      mine: null,
      q: null,
    });
  }, [setFilters]);

  // GA Staff/Lead/Admin can use the "My Assigned" toggle
  const canFilterByAssigned = ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole);

  const picOptions = users.map((u) => ({ label: u.name, value: u.id }));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8 w-[200px]"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={(val) => void setFilters({ status: val === 'all' ? null : val })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {JOB_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {JOB_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select
        value={filters.priority ?? 'all'}
        onValueChange={(val) => void setFilters({ priority: val === 'all' ? null : val })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* PIC filter — searchable combobox */}
      <div className="w-[180px]">
        <Combobox
          options={[{ label: 'All PICs', value: '' }, ...picOptions]}
          value={filters.pic_id ?? ''}
          onValueChange={(val) => void setFilters({ pic_id: val || null })}
          placeholder="All PICs"
          searchPlaceholder="Search PIC..."
          emptyText="No users found."
        />
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={filters.from ?? ''}
          onChange={(e) => void setFilters({ from: e.target.value || null })}
          className="w-[140px] text-sm"
          aria-label="From date"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="date"
          value={filters.to ?? ''}
          onChange={(e) => void setFilters({ to: e.target.value || null })}
          className="w-[140px] text-sm"
          aria-label="To date"
        />
      </div>

      {/* My Assigned toggle */}
      {canFilterByAssigned && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="job-mine-filter"
            checked={filters.mine === 'true'}
            onCheckedChange={(checked) =>
              void setFilters({ mine: checked ? 'true' : null })
            }
          />
          <Label htmlFor="job-mine-filter" className="text-sm font-normal cursor-pointer">
            My Assigned
          </Label>
        </div>
      )}

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
