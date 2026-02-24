import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { CompanySettingsForm } from '@/components/admin/company-settings/company-settings-form';

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
  if (profile.role !== 'admin') {
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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Company Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
