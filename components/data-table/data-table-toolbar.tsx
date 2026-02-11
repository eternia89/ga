"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FilterableColumn {
  id: string;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  filterableColumns?: FilterableColumn[];
  selectedRowCount: number;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkExport?: (ids: string[]) => void;
  showDeactivatedToggle?: boolean;
  onDeactivatedToggleChange?: (show: boolean) => void;
  showDeactivated?: boolean;
  createButton?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  filterableColumns,
  selectedRowCount,
  onBulkDelete,
  onBulkExport,
  showDeactivatedToggle,
  onDeactivatedToggleChange,
  showDeactivated,
  createButton,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {/* Left side: Search, filters, deactivated toggle */}
      <div className="flex flex-1 items-center gap-2">
        {/* Search input */}
        {searchKey && (
          <Input
            placeholder={`Search...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}

        {/* Filterable columns */}
        {filterableColumns?.map((column) => {
          const tableColumn = table.getColumn(column.id);
          const selectedValue = tableColumn?.getFilterValue() as string | undefined;

          return (
            <Select
              key={column.id}
              value={selectedValue ?? "all"}
              onValueChange={(value) => {
                tableColumn?.setFilterValue(value === "all" ? undefined : value);
              }}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder={column.title} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {column.title}</SelectItem>
                {column.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {/* Show deactivated toggle */}
        {showDeactivatedToggle && onDeactivatedToggleChange && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-deactivated"
              checked={showDeactivated}
              onCheckedChange={(checked) => onDeactivatedToggleChange(!!checked)}
            />
            <Label
              htmlFor="show-deactivated"
              className="text-sm font-normal cursor-pointer"
            >
              Show deactivated
            </Label>
          </div>
        )}

        {/* Clear filters button */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right side: Bulk actions or create button */}
      <div className="flex items-center gap-2">
        {selectedRowCount > 0 ? (
          <>
            <span className="text-sm text-muted-foreground">
              {selectedRowCount} selected
            </span>
            {onBulkExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedRows = table.getFilteredSelectedRowModel().rows;
                  const ids = selectedRows.map((row) => (row.original as any).id);
                  onBulkExport(ids);
                }}
              >
                Export
              </Button>
            )}
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  const selectedRows = table.getFilteredSelectedRowModel().rows;
                  const ids = selectedRows.map((row) => (row.original as any).id);
                  await onBulkDelete(ids);
                }}
              >
                Delete
              </Button>
            )}
          </>
        ) : (
          createButton
        )}
      </div>
    </div>
  );
}
