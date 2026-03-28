import { type SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns all company IDs a user can access (primary + extra via user_company_access).
 * Destructure as `{ allAccessibleCompanyIds, extraCompanyIds }` to preserve existing variable names.
 */
export async function getAccessibleCompanyIds(
  supabase: SupabaseClient,
  userId: string,
  primaryCompanyId: string
): Promise<{ allAccessibleCompanyIds: string[]; extraCompanyIds: string[] }> {
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', userId);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  return { allAccessibleCompanyIds: [primaryCompanyId, ...extraCompanyIds], extraCompanyIds };
}

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
