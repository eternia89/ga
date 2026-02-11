"use server";

import { revalidatePath } from "next/cache";
import { adminActionClient } from "@/lib/safe-action";
import { locationSchema } from "@/lib/validations/location-schema";
import { z } from "zod";

// Create location
export const createLocation = adminActionClient
  .schema(locationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from("locations")
      .insert([parsedInput])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true, data };
  });

// Update location
export const updateLocation = adminActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      data: locationSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { id, data } = parsedInput;

    const { data: updated, error } = await supabase
      .from("locations")
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

// Delete location (soft-delete with dependency check)
export const deleteLocation = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { id } = parsedInput;

    // Check for active dependencies (requests, inventory_items)
    // Note: Requests table may not exist yet, but we'll check when it does
    const { count: inventoryCount, error: inventoryError } = await supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("location_id", id)
      .is("deleted_at", null);

    if (inventoryError && inventoryError.code !== "42P01") {
      // Ignore "relation does not exist" error for tables not yet created
      throw new Error(inventoryError.message);
    }

    const totalDeps = inventoryCount || 0;

    if (totalDeps > 0) {
      const deps: string[] = [];
      if (inventoryCount && inventoryCount > 0)
        deps.push(
          `${inventoryCount} inventory item${inventoryCount > 1 ? "s" : ""}`
        );

      throw new Error(`Cannot delete -- ${deps.join(", ")} assigned`);
    }

    // Soft delete
    const { error } = await supabase
      .from("locations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Restore location
export const restoreLocation = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { id } = parsedInput;

    const { error } = await supabase
      .from("locations")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Bulk delete locations
export const bulkDeleteLocations = adminActionClient
  .schema(z.object({ ids: z.array(z.string().uuid()) }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;
    const { ids } = parsedInput;

    const blocked: string[] = [];
    const deleted: string[] = [];

    for (const id of ids) {
      // Check for dependencies
      const { count: inventoryCount } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("location_id", id)
        .is("deleted_at", null);

      const totalDeps = inventoryCount || 0;

      if (totalDeps > 0) {
        blocked.push(id);
      } else {
        // Soft delete
        const { error } = await supabase
          .from("locations")
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
