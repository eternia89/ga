'use server';

import { revalidatePath } from 'next/cache';
import { adminActionClient } from '@/lib/safe-action';
import { locationSchema } from '@/lib/validations/location-schema';
import { emptyToNull } from '@/lib/utils';
import { z } from 'zod';

// Create location
export const createLocation = adminActionClient
  .schema(locationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;

    // Check for duplicate name within the same company
    const { count } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .ilike('name', parsedInput.name)
      .eq('company_id', parsedInput.company_id)
      .is('deleted_at', null);

    if (count && count > 0) {
      throw new Error(`A location named "${parsedInput.name}" already exists in this company`);
    }

    const { data, error } = await supabase
      .from('locations')
      .insert([emptyToNull(parsedInput)])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/admin/settings');
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
    const { adminSupabase: supabase } = ctx;
    const { id, data } = parsedInput;

    // Check for duplicate name within the same company (excluding self)
    if (data.name) {
      const { count } = await supabase
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .ilike('name', data.name)
        .eq('company_id', data.company_id)
        .is('deleted_at', null)
        .neq('id', id);

      if (count && count > 0) {
        throw new Error(`A location named "${data.name}" already exists in this company`);
      }
    }

    const { data: updated, error } = await supabase
      .from('locations')
      .update(emptyToNull(data))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/admin/settings');
    return { success: true, data: updated };
  });

// Deactivate location (soft-delete with dependency check)
export const deactivateLocation = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id } = parsedInput;

    // Check for active dependencies (inventory_items)
    const { count: inventoryCount, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('id', { count: 'exact', head: true })
      .eq('location_id', id)
      .is('deleted_at', null);

    if (inventoryError && inventoryError.code !== '42P01') {
      // Ignore "relation does not exist" error for tables not yet created
      throw new Error(inventoryError.message);
    }

    const totalDeps = inventoryCount || 0;

    if (totalDeps > 0) {
      const deps: string[] = [];
      if (inventoryCount && inventoryCount > 0)
        deps.push(
          `${inventoryCount} inventory item${inventoryCount > 1 ? 's' : ''}`
        );

      throw new Error(`Cannot deactivate -- ${deps.join(', ')} assigned`);
    }

    // Soft delete
    const { error } = await supabase
      .from('locations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/admin/settings');
    return { success: true };
  });

// Reactivate location
export const reactivateLocation = adminActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { id } = parsedInput;

    const { data: location } = await supabase
      .from('locations')
      .select('name, company_id')
      .eq('id', id)
      .single();

    if (!location) {
      throw new Error('Location not found');
    }

    const { count } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .ilike('name', location.name)
      .eq('company_id', location.company_id)
      .is('deleted_at', null)
      .neq('id', id);

    if (count && count > 0) {
      throw new Error(`Cannot reactivate -- an active location named "${location.name}" already exists in this company`);
    }

    const { error } = await supabase
      .from('locations')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/admin/settings');
    return { success: true };
  });

// Bulk deactivate locations
export const bulkDeactivateLocations = adminActionClient
  .schema(z.object({ ids: z.array(z.string().uuid()) }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase: supabase } = ctx;
    const { ids } = parsedInput;

    const blocked: string[] = [];
    const deactivated: string[] = [];

    for (const id of ids) {
      // Check for dependencies
      const { count: inventoryCount } = await supabase
        .from('inventory_items')
        .select('id', { count: 'exact', head: true })
        .eq('location_id', id)
        .is('deleted_at', null);

      const totalDeps = inventoryCount || 0;

      if (totalDeps > 0) {
        blocked.push(id);
      } else {
        // Soft delete
        const { error } = await supabase
          .from('locations')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (!error) {
          deactivated.push(id);
        }
      }
    }

    revalidatePath('/admin/settings');
    return { success: true, deleted: deactivated.length, blocked: blocked.length };
  });
