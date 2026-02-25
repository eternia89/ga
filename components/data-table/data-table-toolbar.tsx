"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  exportUrl?: string;
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
  exportUrl,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = React.useState("");
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [bulkDeleteItems, setBulkDeleteItems] = React.useState<{ ids: string[]; names: string[] }>({ ids: [], names: [] });
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!exportUrl) return;
    setIsExporting(true);
    try {
      const response = await fetch(exportUrl);
      if (!response.ok) {
        console.error('Export failed:', response.statusText);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        response.headers
          .get('content-disposition')
          ?.split('filename=')[1]
          ?.replace(/"/g, '') ?? 'export.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkDeleteClick = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => (row.original as any).id);
    const names = selectedRows.map((row) => (row.original as any).name || (row.original as any).full_name || (row.original as any).email || "Unknown");
    setBulkDeleteItems({ ids, names });
    setBulkDeleteOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (bulkDeleteConfirmText !== "DELETE" || !onBulkDelete) return;
    setIsBulkDeleting(true);
    try {
      await onBulkDelete(bulkDeleteItems.ids);
      table.resetRowSelection();
      setBulkDeleteOpen(false);
      setBulkDeleteConfirmText("");
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
            className="h-8 w-[250px] max-lg:w-[150px]"
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
            className="h-8 px-3 max-lg:px-2"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right side: Bulk actions or create button + export */}
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
                onClick={handleBulkDeleteClick}
              >
                Delete
              </Button>
            )}
          </>
        ) : (
          <>
            {exportUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Download className="h-4 w-4" />
                    Export
                  </span>
                )}
              </Button>
            )}
            {createButton}
          </>
        )}
      </div>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => {
        setBulkDeleteOpen(open);
        if (!open) {
          setBulkDeleteConfirmText("");
          setIsBulkDeleting(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkDeleteItems.names.length} items?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>The following items will be deleted:</p>
                <ul className="list-disc pl-5 text-sm max-h-40 overflow-y-auto space-y-1">
                  {bulkDeleteItems.names.map((name, i) => (
                    <li key={i} className="font-medium text-foreground">{name}</li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Label htmlFor="bulk-confirm-text" className="text-sm font-medium">
                    Type <span className="font-mono font-semibold">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="bulk-confirm-text"
                    value={bulkDeleteConfirmText}
                    onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={bulkDeleteConfirmText !== "DELETE" || isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
