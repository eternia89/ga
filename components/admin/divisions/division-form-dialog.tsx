"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  divisionSchema,
  DivisionFormData,
} from "@/lib/validations/division-schema";
import { Division, Company } from "@/lib/types/database";
import {
  createDivision,
  updateDivision,
} from "@/app/actions/division-actions";
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

interface DivisionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: Division;
  companies: Company[];
  onSuccess?: () => void;
}

export function DivisionFormDialog({
  open,
  onOpenChange,
  division,
  companies,
  onSuccess,
}: DivisionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();

  const form = useForm<DivisionFormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: division
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
  });

  // Reset form when dialog opens/closes or division changes
  useEffect(() => {
    if (open) {
      form.reset(
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
            }
      );
      setError(null);
    }
  }, [open, division, profile, form]);

  const onSubmit = async (data: DivisionFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (division) {
        // Update existing division
        const result = await updateDivision({ id: division.id, data });
        if (result?.serverError) {
          setError(result.serverError);
          return;
        }
      } else {
        // Create new division
        const result = await createDivision(data);
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
            {division ? "Edit Division" : "Create Division"}
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
                    <Input placeholder="Engineering" maxLength={100} {...field} />
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
                  ? division
                    ? "Saving..."
                    : "Creating..."
                  : division
                    ? "Save Changes"
                    : "Create Division"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
