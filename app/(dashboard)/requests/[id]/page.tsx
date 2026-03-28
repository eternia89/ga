import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { RequestDetailClient } from '@/components/requests/request-detail-client';
import type { TimelineEvent } from '@/components/requests/request-timeline';
import { RequestWithRelations } from '@/lib/types/database';
import { DisplayId } from '@/components/display-id';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, division_id, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch request with all joins
  const { data: request } = await supabase
    .from('requests')
    .select(
      '*, location:locations(name), category:categories(name), requester:user_profiles!requester_id(name:full_name, email), assigned_user:user_profiles!assigned_to(name:full_name, email), division:divisions(name)'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!request) {
    notFound();
  }

  // Fetch all data in parallel
  const [photosResult, auditLogsResult, categoriesResult, usersResult, locationsResult, linkedJobsResult, companyResult] =
    await Promise.all([
      // Photos: media_attachments for this request (non-deleted)
      supabase
        .from('media_attachments')
        .select('id, file_name, file_path, mime_type, sort_order')
        .eq('entity_type', 'request')
        .eq('entity_id', id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true }),

      // Audit logs for timeline
      supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'requests')
        .eq('record_id', id)
        .order('performed_at', { ascending: true }),

      // Categories for triage inline form
      supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'request')
        .is('deleted_at', null)
        .order('name'),

      // Active users in same company for PIC (use request's company)
      supabase
        .from('user_profiles')
        .select('id, name:full_name')
        .eq('company_id', request.company_id)
        .is('deleted_at', null)
        .order('full_name'),

      // Locations for edit form (use request's company)
      supabase
        .from('locations')
        .select('id, name')
        .eq('company_id', request.company_id)
        .is('deleted_at', null)
        .order('name'),

      // Linked jobs via job_requests join table
      supabase
        .from('job_requests')
        .select('job:jobs(id, display_id, title, status)')
        .eq('request_id', id),

      // Company name for disabled Company field on detail page (use request's company)
      supabase
        .from('companies')
        .select('name')
        .eq('id', request.company_id)
        .single(),
    ]);

  // Generate signed URLs for photos
  const attachments = photosResult.data ?? [];
  let photoUrls: { id: string; url: string; fileName: string }[] = [];

  if (attachments.length > 0) {
    const { data: signedUrls, error: signedUrlError } = await supabase.storage
      .from('request-photos')
      .createSignedUrls(
        attachments.map((a) => a.file_path),
        21600 // 6 hours
      );

    if (signedUrlError) {
      console.error('[RequestDetailPage] Failed to create signed URLs:', signedUrlError.message);
    }

    photoUrls = attachments.map((attachment, index) => ({
      id: attachment.id,
      url: signedUrls?.[index]?.signedUrl ?? '',
      fileName: attachment.file_name,
    })).filter((p) => p.url !== '');
  }

  // Process audit logs into timeline events
  const auditLogs = auditLogsResult.data ?? [];

  // Batch-fetch user info for all performed_by IDs
  const performedByIds = [...new Set(auditLogs.map((log) => log.user_id).filter(Boolean))];
  let userMap: Record<string, string> = {};

  if (performedByIds.length > 0) {
    const { data: performers } = await supabase
      .from('user_profiles')
      .select('id, name:full_name, email')
      .in('id', performedByIds);

    if (performers) {
      userMap = Object.fromEntries(
        performers.map((p) => [p.id, p.name ?? p.email ?? p.id])
      );
    }
  }

  // Pre-scan audit logs to batch-fetch category names and user names needed during timeline processing.
  // This eliminates N+1 sequential queries inside the loop.
  const triageCategoryIds: string[] = [];
  const triageUserIds: string[] = [];

  for (const log of auditLogs) {
    if (log.operation !== 'UPDATE') continue;
    const changedFields = log.changed_fields as string[] | null;
    const newData = log.new_data as Record<string, unknown> | null;
    if (!changedFields || !newData) continue;

    if (changedFields.includes('category_id') && newData.category_id) {
      triageCategoryIds.push(newData.category_id as string);
    }
    if (changedFields.includes('assigned_to') && newData.assigned_to) {
      const assignedId = newData.assigned_to as string;
      if (!userMap[assignedId]) {
        triageUserIds.push(assignedId);
      }
    }
  }

  // Batch fetch categories and additional users in parallel
  const uniqueCategoryIds = [...new Set(triageCategoryIds)];
  const uniqueTriageUserIds = [...new Set(triageUserIds)];

  const [categoryBatchResult, triageUserBatchResult] = await Promise.all([
    uniqueCategoryIds.length > 0
      ? supabase.from('categories').select('id, name').in('id', uniqueCategoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    uniqueTriageUserIds.length > 0
      ? supabase.from('user_profiles').select('id, name:full_name').in('id', uniqueTriageUserIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryBatchResult.data ?? []) {
    categoryMap[cat.id] = cat.name;
  }
  for (const u of triageUserBatchResult.data ?? []) {
    userMap[u.id] = u.name ?? u.id;
  }

  const timelineEvents: TimelineEvent[] = [];

  // Internal DB fields that should not appear as generic field updates in the timeline.
  // Feedback/acceptance timestamps are transitions handled by specific checks above.
  const INTERNAL_FIELDS = new Set([
    'updated_at', 'created_at', 'deleted_at',
    'feedback_submitted_at', 'feedback_rating',
    'accepted_at', 'auto_accepted',
  ]);

  for (const log of auditLogs) {
    const byUser = userMap[log.user_id] ?? log.user_email ?? 'System';
    const newData = log.new_data as Record<string, unknown> | null;
    const oldData = log.old_data as Record<string, unknown> | null;
    const changedFields = log.changed_fields as string[] | null;

    if (log.operation === 'INSERT') {
      timelineEvents.push({
        type: 'created',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    if (log.operation !== 'UPDATE' || !changedFields) continue;

    // Check for rejection (has rejection_reason in new_data)
    if (
      changedFields.includes('rejection_reason') &&
      newData?.rejection_reason
    ) {
      timelineEvents.push({
        type: 'rejection',
        at: log.performed_at,
        by: byUser,
        details: { reason: newData.rejection_reason as string },
      });
      continue;
    }

    // Check for cancellation (status changed to 'cancelled')
    if (
      changedFields.includes('status') &&
      newData?.status === 'cancelled'
    ) {
      timelineEvents.push({
        type: 'cancellation',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for acceptance (status changed to 'accepted' with accepted_at)
    if (
      changedFields.includes('status') &&
      newData?.status === 'accepted' &&
      changedFields.includes('accepted_at')
    ) {
      // Check if auto_accepted flag is set
      if (newData?.auto_accepted === true) {
        timelineEvents.push({
          type: 'auto_acceptance',
          at: log.performed_at,
          by: 'System',
        });
      } else {
        timelineEvents.push({
          type: 'acceptance',
          at: log.performed_at,
          by: byUser,
        });
      }
      continue;
    }

    // Check for acceptance rejection (has acceptance_rejected_reason in new_data)
    if (
      changedFields.includes('acceptance_rejected_reason') &&
      newData?.acceptance_rejected_reason
    ) {
      timelineEvents.push({
        type: 'acceptance_rejection',
        at: log.performed_at,
        by: byUser,
        details: { reason: newData.acceptance_rejected_reason as string },
      });
      continue;
    }

    // Check for feedback submitted (has feedback_rating in new_data)
    if (
      changedFields.includes('feedback_rating') &&
      newData?.feedback_rating != null
    ) {
      timelineEvents.push({
        type: 'feedback',
        at: log.performed_at,
        by: byUser,
        details: {
          rating: newData.feedback_rating as number,
          comment: newData.feedback_comment as string | undefined,
        },
      });
      continue;
    }

    // Check for triage (category_id, priority, or assigned_to changed)
    const triageFields = ['category_id', 'priority', 'assigned_to'];
    const isTriageEvent = triageFields.some((f) => changedFields.includes(f));
    if (isTriageEvent) {
      // Resolve category and user names from pre-fetched lookup maps
      let categoryName: string | undefined;
      let priorityLabel: string | undefined;
      let picName: string | undefined;

      if (changedFields.includes('category_id') && newData?.category_id) {
        categoryName = categoryMap[newData.category_id as string];
      }

      if (changedFields.includes('priority') && newData?.priority) {
        priorityLabel = newData.priority as string;
      }

      if (changedFields.includes('assigned_to') && newData?.assigned_to) {
        picName = userMap[newData.assigned_to as string];
      }

      timelineEvents.push({
        type: 'triage',
        at: log.performed_at,
        by: byUser,
        details: {
          category: categoryName,
          priority: priorityLabel,
          pic: picName,
        },
      });
      continue;
    }

    // Check for status change (non-cancel, non-rejection)
    if (changedFields.includes('status')) {
      timelineEvents.push({
        type: 'status_change',
        at: log.performed_at,
        by: byUser,
        details: {
          old_status: oldData?.status,
          new_status: newData?.status,
        },
      });
      continue;
    }

    // Generic field update — skip internal DB fields
    const meaningfulFields = changedFields.filter((f) => !INTERNAL_FIELDS.has(f));
    if (meaningfulFields.length === 0) continue;
    const updatedField = meaningfulFields[0];
    timelineEvents.push({
      type: 'field_update',
      at: log.performed_at,
      by: byUser,
      details: {
        field: updatedField,
        old_value: oldData?.[updatedField] as string | undefined,
        new_value: newData?.[updatedField] as string | undefined,
      },
    });
  }

  const req = request as RequestWithRelations;
  const categories = categoriesResult.data ?? [];
  const users = usersResult.data ?? [];
  const locations = locationsResult.data ?? [];
  const companyName = companyResult.data?.name ?? '';

  // Extract linked jobs from join table result
  // Supabase returns FK relations as arrays when using select('job:jobs(...)')
  type LinkedJobItem = { id: string; display_id: string; title: string; status: string };
  type LinkedJobRow = { job: LinkedJobItem | LinkedJobItem[] | null };
  const linkedJobs = (linkedJobsResult.data ?? [])
    .map((row) => {
      const job = (row as unknown as LinkedJobRow).job;
      if (!job) return null;
      // Supabase may return the relation as an array (many) or object (one)
      return Array.isArray(job) ? job[0] ?? null : job;
    })
    .filter((job): job is LinkedJobItem => job !== null);

  return (
    <div className="space-y-6 py-6 pb-20">
      <SetBreadcrumbs items={[{ label: 'Requests', href: '/requests' }, { label: req.display_id }]} />

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <DisplayId>{req.display_id}</DisplayId>
          </h1>
          <RequestStatusBadge status={req.status} />
          {req.priority && <PriorityBadge priority={req.priority} />}
        </div>

        {/* Requester info */}
        <p className="text-sm text-muted-foreground">
          {req.requester?.name ?? 'Unknown'}
          {req.division?.name && ` · ${req.division.name}`}
          {' · '}Created {formatDate(req.created_at)}
        </p>

        {/* Rejection reason callout */}
        {req.status === 'rejected' && req.rejection_reason && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 mt-2">
            <p className="text-sm font-medium text-red-700">
              Rejection Reason
            </p>
            <p className="text-sm text-red-600 mt-1">
              {req.rejection_reason}
            </p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <RequestDetailClient
        request={req}
        photoUrls={photoUrls}
        timelineEvents={timelineEvents}
        categories={categories}
        users={users}
        locations={locations}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        linkedJobs={linkedJobs}
        companyName={companyName}
      />
    </div>
  );
}
