'use client';

import { useEffect, useMemo, useState } from 'react';
import { createUserSchema, updateUserSchema } from '@/lib/validations/user-schema';
import { createUser, updateUser } from '@/app/actions/user-actions';
import { updateUserCompanyAccess } from '@/app/actions/user-company-access-actions';
import { extractActionError } from '@/lib/utils';
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

type Location = {
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
  location_id: string | null;
};

// Form type that works for both create and edit
// Email is optional because it's only used in create mode
type UserFormInput = {
  email?: string;
  full_name: string;
  role: Role;
  company_id: string;
  division_id?: string;
  location_id?: string;
};

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserUserFormInput;
  companies: Company[];
  divisions: Division[];
  locations: Location[];
  defaultCompanyId?: string;
  onSuccess?: () => void;
  onDeactivate?: () => void;
  onReactivate?: () => void;
  isDeactivated?: boolean;
  userCompanyAccess?: string[]; // company_id[] already granted to this user
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
  locations,
  defaultCompanyId,
  onSuccess,
  onDeactivate,
  onReactivate,
  isDeactivated,
  userCompanyAccess,
}: UserFormDialogProps) {
  const isEditMode = !!user;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    user?.company_id || defaultCompanyId || ''
  );
  const [selectedExtraCompanies, setSelectedExtraCompanies] = useState<string[]>(
    userCompanyAccess ?? []
  );

  useEffect(() => {
    if (open) {
      setSelectedCompanyId(user?.company_id || defaultCompanyId || '');
      setSelectedExtraCompanies(userCompanyAccess ?? []);
    }
  }, [open, user?.id, user?.company_id, defaultCompanyId, userCompanyAccess]);

  const toggleCompanyAccess = (companyId: string) => {
    setSelectedExtraCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

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
      location_id: user?.location_id || '',
    }),
    [user, defaultCompanyId]
  );

  // Filter divisions and locations by selected company
  const filteredDivisions = divisions.filter(d => d.company_id === selectedCompanyId);
  const filteredLocations = locations.filter(l => l.company_id === selectedCompanyId);

  const handleSubmit = async (data: UserFormInput) => {
    if (isEditMode && user) {
      // For update, we don't send email
      const { email, ...updateData } = data;
      const result = await updateUser({ id: user.id!, ...updateData });
      const error = extractActionError(result);
      if (error) return { error };
      if (!result?.data?.success) return { error: 'Failed to update user' };

      // Save multi-company access changes
      const accessResult = await updateUserCompanyAccess({
        userId: user.id!,
        companyIds: selectedExtraCompanies,
      });
      const accessError = extractActionError(accessResult);
      if (accessError) return { error: `User updated but failed to save company access: ${accessError}` };

      return {};
    } else {
      const result = await createUser(data as any);
      const error = extractActionError(result);
      if (error) return { error };
      if (!result?.data?.success) return { error: 'Failed to create user' };
      return {};
    }
  };

  return (
    <EntityFormDialog<UserFormInput>
      key={user?.id || 'create'}
      open={open}
      onOpenChange={onOpenChange}
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
      secondaryAction={
        isEditMode && isDeactivated && onReactivate
          ? { label: 'Reactivate', variant: 'success', onClick: onReactivate }
          : isEditMode && !isDeactivated && onDeactivate
            ? { label: 'Deactivate', variant: 'destructive', onClick: onDeactivate }
            : undefined
      }
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
                    <Input type="email" placeholder="user@example.com" maxLength={60} {...field} />
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
                  <Input placeholder="John Doe" maxLength={60} {...field} />
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
                    // Reset location if it doesn't belong to the new company
                    const currentLocation = form.getValues('location_id');
                    if (currentLocation) {
                      const locationBelongsToCompany = locations.some(
                        l => l.id === currentLocation && l.company_id === companyId
                      );
                      if (!locationBelongsToCompany) {
                        form.setValue('location_id', '');
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

          <FormField
            control={form.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isEditMode && <SelectItem value="none">None</SelectItem>}
                    {filteredLocations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditMode && user?.id && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <p className="text-sm font-medium">Additional Company Access</p>
                <p className="text-xs text-muted-foreground">
                  Grant this user access to create requests, jobs, and assets for other companies.
                  Does not change their role or primary company.
                </p>
              </div>
              <div className="space-y-2">
                {companies.map(company => {
                  const isPrimary = company.id === user.company_id;
                  return (
                    <label key={company.id} className={`flex items-center gap-2 ${isPrimary ? 'opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={isPrimary || selectedExtraCompanies.includes(company.id)}
                        onChange={() => !isPrimary && toggleCompanyAccess(company.id)}
                        disabled={isPrimary}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{company.name}</span>
                      {isPrimary && <span className="text-xs text-muted-foreground">(primary)</span>}
                    </label>
                  );
                })}
                {companies.length <= 1 && (
                  <p className="text-xs text-muted-foreground">No other companies available.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </EntityFormDialog>
  );
}
