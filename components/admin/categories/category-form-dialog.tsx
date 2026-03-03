"use client";

import { useMemo } from "react";
import {
  categorySchema,
  CategoryFormData,
} from "@/lib/validations/category-schema";
import { Category } from "@/lib/types/database";
import {
  createCategory,
  updateCategory,
} from "@/app/actions/category-actions";
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

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  defaultType?: "request" | "asset";
  onSuccess?: () => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  defaultType,
  onSuccess,
}: CategoryFormDialogProps) {
  const defaultValues = useMemo(
    () =>
      category
        ? {
            name: category.name,
            type: category.type,
            description: category.description || "",
          }
        : {
            name: "",
            type: (defaultType || "request") as "request" | "asset",
            description: "",
          },
    [category, defaultType]
  );

  const handleSubmit = async (data: CategoryFormData) => {
    if (category) {
      // Update existing category (without type)
      const { type, ...updateData } = data;
      const result = await updateCategory({ id: category.id, data: updateData });
      if (result?.serverError) return { error: result.serverError };
    } else {
      const result = await createCategory(data);
      if (result?.serverError) return { error: result.serverError };
    }
    return {};
  };

  return (
    <EntityFormDialog<CategoryFormData>
      open={open}
      onOpenChange={onOpenChange}
      schema={categorySchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      title={category ? "Edit Category" : "Create Category"}
      submitLabel={category ? "Save Changes" : "Create Category"}
      submittingLabel={category ? "Saving..." : "Creating..."}
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
                  <Input placeholder="Maintenance" maxLength={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hide type field when defaultType is provided (sub-tab context) */}
          {!defaultType && (
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!category}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="request">Request</SelectItem>
                      <SelectItem value="asset">Asset</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Equipment maintenance and repairs"
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
