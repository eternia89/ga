"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  locationSchema,
  LocationFormData,
} from "@/lib/validations/location-schema";
import { Location, Company } from "@/lib/types/database";
import {
  createLocation,
  updateLocation,
} from "@/app/actions/location-actions";
import { useUser } from "@/lib/auth/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
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
import { Button } from "@/components/ui/button";

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location;
  companies: Company[];
  onSuccess?: () => void;
}

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  companies,
  onSuccess,
}: LocationFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: location
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
  });

  // Reset form when dialog opens/closes or location changes
  useEffect(() => {
    if (open) {
      form.reset(
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
            }
      );
      setError(null);
    }
  }, [open, location, profile, form]);

  const onSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (location) {
        // Update existing location
        const result = await updateLocation({ id: location.id, data });
        if (result?.serverError) {
          setError(result.serverError);
          return;
        }
      } else {
        // Create new location
        const result = await createLocation(data);
        if (result?.serverError) {
          setError(result.serverError);
          return;
        }
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {location ? "Edit Location" : "Create Location"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input placeholder="Main Office" maxLength={100} {...field} />
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

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? location
                    ? "Saving..."
                    : "Creating..."
                  : location
                    ? "Save Changes"
                    : "Create Location"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
