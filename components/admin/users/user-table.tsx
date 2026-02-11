'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { getUserColumns, type UserRow } from './user-columns';
import { UserFormDialog } from './user-form-dialog';
import { UserDeactivateDialog } from './user-deactivate-dialog';
import { deactivateUser, reactivateUser } from '@/app/actions/user-actions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { InlineFeedback } from '@/components/inline-feedback';

type Company = {
  id: string;
  name: string;
};

type Division = {
  id: string;
  name: string;
  company_id: string;
};

type UserTableProps = {
  users: UserRow[];
  companies: Company[];
  divisions: Division[];
  defaultCompanyId: string;
};

export function UserTable({ users, companies, divisions, defaultCompanyId }: UserTableProps) {
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(defaultCompanyId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | undefined>(undefined);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<UserRow | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter users based on showDeactivated toggle and selected company
  let filteredUsers = showDeactivated
    ? users
    : users.filter(u => !u.deleted_at);

  // Further filter by selected company if a company is selected
  if (selectedCompanyId) {
    filteredUsers = filteredUsers.filter(u => u.company_id === selectedCompanyId);
  }

  const handleCreate = () => {
    setEditingUser(undefined);
    setFormOpen(true);
  };

  const handleEdit = (user: UserRow) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleDeactivate = (user: UserRow) => {
    setDeactivatingUser(user);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = async (reason?: string) => {
    if (!deactivatingUser) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      const result = await deactivateUser({ id: deactivatingUser.id, reason });
      if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'User deactivated successfully' });
        setDeactivateDialogOpen(false);
        setDeactivatingUser(null);
      } else {
        setFeedback({ type: 'error', message: result?.serverError || 'Failed to deactivate user' });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivate = async (user: UserRow) => {
    setIsProcessing(true);
    setFeedback(null);

    try {
      const result = await reactivateUser({ id: user.id });
      if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'User reactivated successfully' });
      } else {
        setFeedback({ type: 'error', message: result?.serverError || 'Failed to reactivate user' });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDeactivate = async (ids: string[]) => {
    setIsProcessing(true);
    setFeedback(null);

    try {
      // Find the selected users from IDs
      const selectedUsers = users.filter(u => ids.includes(u.id));

      const results = await Promise.all(
        selectedUsers
          .filter(u => !u.deleted_at) // Only deactivate active users
          .map(u => deactivateUser({ id: u.id }))
      );

      const successCount = results.filter(r => r?.data?.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        setFeedback({ type: 'success', message: `${successCount} user(s) deactivated successfully` });
      } else {
        setFeedback({
          type: 'error',
          message: `${successCount} succeeded, ${failCount} failed`,
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = (ids: string[]) => {
    // Find the selected users from IDs
    const selectedUsers = users.filter(u => ids.includes(u.id));

    // Export selected users to CSV
    const headers = ['Name', 'Email', 'Role', 'Division', 'Company', 'Status', 'Last Login', 'Created'];
    const rows = selectedUsers.map(u => [
      u.full_name,
      u.email,
      u.role,
      u.division?.name || '',
      u.company?.name || '',
      u.deleted_at ? 'Deactivated' : 'Active',
      u.last_sign_in_at || 'Never',
      u.created_at,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = getUserColumns(handleEdit, handleDeactivate, handleReactivate);

  return (
    <div className="space-y-4">
      {/* Company filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Company:</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm"
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && <InlineFeedback type={feedback.type} message={feedback.message} />}

      <DataTable
        columns={columns}
        data={filteredUsers}
        searchKey="full_name"
        showDeactivatedToggle
        showDeactivated={showDeactivated}
        onDeactivatedToggleChange={setShowDeactivated}
        onBulkDelete={handleBulkDeactivate}
        onBulkExport={handleBulkExport}
        createButton={
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        }
        emptyMessage="No users found"
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser as any}
        companies={companies}
        divisions={divisions}
        defaultCompanyId={defaultCompanyId}
        onSuccess={() => setFeedback({ type: 'success', message: 'Changes saved successfully' })}
      />

      <UserDeactivateDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        user={deactivatingUser}
        onConfirm={handleDeactivateConfirm}
      />
    </div>
  );
}
