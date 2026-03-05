'use client';

import { useState, useEffect } from 'react';
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
  initialUserId?: string;
};

export function UserTable({ users, companies, divisions, defaultCompanyId, initialUserId }: UserTableProps) {
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | undefined>(undefined);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<UserRow | null>(null);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [reactivatingUser, setReactivatingUser] = useState<UserRow | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter users based on showDeactivated toggle
  const filteredUsers = showDeactivated
    ? users
    : users.filter(u => !u.deleted_at);

  const companyFilterOptions = companies.map(c => ({ label: c.name, value: c.id }));

  const handleCreate = () => {
    setEditingUser(undefined);
    setFormOpen(true);
  };

  // Auto-open edit dialog when initialUserId is set (permalink support)
  useEffect(() => {
    if (initialUserId) {
      const targetUser = users.find((u) => u.id === initialUserId);
      if (targetUser) {
        setEditingUser(targetUser);
        setFormOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId]);

  const handleEdit = (user: UserRow) => {
    setEditingUser(user);
    setFormOpen(true);
    // Update URL with userid for shareable permalink
    const url = new URL(window.location.href);
    url.searchParams.set('userid', user.id);
    window.history.replaceState({}, '', url.toString());
  };

  // Removed handleDeactivate from table row - now triggered from FormDialog

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
        setFormOpen(false);
        setEditingUser(undefined);
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

  // Removed handleReactivate from table row - now triggered from FormDialog

  const handleReactivateConfirm = async (reason?: string) => {
    if (!reactivatingUser) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      const result = await reactivateUser({ id: reactivatingUser.id, reason });
      if (result?.data?.success) {
        setFeedback({ type: 'success', message: 'User reactivated successfully' });
        setReactivateDialogOpen(false);
        setReactivatingUser(null);
        setFormOpen(false);
        setEditingUser(undefined);
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

  const columns = getUserColumns(handleEdit);

  return (
    <div className="space-y-4">
      {feedback && <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        searchKey="full_name"
        filterableColumns={[
          { id: 'company_id', title: 'Company', options: companyFilterOptions },
        ]}
        defaultColumnFilters={[]}
        columnVisibility={{ company_id: false }}
        showDeactivatedToggle
        showDeactivated={showDeactivated}
        onDeactivatedToggleChange={setShowDeactivated}
        onBulkDelete={handleBulkDeactivate}
        onBulkExport={handleBulkExport}
        emptyMessage="No users found"
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            // Remove userid from URL when dialog closes
            const url = new URL(window.location.href);
            url.searchParams.delete('userid');
            window.history.replaceState({}, '', url.toString());
          }
        }}
        user={editingUser as any}
        companies={companies}
        divisions={divisions}
        defaultCompanyId={defaultCompanyId}
        onSuccess={() => setFeedback({ type: 'success', message: 'Changes saved successfully' })}
        onDeactivate={() => {
          setDeactivatingUser(editingUser || null);
          setDeactivateDialogOpen(true);
        }}
        onReactivate={() => {
          setReactivatingUser(editingUser || null);
          setReactivateDialogOpen(true);
        }}
        isDeactivated={!!editingUser?.deleted_at}
      />

      <UserDeactivateDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        user={deactivatingUser}
        onConfirm={handleDeactivateConfirm}
        mode="deactivate"
      />

      <UserDeactivateDialog
        open={reactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
        user={reactivatingUser}
        onConfirm={handleReactivateConfirm}
        mode="reactivate"
      />
    </div>
  );
}
