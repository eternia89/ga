'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';
import type { ActionOk } from '@/lib/types/action-responses';
import { ROLES } from '@/lib/constants/roles';
import { assertCompanyAccess } from '@/lib/auth/company-access';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// getCompanySettings — returns all company_settings rows as Record<string, string>
// ============================================================================
export const getCompanySettings = authActionClient
  .schema(z.object({ company_id: z.string().uuid().optional() }))
  .action(async ({ parsedInput, ctx }): Promise<{ settings: Record<string, string> }> => {
    const { supabase, profile } = ctx;
    const effectiveCompanyId = parsedInput.company_id ?? profile.company_id;

    // If targeting a different company, validate access and use admin client
    let client = supabase;
    if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
      const adminSupabase = createAdminClient();
      await assertCompanyAccess(adminSupabase, profile.id, parsedInput.company_id, profile.company_id);
      client = adminSupabase;
    }

    const { data, error } = await client
      .from('company_settings')
      .select('key, value')
      .eq('company_id', effectiveCompanyId);

    if (error) {
      throw new Error(error.message);
    }

    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return { settings };
  });

// ============================================================================
// updateCompanySetting — admin only; upserts a single key/value pair
// ============================================================================
const updateCompanySettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(100),
  company_id: z.string().uuid().optional(),
});

export const updateCompanySetting = authActionClient
  .schema(updateCompanySettingSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check — admin only
    if (profile.role !== ROLES.ADMIN) {
      throw new Error('Admin access required');
    }

    const effectiveCompanyId = parsedInput.company_id ?? profile.company_id;

    // If targeting a different company, validate access and use admin client
    let client = supabase;
    if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
      const adminSupabase = createAdminClient();
      await assertCompanyAccess(adminSupabase, profile.id, parsedInput.company_id, profile.company_id);
      client = adminSupabase;
    }

    const now = new Date().toISOString();

    // Check if the row exists
    const { data: existing } = await client
      .from('company_settings')
      .select('id')
      .eq('company_id', effectiveCompanyId)
      .eq('key', parsedInput.key)
      .maybeSingle();

    if (existing) {
      // Update existing row
      const { error } = await client
        .from('company_settings')
        .update({
          value: parsedInput.value,
          updated_by: profile.id,
          updated_at: now,
        })
        .eq('company_id', effectiveCompanyId)
        .eq('key', parsedInput.key);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      // Insert new row
      const { error } = await client
        .from('company_settings')
        .insert({
          company_id: effectiveCompanyId,
          key: parsedInput.key,
          value: parsedInput.value,
          updated_by: profile.id,
        });

      if (error) {
        throw new Error(error.message);
      }
    }

    revalidatePath('/admin/company-settings');
    return { success: true };
  });
