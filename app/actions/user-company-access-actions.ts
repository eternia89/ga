'use server';

import { adminActionClient, authActionClient } from '@/lib/safe-action';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionOk } from '@/lib/types/action-responses';
import { ROLES } from '@/lib/constants/roles';

// Get all company_ids granted to a user (beyond their primary company)
// Used by create modals to determine if company selector should show
export const getUserCompanyAccess = authActionClient
  .schema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<{ companyIds: string[] }> => {
    const { supabase, profile } = ctx;
    // Users can only fetch their own access; admins can fetch any user's
    if (profile.id !== parsedInput.userId && profile.role !== ROLES.ADMIN) {
      throw new Error('Unauthorized');
    }
    const { data, error } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', parsedInput.userId);
    if (error) throw new Error(`Failed to fetch company access: ${error.message}`);
    return { companyIds: (data ?? []).map(r => r.company_id) };
  });

// Replace all company access for a user (admin only)
// Receives the full desired set of company_ids — diffs and upserts/deletes
export const updateUserCompanyAccess = adminActionClient
  .schema(z.object({
    userId: z.string().uuid(),
    companyIds: z.array(z.string().uuid()).max(50),
  }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const adminSupabase = createAdminClient();
    const { userId, companyIds } = parsedInput;

    // Delete all existing access for this user
    const { error: deleteError } = await adminSupabase
      .from('user_company_access')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw new Error(`Failed to clear company access: ${deleteError.message}`);

    // Insert new access rows if any
    if (companyIds.length > 0) {
      const rows = companyIds.map(cid => ({
        user_id: userId,
        company_id: cid,
        granted_by: ctx.profile.id,
      }));
      const { error: insertError } = await adminSupabase
        .from('user_company_access')
        .insert(rows);
      if (insertError) throw new Error(`Failed to grant company access: ${insertError.message}`);
    }

    revalidatePath('/admin/settings');
    return { success: true };
  });
