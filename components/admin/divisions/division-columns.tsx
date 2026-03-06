"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Division } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const divisionColumns: ColumnDef<Division>[] = [
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
    accessorKey: "company.name",
    id: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const division = row.original;
      return division.company?.name || "-";
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return description ? (
        <span className="max-w-[300px] truncate" title={description}>
          {description}
        </span>
      ) : (
        "-"
      );
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
      const division = row.original;
      const meta = table.options.meta as {
        onEdit?: (division: Division) => void;
      } | undefined;

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-sm text-blue-600 hover:underline"
          onClick={() => meta?.onEdit?.(division)}
        >
          Edit
        </Button>
      );
    },
    size: 120,
  },
];
