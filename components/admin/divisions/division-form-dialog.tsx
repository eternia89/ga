"use client";

import { useMemo } from "react";
import {
  divisionSchema,
  DivisionFormData,
} from "@/lib/validations/division-schema";
import { Division, Company } from "@/lib/types/database";
import {
  createDivision,
  updateDivision,
} from "@/app/actions/division-actions";
import { extractActionError } from "@/lib/utils";
import { useUser } from "@/lib/auth/hooks";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EntityFormDialog } from "@/components/admin/entity-form-dialog";

interface DivisionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: Division;
  companies: Company[];
  onSuccess?: () => void;
  onDeactivate?: () => void;
  onReactivate?: () => void;
}

export function DivisionFormDialog({
  open,
  onOpenChange,
  division,
  companies,
  onSuccess,
  onDeactivate,
  onReactivate,
}: DivisionFormDialogProps) {
  const { profile } = useUser();

  const defaultValues = useMemo(
    () =>
      division
        ? {
            company_id: division.company_id,
            name: division.name,
            code: division.code || "",
            description: division.description || "",
          }
        : {
            company_id: profile?.company_id || "",
            name: "",
            code: "",
            description: "",
          },
    [division, profile]
  );

  const handleSubmit = async (data: DivisionFormData) => {
    if (division) {
      const result = await updateDivision({ id: division.id, data });
      const error = extractActionError(result);
      if (error) return { error };
    } else {
      const result = await createDivision(data);
      const error = extractActionError(result);
      if (error) return { error };
    }
    return {};
  };

  return (
    <EntityFormDialog<DivisionFormData>
      open={open}
      onOpenChange={onOpenChange}
      schema={divisionSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      title={division ? "Edit Division" : "Create Division"}
      submitLabel={division ? "Save Changes" : "Create Division"}
      submittingLabel={division ? "Saving..." : "Creating..."}
      secondaryAction={
        division && division.deleted_at && onReactivate
          ? { label: "Reactivate", variant: "success", onClick: onReactivate }
          : division && !division.deleted_at && onDeactivate
            ? { label: "Deactivate", variant: "destructive", onClick: onDeactivate }
            : undefined
      }
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Company <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies
                      .filter((c) => !c.deleted_at)
                      .map((company) => (
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Engineering" maxLength={60} {...field} />
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
                  <Input placeholder="ENG" maxLength={10} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Software and hardware engineering"
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
