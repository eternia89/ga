import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { format } from 'date-fns';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { JobStatusBadge } from '@/components/jobs/job-status-badge';
import { JobPriorityBadge } from '@/components/jobs/job-priority-badge';
import { JobDetailClient } from '@/components/jobs/job-detail-client';
import { OverdueBadge } from '@/components/maintenance/overdue-badge';
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

  // Fetch all data in parallel
  const [auditLogsResult, commentsResult, usersResult, statusChangesResult] = await Promise.all([
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
  ]);

  const auditLogs = auditLogsResult.data ?? [];
  const comments = commentsResult.data ?? [];
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

    // Check for approval rejection (has approval_rejection_reason in new_data)
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

    // Check for cancellation
    if (changedFields.includes('status') && newData?.status === 'cancelled') {
      timelineEvents.push({
        type: 'cancellation',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for approval (approved_at set)
    if (changedFields.includes('approved_at') && newData?.approved_at) {
      timelineEvents.push({
        type: 'approval',
        at: log.performed_at,
        by: byUser,
      });
      continue;
    }

    // Check for approval submission (status changed to pending_approval)
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

    // Generic field update
    const updatedField = changedFields[0];
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
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/jobs">Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{job.display_id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {job.display_id}
          </h1>
          <JobStatusBadge status={job.status} />
          {job.priority && <JobPriorityBadge priority={job.priority} />}
          {/* PM type badge */}
          {job.job_type === 'preventive_maintenance' && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              PM
            </span>
          )}
          {/* Overdue badge for PM jobs */}
          {job.job_type === 'preventive_maintenance' && job.maintenance_schedule && (
            <OverdueBadge
              nextDueAt={job.maintenance_schedule.next_due_at ?? null}
              jobStatus={job.status}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {job.title}
          {job.created_by_user?.full_name && (
            <span> · Created by {job.created_by_user.full_name}</span>
          )}
          <span> · {format(new Date(job.created_at), 'dd-MM-yyyy')}</span>
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
        approvedByName={approvedByName}
        approvalRejectedByName={approvalRejectedByName}
      />

    </div>
  );
}
