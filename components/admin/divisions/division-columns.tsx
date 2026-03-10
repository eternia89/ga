"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Division } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    size: 180,
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      const value = row.getValue("code") as string | null;
      return value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>;
    },
    size: 90,
  },
  {
    accessorKey: "company.name",
    id: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const division = row.original;
      return division.company?.name ? <span>{division.company.name}</span> : <span className="text-muted-foreground">—</span>;
    },
    size: 160,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return description ? (
        <span className="truncate block" title={description}>
          {description}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 220,
    meta: { grow: true },
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
