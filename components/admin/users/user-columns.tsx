'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Ban, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string;
  division_id: string | null;
  deleted_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  division: { name: string } | null;
  company: { name: string } | null;
};

type UserActionsProps = {
  user: UserRow;
  onEdit: (user: UserRow) => void;
  onDeactivate: (user: UserRow) => void;
  onReactivate: (user: UserRow) => void;
};

function UserActions({ user, onEdit, onDeactivate, onReactivate }: UserActionsProps) {
  const isDeactivated = !!user.deleted_at;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {isDeactivated ? (
          <DropdownMenuItem onClick={() => onReactivate(user)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Reactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onDeactivate(user)} className="text-red-600">
            <Ban className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getUserColumns(
  onEdit: (user: UserRow) => void,
  onDeactivate: (user: UserRow) => void,
  onReactivate: (user: UserRow) => void
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
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
              {initials}
            </div>
            <span className="font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge variant="secondary" className={roleColors[role] || roleColors.general_user}>
            {roleDisplay[role] || role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'division',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Division" />,
      cell: ({ row }) => {
        const division = row.original.division;
        return <span>{division?.name || '—'}</span>;
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
      accessorFn: (row) => row.company?.name || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      cell: ({ row }) => {
        const company = row.original.company;
        return <span>{company?.name || '—'}</span>;
      },
    },
    {
      accessorKey: 'last_sign_in_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
      cell: ({ row }) => {
        const lastLogin = row.getValue('last_sign_in_at') as string | null;
        if (!lastLogin) return <span className="text-gray-500">Never</span>;
        return <span>{format(new Date(lastLogin), 'dd-MM-yyyy, HH:mm:ss')}</span>;
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
        <UserActions
          user={row.original}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onReactivate={onReactivate}
        />
      ),
    },
  ];
}
