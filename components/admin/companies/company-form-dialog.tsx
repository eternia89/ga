"use client";

import { useMemo } from "react";
import {
  companySchema,
  CompanyFormData,
} from "@/lib/validations/company-schema";
import { Company } from "@/lib/types/database";
import { createCompany, updateCompany } from "@/app/actions/company-actions";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EntityFormDialog } from "@/components/admin/entity-form-dialog";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSuccess?: () => void;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyFormDialogProps) {
  const defaultValues = useMemo(
    () =>
      company
        ? {
            name: company.name,
            code: company.code || "",
            address: company.address || "",
            phone: company.phone || "",
            email: company.email || "",
          }
        : {
            name: "",
            code: "",
            address: "",
            phone: "",
            email: "",
          },
    [company]
  );

  const handleSubmit = async (data: CompanyFormData) => {
    if (company) {
      const result = await updateCompany({ id: company.id, data });
      if (result?.serverError) return { error: result.serverError };
    } else {
      const result = await createCompany(data);
      if (result?.serverError) return { error: result.serverError };
    }
    return {};
  };

  return (
    <EntityFormDialog<CompanyFormData>
      open={open}
      onOpenChange={onOpenChange}
      schema={companySchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      title={company ? "Edit Company" : "Create Company"}
      submitLabel={company ? "Save Changes" : "Create Company"}
      submittingLabel={company ? "Saving..." : "Creating..."}
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corporation" maxLength={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="ACME" maxLength={10} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contact@acme.com"
                    maxLength={255}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+62 812-3456-7890" maxLength={20} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123 Business St, City, State 12345"
                    maxLength={200}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </EntityFormDialog>
  );
}
