'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { ROLE_COLORS, ROLE_DISPLAY } from '@/lib/constants/role-display';
import type { Role } from '@/lib/constants/roles';

export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string;
  division_id: string | null;
  location_id: string | null;
  deleted_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  division: { name: string } | null;
  location: { name: string } | null;
  company: { name: string } | null;
};

export function getUserColumns(
  onEdit: (user: UserRow) => void,
): ColumnDef<UserRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: 'full_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const name = row.getValue('full_name') as string;
        const email = row.original.email;
        return (
          <div>
            <span className="font-medium">{name}</span>
            <span className="block text-xs text-muted-foreground">{email}</span>
          </div>
        );
      },
      size: 220,
      meta: { grow: true },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const value = row.getValue('role') as string;
        return (
          <Badge variant="secondary" className={ROLE_COLORS[value as Role] || ROLE_COLORS.general_user}>
            {ROLE_DISPLAY[value as Role] || value}
          </Badge>
        );
      },
      size: 160,
    },
    {
      accessorKey: 'location',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
      cell: ({ row }) => {
        const location = row.original.location;
        return location?.name ? <span>{location.name}</span> : <span className="text-muted-foreground">—</span>;
      },
      size: 150,
    },
    {
      accessorKey: 'company_id',
      header: () => null,
      cell: () => null,
      enableHiding: true,
      enableSorting: false,
    },
    {
      id: 'company_name',
      accessorFn: (row) => row.company?.name || '',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      cell: ({ row }) => {
        const company = row.original.company;
        return company?.name ? <span>{company.name}</span> : <span className="text-muted-foreground">—</span>;
      },
      size: 160,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-sm text-blue-600 hover:underline"
          onClick={() => onEdit(row.original)}
        >
          Edit
        </Button>
      ),
      size: 80,
    },
  ];
}
