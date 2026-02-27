'use client';

import { useQueryStates, parseAsString } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import { Search, X, CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { type DateRange } from 'react-day-picker';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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

  // Derive DateRange from URL filters
  const dateRange: DateRange | undefined =
    filters.from || filters.to
      ? {
          from: filters.from ? parseISO(filters.from) : undefined,
          to: filters.to ? parseISO(filters.to) : undefined,
        }
      : undefined;

  const handleDateRangeChange = useCallback(
    (range: DateRange | undefined) => {
      void setFilters({
        from: range?.from ? format(range.from, 'yyyy-MM-dd') : null,
        to: range?.to ? format(range.to, 'yyyy-MM-dd') : null,
      });
    },
    [setFilters]
  );

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

      {/* Date range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[240px] justify-start text-left font-normal text-sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd-MM-yyyy')} – {format(dateRange.to, 'dd-MM-yyyy')}
                </>
              ) : (
                format(dateRange.from, 'dd-MM-yyyy')
              )
            ) : (
              <span className="text-muted-foreground">Pick date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            autoFocus
          />
        </PopoverContent>
      </Popover>

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
