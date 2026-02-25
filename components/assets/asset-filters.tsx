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
import { ASSET_STATUS_LABELS, ASSET_STATUSES } from '@/lib/constants/asset-status';

interface AssetFiltersProps {
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}

export const filterParsers = {
  status: parseAsString,
  category_id: parseAsString,
  location_id: parseAsString,
  in_transit: parseAsString,
  q: parseAsString,
};

export function AssetFilters({ categories, locations }: AssetFiltersProps) {
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
    !!filters.category_id ||
    !!filters.location_id ||
    !!filters.in_transit ||
    !!filters.q;

  const clearFilters = useCallback(() => {
    setSearchInput('');
    void setFilters({
      status: null,
      category_id: null,
      location_id: null,
      in_transit: null,
      q: null,
    });
  }, [setFilters]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
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
          {ASSET_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {ASSET_STATUS_LABELS[status]}
            </SelectItem>
          ))}
          <SelectItem value="in_transit_virtual">In Transit</SelectItem>
        </SelectContent>
      </Select>

      {/* Category filter */}
      <Select
        value={filters.category_id ?? 'all'}
        onValueChange={(val) =>
          void setFilters({ category_id: val === 'all' ? null : val })
        }
      >
        <SelectTrigger className="w-[160px]">
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

      {/* Location filter */}
      <Select
        value={filters.location_id ?? 'all'}
        onValueChange={(val) =>
          void setFilters({ location_id: val === 'all' ? null : val })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All locations</SelectItem>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
