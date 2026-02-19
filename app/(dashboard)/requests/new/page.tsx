import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RequestSubmitForm } from '@/components/requests/request-submit-form';

export default async function NewRequestPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the user's profile to get company_id for location filtering
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch active locations for this company
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Request</h1>
        <p className="text-muted-foreground mt-1">Submit a maintenance request</p>
      </div>

      <RequestSubmitForm locations={locations || []} />
    </div>
  );
}
