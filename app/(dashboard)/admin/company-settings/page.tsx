import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { CompanySettingsForm } from '@/components/admin/company-settings/company-settings-form';
import { ROLES } from '@/lib/constants/roles';

export default async function CompanySettingsPage() {
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
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Admin only
  if (profile.role !== ROLES.ADMIN) {
    redirect('/admin');
  }

  // Fetch all company settings
  const { data: settingsRows } = await supabase
    .from('company_settings')
    .select('key, value')
    .eq('company_id', profile.company_id);

  // Build settings map
  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    settings[row.key] = row.value;
  }

  // Extract budget threshold (default to 0 if not set)
  const budgetThreshold = parseInt(settings['budget_threshold'] ?? '0', 10);

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Company Settings' }]} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure company-wide operational settings
        </p>
      </div>

      <CompanySettingsForm budgetThreshold={budgetThreshold} />
    </div>
  );
}
