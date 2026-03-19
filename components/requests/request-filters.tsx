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
import { STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants/request-status';
import { GA_ROLES } from '@/lib/constants/roles';

interface RequestFiltersProps {
  categories: { id: string; name: string }[];
  currentUserId?: string;
  currentUserRole: string;
}

const filterParsers = {
  status: parseAsString,
  priority: parseAsString,
  category_id: parseAsString,
  from: parseAsString,
  to: parseAsString,
  mine: parseAsString,
  my_requests: parseAsString,
  q: parseAsString,
};

export function RequestFilters({
  categories,
  currentUserRole,
}: RequestFiltersProps) {
  const [filters, setFilters] = useQueryStates(filterParsers, { shallow: false });
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
    !!filters.category_id ||
    !!filters.from ||
    !!filters.to ||
    !!filters.mine ||
    !!filters.my_requests ||
    !!filters.q;

  const clearFilters = useCallback(() => {
    setSearchInput('');
    void setFilters({
      status: null,
      priority: null,
      category_id: null,
      from: null,
      to: null,
      mine: null,
      my_requests: null,
      q: null,
    });
  }, [setFilters]);

  // Only GA Staff/Lead/Admin can use "My Assigned" toggle
  const canFilterByAssigned = (GA_ROLES as readonly string[]).includes(currentUserRole);

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
          placeholder="Search requests..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8 w-[200px]"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={(val) =>
          void setFilters({ status: val === 'all' ? null : val })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select
        value={filters.priority ?? 'all'}
        onValueChange={(val) =>
          void setFilters({ priority: val === 'all' ? null : val })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category filter */}
      <Select
        value={filters.category_id ?? 'all'}
        onValueChange={(val) =>
          void setFilters({ category_id: val === 'all' ? null : val })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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

      {/* My Requests toggle (GA Staff/Lead/Admin only — general_user already sees only their own) */}
      {canFilterByAssigned && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="my-requests-filter"
            checked={filters.my_requests === 'true'}
            onCheckedChange={(checked) =>
              void setFilters({ my_requests: checked ? 'true' : null })
            }
          />
          <Label htmlFor="my-requests-filter" className="text-sm font-normal cursor-pointer">
            My Requests
          </Label>
        </div>
      )}

      {/* My Assigned toggle (GA Staff/Lead/Admin only) */}
      {canFilterByAssigned && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="mine-filter"
            checked={filters.mine === 'true'}
            onCheckedChange={(checked) =>
              void setFilters({ mine: checked ? 'true' : null })
            }
          />
          <Label htmlFor="mine-filter" className="text-sm font-normal cursor-pointer">
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

// Export filter parsers so request-table can use them too
export { filterParsers };
// Export the currentUserId reference type so downstream can read "mine" filter
export type { RequestFiltersProps };
