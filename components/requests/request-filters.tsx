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
import { STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants/request-status';

interface RequestFiltersProps {
  categories: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
}

const filterParsers = {
  status: parseAsString,
  priority: parseAsString,
  category_id: parseAsString,
  from: parseAsString,
  to: parseAsString,
  mine: parseAsString,
  q: parseAsString,
};

export function RequestFilters({
  categories,
  currentUserId,
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
      q: null,
    });
  }, [setFilters]);

  // Only GA Staff/Lead/Admin can use "My Assigned" toggle
  const canFilterByAssigned = ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole);

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
