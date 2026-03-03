"use server";

import { revalidatePath } from "next/cache";
import { adminActionClient } from "@/lib/safe-action";
import { divisionSchema } from "@/lib/validations/division-schema";
import { emptyToNull } from "@/lib/utils";
import { z } from "zod";

// Get companies for dropdown
export const getCompanies = adminActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { adminSupabase: supabase } = ctx;

    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name");

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  });

// Create division
export const createDivision = adminActionClient
  .schema(divisionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;

    // Check for duplicate name within the same company
    const { data: existing } = await supabase
      .from("divisions")
      .select("id")
      .ilike("name", parsedInput.name)
      .eq("company_id", parsedInput.company_id)
      .is("deleted_at", null)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error(`A division named "${parsedInput.name}" already exists in this company`);
    }

    const { data, error } = await supabase
      .from("divisions")
      .insert([emptyToNull(parsedInput)])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true, data };
  });

// Update division
export const updateDivision = adminActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      data: divisionSchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id, data } = parsedInput;

    // Check for duplicate name within the same company (excluding self)
    if (data.name) {
      const { data: existing } = await supabase
        .from("divisions")
        .select("id")
        .ilike("name", data.name)
        .eq("company_id", data.company_id)
        .is("deleted_at", null)
        .neq("id", id)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error(`A division named "${data.name}" already exists in this company`);
      }
    }

    const { data: updated, error } = await supabase
      .from("divisions")
      .update(emptyToNull(data))
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  });

// Delete division (soft-delete with dependency check)
export const deleteDivision = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id } = parsedInput;

    // Check for active users in this division
    const { count, error: countError } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .eq("division_id", id)
      .is("deleted_at", null);

    if (countError) {
      throw new Error(countError.message);
    }

    if (count && count > 0) {
      throw new Error(`Cannot deactivate -- ${count} user${count > 1 ? "s" : ""} assigned`);
    }

    // Soft delete
    const { error } = await supabase
      .from("divisions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Restore division
export const restoreDivision = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id } = parsedInput;

    const { data: division } = await supabase
      .from("divisions")
      .select("name, company_id")
      .eq("id", id)
      .single();

    if (!division) {
      throw new Error("Division not found");
    }

    const { data: existing } = await supabase
      .from("divisions")
      .select("id")
      .ilike("name", division.name)
      .eq("company_id", division.company_id)
      .is("deleted_at", null)
      .neq("id", id)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error(`Cannot reactivate -- an active division named "${division.name}" already exists in this company`);
    }

    const { error } = await supabase
      .from("divisions")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Bulk delete divisions
export const bulkDeleteDivisions = adminActionClient
  .schema(z.object({ ids: z.array(z.string().uuid()) }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { ids } = parsedInput;

    const blocked: string[] = [];
    const deleted: string[] = [];

    for (const id of ids) {
      // Check for active users
      const { count } = await supabase
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("division_id", id)
        .is("deleted_at", null);

      if (count && count > 0) {
        blocked.push(id);
      } else {
        // Soft delete
        const { error } = await supabase
          .from("divisions")
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
