'use server';

import { adminActionClient, authActionClient } from '@/lib/safe-action';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionOk } from '@/lib/types/action-responses';
import { ROLES } from '@/lib/constants/roles';
import { assertCompanyAccess } from '@/lib/auth/company-access';

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

    // Validate admin has access to the target user's company
    const { data: targetUser, error: fetchError } = await adminSupabase
      .from('user_profiles')
      .select('id, company_id')
      .eq('id', userId)
      .single();
    if (fetchError || !targetUser) throw new Error('User not found');
    await assertCompanyAccess(adminSupabase, ctx.profile.id, targetUser.company_id, ctx.profile.company_id);

    // Fetch current access for diff
    const { data: currentAccess } = await adminSupabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', userId);
    const currentIds = (currentAccess ?? []).map(r => r.company_id);

    // Compute diff
    const toAdd = companyIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !companyIds.includes(id));

    // Delete removed access (only specific rows, not all)
    if (toRemove.length > 0) {
      const { error: deleteError } = await adminSupabase
        .from('user_company_access')
        .delete()
        .eq('user_id', userId)
        .in('company_id', toRemove);
      if (deleteError) throw new Error(`Failed to revoke company access: ${deleteError.message}`);
    }

    // Insert new access
    if (toAdd.length > 0) {
      const rows = toAdd.map(cid => ({
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
