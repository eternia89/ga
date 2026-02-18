"use server";

import { revalidatePath } from "next/cache";
import { adminActionClient } from "@/lib/safe-action";
import { companySchema } from "@/lib/validations/company-schema";
import { emptyToNull } from "@/lib/utils";
import { z } from "zod";

// Create company
export const createCompany = adminActionClient
  .schema(companySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;

    // Check for duplicate name (case-insensitive)
    const { count } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .ilike("name", parsedInput.name)
      .is("deleted_at", null);

    if (count && count > 0) {
      throw new Error("A company with this name already exists");
    }

    const { data, error } = await supabase
      .from("companies")
      .insert([emptyToNull(parsedInput)])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true, data };
  });

// Update company
export const updateCompany = adminActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      data: companySchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id, data } = parsedInput;

    // Check for duplicate name (case-insensitive, excluding self)
    const { count } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .ilike("name", data.name)
      .neq("id", id)
      .is("deleted_at", null);

    if (count && count > 0) {
      throw new Error("A company with this name already exists");
    }

    const { data: updated, error } = await supabase
      .from("companies")
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

// Delete company (soft-delete with dependency check)
export const deleteCompany = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id } = parsedInput;

    // Check for active dependencies
    const [divisionsResult, locationsResult, usersResult] = await Promise.all([
      supabase
        .from("divisions")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id)
        .is("deleted_at", null),
      supabase
        .from("locations")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id)
        .is("deleted_at", null),
      supabase
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id)
        .is("deleted_at", null),
    ]);

    const divisionsCount = divisionsResult.count || 0;
    const locationsCount = locationsResult.count || 0;
    const usersCount = usersResult.count || 0;

    const totalDeps = divisionsCount + locationsCount + usersCount;

    if (totalDeps > 0) {
      const deps: string[] = [];
      if (divisionsCount > 0) deps.push(`${divisionsCount} division${divisionsCount > 1 ? "s" : ""}`);
      if (locationsCount > 0) deps.push(`${locationsCount} location${locationsCount > 1 ? "s" : ""}`);
      if (usersCount > 0) deps.push(`${usersCount} user${usersCount > 1 ? "s" : ""}`);

      throw new Error(`Cannot delete -- ${deps.join(", ")} assigned`);
    }

    // Soft delete
    const { error } = await supabase
      .from("companies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Restore company
export const restoreCompany = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id } = parsedInput;

    // Get the company being restored
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", id)
      .single();

    if (!company) {
      throw new Error("Company not found");
    }

    // Check for duplicate name among active companies
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", company.name)
      .is("deleted_at", null)
      .neq("id", id)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error(`Cannot restore -- an active company named "${company.name}" already exists`);
    }

    const { error } = await supabase
      .from("companies")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  });

// Bulk delete companies
export const bulkDeleteCompanies = adminActionClient
  .schema(z.object({ ids: z.array(z.string().uuid()) }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { ids } = parsedInput;

    const blocked: string[] = [];
    const deleted: string[] = [];

    for (const id of ids) {
      // Check dependencies
      const [divisionsResult, locationsResult, usersResult] = await Promise.all([
        supabase
          .from("divisions")
          .select("id", { count: "exact", head: true })
          .eq("company_id", id)
          .is("deleted_at", null),
        supabase
          .from("locations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", id)
          .is("deleted_at", null),
        supabase
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("company_id", id)
          .is("deleted_at", null),
      ]);

      const totalDeps = (divisionsResult.count || 0) + (locationsResult.count || 0) + (usersResult.count || 0);

      if (totalDeps > 0) {
        blocked.push(id);
      } else {
        // Soft delete
        const { error } = await supabase
          .from("companies")
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
