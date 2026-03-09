import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { format } from 'date-fns';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { JobDetailClient } from '@/components/jobs/job-detail-client';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import type { JobTimelineEvent } from '@/components/jobs/job-timeline';
import type { JobWithRelations } from '@/lib/types/database';
import { JOB_STATUS_LABELS } from '@/lib/constants/job-status';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
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
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch job with all relations (including maintenance_schedule for PM jobs)
  const { data: jobData } = await supabase
    .from('jobs')
    .select(
      `
      *,
      location:locations(name),
      category:categories(name),
      pic:user_profiles!assigned_to(full_name),
      created_by_user:user_profiles!created_by(full_name),
      maintenance_schedule:maintenance_schedules(
        id,
        next_due_at,
        interval_type,
        interval_days
      ),
      job_requests(
        request:requests(
          id,
          display_id,
          title,
          description,
          status,
          priority,
          created_at,
          location:locations(name),
          category:categories(name),
          requester:user_profiles!requester_id(full_name),
          assigned_user:user_profiles!assigned_to(full_name)
        )
      )
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!jobData) {
    notFound();
  }

  const job = jobData as JobWithRelations;

  // Role-based access: general_user and ga_staff can only view jobs assigned to them
  if (['general_user', 'ga_staff'].includes(profile.role) && job.assigned_to !== profile.id) {
    notFound();
  }

  // Fetch all data in parallel
  const [auditLogsResult, commentsResult, usersResult, statusChangesResult, categoriesResult, locationsResult, jobPhotosResult] = await Promise.all([
    // Audit logs for timeline
    supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'jobs')
      .eq('record_id', id)
      .order('performed_at', { ascending: true }),

    // Job comments (non-deleted) with user info
    supabase
      .from('job_comments')
      .select('*, user:user_profiles(full_name)')
      .eq('job_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),

    // Active users in same company for action dialogs
    supabase
      .from('user_profiles')
      .select('id, name:full_name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('full_name'),

    // GPS status change records for timeline GPS links (REQ-JOB-010)
    supabase
      .from('job_status_changes')
      .select('from_status, to_status, latitude, longitude, created_at')
      .eq('job_id', id)
      .order('created_at', { ascending: true }),

    // Categories for inline editing
    supabase
      .from('categories')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),

    // Locations for inline editing
    supabase
      .from('locations')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .order('name'),

    // Job photos (entity_type='job')
    supabase
      .from('media_attachments')
      .select('id, file_name, file_path, mime_type, sort_order')
      .eq('entity_type', 'job')
      .eq('entity_id', id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
  ]);

  const auditLogs = auditLogsResult.data ?? [];
  const comments = commentsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const locations = locationsResult.data ?? [];
  // Build GPS lookup: key = "fromStatus->toStatus" (may have duplicates, use most recent per pair)
  type GpsRecord = { latitude: number | null; longitude: number | null; created_at: string };
  const gpsMap: Record<string, GpsRecord> = {};
  for (const sc of statusChangesResult.data ?? []) {
    const key = `${sc.from_status}->${sc.to_status}`;
    // Keep latest if multiple transitions with same from->to exist
    if (!gpsMap[key] || sc.created_at > gpsMap[key].created_at) {
      gpsMap[key] = { latitude: sc.latitude, longitude: sc.longitude, created_at: sc.created_at };
    }
  }
  const users = usersResult.data ?? [];

  // Generate signed URLs for job-level photos
  const jobAttachments = jobPhotosResult.data ?? [];
  let jobPhotoUrls: { id: string; url: string; fileName: string }[] = [];

  if (jobAttachments.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from('job-photos')
      .createSignedUrls(
        jobAttachments.map((a) => a.file_path),
        21600 // 6 hours
      );

    jobPhotoUrls = jobAttachments.map((attachment, index) => ({
      id: attachment.id,
      url: signedUrls?.[index]?.signedUrl ?? '',
      fileName: attachment.file_name,
    }));
  }

  // Fetch comment photos
  const commentIds = comments.map((c) => c.id);
  let commentPhotos: { id: string; url: string; fileName: string; commentId: string }[] = [];

  if (commentIds.length > 0) {
    const { data: mediaAttachments } = await supabase
      .from('media_attachments')
      .select('id, file_name, file_path, entity_id')
      .eq('entity_type', 'job_comment')
      .in('entity_id', commentIds)
      .is('deleted_at', null);

    if (mediaAttachments && mediaAttachments.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('job-photos')
        .createSignedUrls(
          mediaAttachments.map((a) => a.file_path),
          21600 // 6 hours
        );

      commentPhotos = mediaAttachments.map((attachment, index) => ({
        id: attachment.id,
        url: signedUrls?.[index]?.signedUrl ?? '',
        fileName: attachment.file_name,
        commentId: attachment.entity_id,
      }));
    }
  }

  // Batch-fetch performer names for audit logs
  const performedByIds = [
    ...new Set(auditLogs.map((log) => log.user_id).filter(Boolean)),
  ];
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

  // Resolve approved_by and approval_rejected_by names
  let approvedByName: string | null = null;
  let approvalRejectedByName: string | null = null;

  if (job.approved_by) {
    approvedByName = userMap[job.approved_by] ?? null;
    if (!approvedByName) {
      const { data: u } = await supabase
        .from('user_profiles')
        .select('name:full_name')
        .eq('id', job.approved_by)
        .single();
      approvedByName = u?.name ?? null;
    }
  }

  if (job.approval_rejected_by) {
    approvalRejectedByName = userMap[job.approval_rejected_by] ?? null;
    if (!approvalRejectedByName) {
      const { data: u } = await supabase
        .from('user_profiles')
        .select('name:full_name')
        .eq('id', job.approval_rejected_by)
        .single();
      approvalRejectedByName = u?.name ?? null;
    }
  }

  // Process audit logs into timeline events
  const timelineEvents: JobTimelineEvent[] = [];

  // Internal DB fields that should not appear as generic field updates in the timeline.
  // Approval/completion timestamps are already handled by specific checks above.
  const INTERNAL_FIELDS = new Set([
    'updated_at', 'created_at', 'deleted_at',
    'approved_at', 'approval_rejected_at',
    'completion_approved_at', 'completion_rejected_at',
    'completion_submitted_at', 'feedback_submitted_at',
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

    // Check for budget approval rejection (has approval_rejection_reason in new_data)
    if (
      changedFields.includes('approval_rejection_reason') &&
      newData?.approval_rejection_reason
    ) {
      timelineEvents.push({
        type: 'approval_rejection',
        at: log.performed_at,
        by: byUser,
        details: { reason: newData.approval_rejection_reason as string },
      });
      continue;
    }

    // Check for completion approval rejection (has completion_rejection_reason in new_data)
    if (
      changedFields.includes('completion_rejection_reason') &&
      newData?.completion_rejection_reason
    ) {
      timelineEvents.push({
        type: 'approval_rejection',
        at: log.performed_at,
        by: byUser,
        details: { reason: `Completion rejected: ${newData.completion_rejection_reason as string}` },
      });
      continue;
    }

    // Check for cancellation
    if (changedFields.includes('status') && newData?.status === 'cancelled') {
      timelineEvents.push({
        type: 'cancellation',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for budget approval (approved_at set)
    if (changedFields.includes('approved_at') && newData?.approved_at) {
      timelineEvents.push({
        type: 'approval',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for completion approval (completion_approved_at set)
    if (changedFields.includes('completion_approved_at') && newData?.completion_approved_at) {
      timelineEvents.push({
        type: 'approval',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for budget approval submission (status changed to pending_approval)
    if (
      changedFields.includes('status') &&
      newData?.status === 'pending_approval'
    ) {
      timelineEvents.push({
        type: 'approval_submitted',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for completion approval submission (status changed to pending_completion_approval)
    if (
      changedFields.includes('status') &&
      newData?.status === 'pending_completion_approval'
    ) {
      timelineEvents.push({
        type: 'approval_submitted',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for assignment (assigned_to changed)
    if (changedFields.includes('assigned_to') && newData?.assigned_to) {
      // Resolve new PIC name
      const newPicId = newData.assigned_to as string;
      let newPicName = userMap[newPicId] ?? null;
      if (!newPicName) {
        const { data: picUser } = await supabase
          .from('user_profiles')
          .select('name:full_name')
          .eq('id', newPicId)
          .single();
        newPicName = picUser?.name ?? newPicId;
      }

      const oldPicId = oldData?.assigned_to as string | null | undefined;
      let oldPicName: string | null = null;
      if (oldPicId) {
        oldPicName = userMap[oldPicId] ?? null;
        if (!oldPicName) {
          const { data: oldPicUser } = await supabase
            .from('user_profiles')
            .select('name:full_name')
            .eq('id', oldPicId)
            .single();
          oldPicName = oldPicUser?.name ?? oldPicId;
        }
      }

      timelineEvents.push({
        type: 'assignment',
        at: log.performed_at,
        by: byUser,
        details: {
          new_pic: newPicName,
          old_pic: oldPicName,
        },
      });
      continue;
    }

    // Check for status change (non-cancel, non-approval paths)
    if (changedFields.includes('status') && newData?.status) {
      const fromSt = oldData?.status as string | undefined;
      const toSt = newData?.status as string;
      const gpsKey = fromSt ? `${fromSt}->${toSt}` : undefined;
      const gpsData = gpsKey ? gpsMap[gpsKey] : undefined;
      timelineEvents.push({
        type: 'status_change',
        at: log.performed_at,
        by: byUser,
        details: {
          old_status: fromSt,
          new_status: toSt,
        },
        latitude: gpsData?.latitude ?? null,
        longitude: gpsData?.longitude ?? null,
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

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Jobs', href: '/jobs' }, { label: job.display_id }]} />

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {job.display_id}
          </h1>
          <JobStatusBadge status={job.status} />
          {job.priority && <PriorityBadge priority={job.priority} />}
          {job.job_type === 'preventive_maintenance' && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              PM
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {job.created_by_user?.full_name ?? 'Unknown'}
          {' \u00b7 '}Created {format(new Date(job.created_at), 'dd-MM-yyyy')}
        </p>
      </div>

      {/* Two-column layout */}
      <JobDetailClient
        job={job}
        timelineEvents={timelineEvents}
        comments={comments}
        commentPhotos={commentPhotos}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        users={users}
        categories={categories}
        locations={locations}
        photoUrls={jobPhotoUrls}
        approvedByName={approvedByName}
        approvalRejectedByName={approvalRejectedByName}
      />

    </div>
  );
}
