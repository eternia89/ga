"use client";

import { ColumnDef } from "@tanstack/react-table";

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
    size: 200,
    meta: { grow: true },
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
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const value = row.getValue("email") as string | null;
      return value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>;
    },
    size: 180,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const value = row.getValue("phone") as string | null;
      return value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>;
    },
    size: 130,
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
    size: 100,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const company = row.original;
      const meta = table.options.meta as {
        onEdit?: (company: Company) => void;
      } | undefined;

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-sm text-blue-600 hover:underline"
          onClick={() => meta?.onEdit?.(company)}
        >
          Edit
        </Button>
      );
    },
    size: 120,
  },
];
