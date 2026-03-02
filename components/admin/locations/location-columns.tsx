"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Location } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const locationColumns: ColumnDef<Location>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address") as string | null;
      return address ? (
        <span className="max-w-[300px] truncate" title={address}>
          {address}
        </span>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "company.name",
    id: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const location = row.original;
      return location.company?.name || "-";
    },
  },
  {
    accessorKey: "deleted_at",
    header: "Status",
    cell: ({ row }) => {
      const isDeactivated = !!row.getValue("deleted_at");
      return (
        <Badge variant={isDeactivated ? "destructive" : "secondary"}>
          {isDeactivated ? "Deactivated" : "Active"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return format(new Date(date), "dd-MM-yyyy");
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const location = row.original;
      const isDeactivated = !!location.deleted_at;

      const meta = table.options.meta as {
        onEdit?: (location: Location) => void;
        onDelete?: (location: Location) => void;
        onRestore?: (location: Location) => void;
      } | undefined;

      return (
        <div className="flex items-center gap-1">
          {!isDeactivated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => meta?.onEdit?.(location)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => meta?.onDelete?.(location)}
              >
                Delete
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-600 hover:text-green-700"
              onClick={() => meta?.onRestore?.(location)}
            >
              Restore
            </Button>
          )}
        </div>
      );
    },
    size: 120,
  },
];
