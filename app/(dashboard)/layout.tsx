import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthProvider } from '@/lib/auth/hooks';
import { Sidebar } from '@/components/sidebar';
import type { ReactNode } from 'react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Fetch user profile with joined division and company names
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*, division:divisions(name), company:companies(name)')
    .eq('id', user.id)
    .single();

  // If no profile or profile is deleted, redirect to login
  if (profileError || !profile || profile.deleted_at) {
    redirect('/login?error=deactivated');
  }

  const companyName = profile.company?.name || 'Company';

  // Fetch entity counts for admin users (for sidebar badges)
  let entityCounts;
  if (profile.role === 'admin') {
    const [divisionsResult, locationsResult, categoriesResult, usersResult] = await Promise.all([
      supabase.from('divisions').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('locations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('categories').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    ]);

    entityCounts = {
      divisions: divisionsResult.count ?? 0,
      locations: locationsResult.count ?? 0,
      categories: categoriesResult.count ?? 0,
      users: usersResult.count ?? 0,
    };
  }

  return (
    <AuthProvider initialProfile={profile}>
      <div className="flex h-screen">
        <Sidebar companyName={companyName} entityCounts={entityCounts} />
        <main className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-950">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
