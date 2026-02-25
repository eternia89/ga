import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AssetSubmitForm } from '@/components/assets/asset-submit-form';

export default async function NewAssetPage() {
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
    .select('company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Only ga_staff, ga_lead, and admin can create assets
  if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
    redirect('/inventory');
  }

  // Fetch asset-type categories only
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'asset')
    .is('deleted_at', null)
    .order('name');

  // Fetch active locations for this company
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('name');

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/inventory" className="hover:text-foreground transition-colors">
          Inventory
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">New Asset</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Asset</h1>
        <p className="text-muted-foreground mt-1">
          Register a new asset with condition photos and optional invoice attachments
        </p>
      </div>

      <AssetSubmitForm
        categories={categories ?? []}
        locations={locations ?? []}
      />
    </div>
  );
}
