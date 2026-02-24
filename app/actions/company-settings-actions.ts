'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';

// ============================================================================
// getCompanySettings — returns all company_settings rows as Record<string, string>
// ============================================================================
export const getCompanySettings = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { supabase, profile } = ctx;

    const { data, error } = await supabase
      .from('company_settings')
      .select('key, value')
      .eq('company_id', profile.company_id);

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
});

export const updateCompanySetting = authActionClient
  .schema(updateCompanySettingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check — admin only
    if (profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const now = new Date().toISOString();

    // Check if the row exists
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('key', parsedInput.key)
      .single();

    if (existing) {
      // Update existing row
      const { error } = await supabase
        .from('company_settings')
        .update({
          value: parsedInput.value,
          updated_by: profile.id,
          updated_at: now,
        })
        .eq('company_id', profile.company_id)
        .eq('key', parsedInput.key);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      // Insert new row
      const { error } = await supabase
        .from('company_settings')
        .insert({
          company_id: profile.company_id,
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
