"use server";

import { revalidatePath } from "next/cache";
import { adminActionClient } from "@/lib/safe-action";
import { categorySchema } from "@/lib/validations/category-schema";
import { z } from "zod";

// Create category
// IMPORTANT: Auto-fills company_id from admin's profile for audit purposes only
// Categories are GLOBAL - not company-scoped for selection/display
export const createCategory = adminActionClient
  .schema(categorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Auto-fill company_id for audit purposes (not exposed to user)
    const insertData = {
      ...parsedInput,
      company_id: profile.company_id,
    };

    const { data, error } = await supabase
      .from("categories")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true, data };
  });

// Update category
// Note: type is immutable after creation
export const updateCategory = adminActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      data: categorySchema.omit({ type: true }), // Type cannot be changed
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { id, data } = parsedInput;

    const { data: updated, error } = await supabase
      .from("categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  });

// Delete category (soft-delete with dependency check)
export const deleteCategory = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { id } = parsedInput;

    // Check for active dependencies (requests, inventory_items)
    // Note: These tables may not exist yet
    const results = await Promise.allSettled([
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("category_id", id)
        .is("deleted_at", null),
      supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("category_id", id)
        .is("deleted_at", null),
    ]);

    let requestsCount = 0;
    let inventoryCount = 0;

    // Extract counts, ignoring "table does not exist" errors
    if (results[0].status === "fulfilled") {
      requestsCount = results[0].value.count || 0;
    }
    if (results[1].status === "fulfilled") {
      inventoryCount = results[1].value.count || 0;
    }

    const totalDeps = requestsCount + inventoryCount;

    if (totalDeps > 0) {
      const deps: string[] = [];
      if (requestsCount > 0)
        deps.push(`${requestsCount} request${requestsCount > 1 ? "s" : ""}`);
      if (inventoryCount > 0)
        deps.push(
          `${inventoryCount} inventory item${inventoryCount > 1 ? "s" : ""}`
        );

      throw new Error(`Cannot delete -- ${deps.join(", ")} assigned`);
    }

    // Soft delete
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Restore category
export const restoreCategory = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { id } = parsedInput;

    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Bulk delete categories
export const bulkDeleteCategories = adminActionClient
  .schema(z.object({ ids: z.array(z.string().uuid()) }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { ids } = parsedInput;

    const blocked: string[] = [];
    const deleted: string[] = [];

    for (const id of ids) {
      // Check for dependencies
      const results = await Promise.allSettled([
        supabase
          .from("requests")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id)
          .is("deleted_at", null),
        supabase
          .from("inventory_items")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id)
          .is("deleted_at", null),
      ]);

      let totalDeps = 0;
      if (results[0].status === "fulfilled") {
        totalDeps += results[0].value.count || 0;
      }
      if (results[1].status === "fulfilled") {
        totalDeps += results[1].value.count || 0;
      }

      if (totalDeps > 0) {
        blocked.push(id);
      } else {
        // Soft delete
        const { error } = await supabase
          .from("categories")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);

        if (!error) {
          deleted.push(id);
        }
      }
    }

    revalidatePath("/admin/settings");
    return { success: true, deleted: deleted.length, blocked: blocked.length };
  });
