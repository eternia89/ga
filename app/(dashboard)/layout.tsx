import { redirect } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { createClient } from '@/lib/supabase/server';
import { AuthProvider } from '@/lib/auth/hooks';
import { Sidebar } from '@/components/sidebar';
import { MobileMenu } from '@/components/mobile-menu';
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
          {/* Desktop sidebar — hidden on mobile */}
          <div className="max-md:hidden">
            <Sidebar companyName={companyName} />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Top header bar */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-white flex-shrink-0 max-md:px-4">
              {/* Mobile hamburger + company name — hidden on desktop */}
              <div className="hidden max-md:flex items-center gap-3">
                <MobileMenu companyName={companyName} />
                <span className="text-sm font-semibold truncate">{companyName}</span>
              </div>
              {/* Spacer on desktop (pushes bell to right) */}
              <div className="max-md:hidden" />
              <NotificationBell />
            </header>

            {/* Scrollable content area */}
            <main className="flex-1 overflow-auto p-6 max-md:p-4 bg-white">
              {children}
            </main>
          </div>
        </div>
      </AuthProvider>
    </NuqsAdapter>
  );
}
