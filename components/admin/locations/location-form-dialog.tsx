"use client";

import { useMemo } from "react";
import {
  locationSchema,
  LocationFormData,
} from "@/lib/validations/location-schema";
import { Location, Company } from "@/lib/types/database";
import {
  createLocation,
  updateLocation,
} from "@/app/actions/location-actions";
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

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location;
  companies: Company[];
  onSuccess?: () => void;
  onDeactivate?: () => void;
  onReactivate?: () => void;
}

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  companies,
  onSuccess,
  onDeactivate,
  onReactivate,
}: LocationFormDialogProps) {
  const { profile } = useUser();

  const defaultValues = useMemo(
    () =>
      location
        ? {
            company_id: location.company_id,
            name: location.name,
            address: location.address || "",
          }
        : {
            company_id: profile?.company_id || "",
            name: "",
            address: "",
          },
    [location, profile]
  );

  const handleSubmit = async (data: LocationFormData) => {
    if (location) {
      const result = await updateLocation({ id: location.id, data });
      const error = extractActionError(result);
      if (error) return { error };
    } else {
      const result = await createLocation(data);
      const error = extractActionError(result);
      if (error) return { error };
    }
    return {};
  };

  return (
    <EntityFormDialog<LocationFormData>
      open={open}
      onOpenChange={onOpenChange}
      schema={locationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      title={location ? "Edit Location" : "Create Location"}
      submitLabel={location ? "Save Changes" : "Create Location"}
      submittingLabel={location ? "Saving..." : "Creating..."}
      secondaryAction={
        location && location.deleted_at && onReactivate
          ? { label: "Reactivate", variant: "success", onClick: onReactivate }
          : location && !location.deleted_at && onDeactivate
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
                  <Input placeholder="Main Office" maxLength={60} {...field} />
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
