import { type SupabaseClient } from '@supabase/supabase-js';

/**
 * Validates that a user has access to the specified company.
 * Skips check if targetCompanyId matches the user's primary company.
 * Throws if no access row found in user_company_access.
 */
export async function assertCompanyAccess(
  supabase: SupabaseClient,
  userId: string,
  targetCompanyId: string,
  profileCompanyId: string
): Promise<void> {
  if (targetCompanyId === profileCompanyId) return;

  const { data: access } = await supabase
    .from('user_company_access')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', targetCompanyId)
    .maybeSingle();

  if (!access) {
    throw new Error('You do not have access to the selected company.');
  }
}
