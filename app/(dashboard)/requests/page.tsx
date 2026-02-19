import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RequestTable } from '@/components/requests/request-table';

export default async function RequestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, division_id, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Role-based request query
  const requestQuery = supabase
    .from('requests')
    .select(
      '*, location:locations(name), category:categories(name), requester:user_profiles!requester_id(name, email), assigned_user:user_profiles!assigned_to(name, email), division:divisions(name)'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // General users only see their own requests
  if (profile.role === 'general_user') {
    requestQuery.eq('requester_id', profile.id);
  }
  // All other roles see all company requests (RLS enforces company isolation)

  // Fetch all data in parallel
  const [requestsResult, categoriesResult, usersResult] = await Promise.all([
    requestQuery,
    supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'request')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('user_profiles')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('name'),
  ]);

  const requests = requestsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const users = usersResult.data ?? [];

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground mt-1">
          {profile.role === 'general_user'
            ? 'View and manage your submitted requests'
            : 'View and manage all company requests'}
        </p>
      </div>

      <RequestTable
        data={requests}
        categories={categories}
        users={users}
        currentUserId={profile.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
