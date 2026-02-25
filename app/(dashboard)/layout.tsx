import { redirect } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { createClient } from '@/lib/supabase/server';
import { AuthProvider } from '@/lib/auth/hooks';
import { Sidebar } from '@/components/sidebar';
import { NotificationBell } from '@/components/notifications/notification-bell';
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


  return (
    <NuqsAdapter>
      <AuthProvider initialProfile={profile}>
        <div className="flex h-screen">
          <Sidebar companyName={companyName} />
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top header bar with notification bell */}
            <header className="flex items-center justify-end px-6 py-3 border-b border-border bg-white dark:bg-gray-950 flex-shrink-0">
              <NotificationBell />
            </header>
            {/* Scrollable content area */}
            <main className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-950">
              {children}
            </main>
          </div>
        </div>
      </AuthProvider>
    </NuqsAdapter>
  );
}
