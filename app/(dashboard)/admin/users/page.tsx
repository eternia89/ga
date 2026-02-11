import { createAdminClient } from '@/lib/supabase/admin';
import { UserTable } from '@/components/admin/users/user-table';
import type { UserRow } from '@/components/admin/users/user-columns';

export default async function UsersPage() {
  const adminSupabase = createAdminClient();

  // Fetch all user profiles with joined division and company names
  const { data: profiles } = await adminSupabase
    .from('user_profiles')
    .select('*, division:divisions(name), company:companies(name)')
    .order('full_name');

  // Fetch auth users to get last_sign_in_at
  const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers();

  // Create a map of auth user data by id
  const authUserMap = new Map(
    authUsers.map(u => [u.id, { last_sign_in_at: u.last_sign_in_at }])
  );

  // Merge last_sign_in_at into profiles
  const users: UserRow[] = (profiles || []).map(profile => ({
    ...profile,
    last_sign_in_at: authUserMap.get(profile.id)?.last_sign_in_at || null,
  }));

  // Fetch companies for form dropdown
  const { data: companies } = await adminSupabase
    .from('companies')
    .select('id, name')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('name');

  // Fetch divisions for form dropdown
  const { data: divisions } = await adminSupabase
    .from('divisions')
    .select('id, name, company_id')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('name');

  // Get the first admin user's company_id as default (or first company if no admin)
  const adminProfile = profiles?.find(p => p.role === 'admin');
  const defaultCompanyId = adminProfile?.company_id || companies?.[0]?.id || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Create and manage user accounts
        </p>
      </div>

      <UserTable
        users={users}
        companies={companies || []}
        divisions={divisions || []}
        defaultCompanyId={defaultCompanyId}
      />
    </div>
  );
}
