'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Button } from '@/components/ui/button';

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
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    ga_lead: 'bg-blue-100 text-blue-700',
    ga_staff: 'bg-green-100 text-green-700',
    finance_approver: 'bg-yellow-100 text-yellow-700',
    general_user: 'bg-gray-100 text-gray-700',
  };

  const roleDisplay: Record<string, string> = {
    admin: 'Admin',
    ga_lead: 'GA Lead',
    ga_staff: 'GA Staff',
    finance_approver: 'Finance Approver',
    general_user: 'General User',
  };

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
        const role = row.original.role;
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{name}</span>
              <Badge variant="secondary" className={roleColors[role] || roleColors.general_user}>
                {roleDisplay[role] || role}
              </Badge>
            </div>
            <span className="block text-xs text-muted-foreground">{email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'location',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
      cell: ({ row }) => {
        const location = row.original.location;
        return location?.name ? <span>{location.name}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'deleted_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const deletedAt = row.getValue('deleted_at') as string | null;
        return (
          <Badge variant={deletedAt ? 'destructive' : 'default'}>
            {deletedAt ? 'Deactivated' : 'Active'}
          </Badge>
        );
      },
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
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string;
        return <span>{format(new Date(createdAt), 'dd-MM-yyyy')}</span>;
      },
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
    },
  ];
}
