'use client';

import { useMemo, useState } from 'react';
import { createUserSchema, updateUserSchema } from '@/lib/validations/user-schema';
import { createUser, updateUser } from '@/app/actions/user-actions';
import type { Role } from '@/lib/auth/types';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityFormDialog } from '@/components/admin/entity-form-dialog';

type Company = {
  id: string;
  name: string;
};

type Division = {
  id: string;
  name: string;
  company_id: string;
};

type UserUserFormInput = {
  id?: string;
  email: string;
  full_name: string;
  role: Role;
  company_id: string;
  division_id: string | null;
};

// Form type that works for both create and edit
// Email is optional because it's only used in create mode
type UserFormInput = {
  email?: string;
  full_name: string;
  role: Role;
  company_id: string;
  division_id?: string;
};

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserUserFormInput;
  companies: Company[];
  divisions: Division[];
  defaultCompanyId?: string;
  onSuccess?: () => void;
};

const roleOptions = [
  { value: 'general_user', label: 'General User' },
  { value: 'ga_staff', label: 'GA Staff' },
  { value: 'ga_lead', label: 'GA Lead' },
  { value: 'finance_approver', label: 'Finance Approver' },
  { value: 'admin', label: 'Admin' },
];

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  companies,
  divisions,
  defaultCompanyId,
  onSuccess,
}: UserFormDialogProps) {
  const isEditMode = !!user;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    user?.company_id || defaultCompanyId || ''
  );

  const schema = useMemo(
    () => (isEditMode ? updateUserSchema : createUserSchema),
    [isEditMode]
  );

  const defaultValues = useMemo(
    () => ({
      email: user?.email || '',
      full_name: user?.full_name || '',
      role: (user?.role || 'general_user') as Role,
      company_id: user?.company_id || defaultCompanyId || '',
      division_id: user?.division_id || '',
    }),
    [user, defaultCompanyId]
  );

  // Filter divisions by selected company
  const filteredDivisions = divisions.filter(d => d.company_id === selectedCompanyId);

  const handleSubmit = async (data: UserFormInput) => {
    if (isEditMode && user) {
      // For update, we don't send email
      const { email, ...updateData } = data;
      const result = await updateUser({ id: user.id!, ...updateData });
      if (result?.data?.success) return {};
      return { error: result?.serverError || 'Failed to update user' };
    } else {
      const result = await createUser(data as any);
      if (result?.data?.success) return {};
      return { error: result?.serverError || 'Failed to create user' };
    }
  };

  return (
    <EntityFormDialog<UserFormInput>
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setSelectedCompanyId(user?.company_id || defaultCompanyId || '');
        }
        onOpenChange(nextOpen);
      }}
      schema={schema as any}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      title={isEditMode ? 'Edit User' : 'Create New User'}
      description={
        isEditMode
          ? 'Update user information. Email cannot be changed.'
          : 'Create a new user account. They can sign in with Google OAuth or use the forgot password flow to set a password.'
      }
      submitLabel={isEditMode ? 'Update User' : 'Create User'}
      submittingLabel="Saving..."
    >
      {(form) => (
        <>
          {!isEditMode && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" maxLength={255} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isEditMode && (
            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <Input type="email" value={user?.email} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
          )}

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" maxLength={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <Select
                  onValueChange={(companyId) => {
                    setSelectedCompanyId(companyId);
                    field.onChange(companyId);
                    // Reset division if it doesn't belong to the new company
                    const currentDivision = form.getValues('division_id');
                    if (currentDivision) {
                      const divisionBelongsToCompany = divisions.some(
                        d => d.id === currentDivision && d.company_id === companyId
                      );
                      if (!divisionBelongsToCompany) {
                        form.setValue('division_id', '');
                      }
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="division_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Division{isEditMode ? ' (Optional)' : ''}</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a division" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isEditMode && <SelectItem value="none">None</SelectItem>}
                    {filteredDivisions.map(division => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </EntityFormDialog>
  );
}
