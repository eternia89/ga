import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { RequestTable } from '@/components/requests/request-table';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/export-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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
      '*, location:locations(name), category:categories(name), requester:user_profiles!requester_id(name:full_name, email), assigned_user:user_profiles!assigned_to(name:full_name, email), division:divisions(name)'
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
      .select('id, name:full_name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('full_name'),
  ]);

  const requests = requestsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const users = usersResult.data ?? [];

  // Batch-fetch photos for all requests
  const requestIds = requests.map((r) => r.id);
  let photosByRequest: Record<string, { id: string; url: string; fileName: string }[]> = {};

  if (requestIds.length > 0) {
    const { data: attachments } = await supabase
      .from('media_attachments')
      .select('id, entity_id, file_name, file_path')
      .eq('entity_type', 'request')
      .in('entity_id', requestIds)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (attachments && attachments.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('request-photos')
        .createSignedUrls(
          attachments.map((a) => a.file_path),
          21600
        );

      const photosWithUrls = attachments.map((a, i) => ({
        id: a.id,
        entityId: a.entity_id,
        url: signedUrls?.[i]?.signedUrl ?? '',
        fileName: a.file_name,
      }));

      // Group by request ID
      photosByRequest = {};
      for (const photo of photosWithUrls) {
        if (!photosByRequest[photo.entityId]) {
          photosByRequest[photo.entityId] = [];
        }
        photosByRequest[photo.entityId].push({
          id: photo.id,
          url: photo.url,
          fileName: photo.fileName,
        });
      }
    }
  }

  return (
    <div className="space-y-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Requests</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground mt-1">
            {profile.role === 'general_user'
              ? 'View and manage your submitted requests'
              : 'View and manage all company requests'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ga_lead', 'admin', 'finance_approver'].includes(profile.role) && (
            <ExportButton exportUrl="/api/exports/requests" />
          )}
          <Button asChild size="sm">
            <Link href="/requests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      <RequestTable
        data={requests}
        categories={categories}
        users={users}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        photosByRequest={photosByRequest}
      />
    </div>
  );
}
