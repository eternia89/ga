import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ReactNode } from 'react';
import { ROLES } from '@/lib/constants/roles';

export default async function AdminLayout({ children }: { children: ReactNode }) {
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

  // Check if user is admin
  if (profile.role !== ROLES.ADMIN) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
