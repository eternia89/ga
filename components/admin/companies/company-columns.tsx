"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Company } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const companyColumns: ColumnDef<Company>[] = [
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
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => row.getValue("code") || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "-",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.getValue("phone") || "-",
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
      const company = row.original;
      const isDeactivated = !!company.deleted_at;

      const meta = table.options.meta as {
        onEdit?: (company: Company) => void;
        onDelete?: (company: Company) => void;
        onRestore?: (company: Company) => void;
      } | undefined;

      return (
        <div className="flex items-center gap-1">
          {!isDeactivated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => meta?.onEdit?.(company)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => meta?.onDelete?.(company)}
              >
                Deactivate
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-green-600 hover:text-green-700"
              onClick={() => meta?.onRestore?.(company)}
            >
              Reactivate
            </Button>
          )}
        </div>
      );
    },
    size: 120,
  },
];
