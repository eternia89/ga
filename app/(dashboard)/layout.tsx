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

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If no profile or profile is deleted, redirect to login
  if (profileError || !profile || profile.deleted_at) {
    redirect('/login?error=deactivated');
  }

  // Fetch company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single();

  const companyName = company?.name || 'Company';

  return (
    <AuthProvider initialProfile={profile}>
      <div className="flex h-screen">
        <Sidebar companyName={companyName} />
        <main className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-950">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
