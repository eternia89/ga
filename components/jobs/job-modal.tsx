'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { JobWithRelations, JobComment } from '@/lib/types/database';
import type { JobTimelineEvent } from './job-timeline';
import { JobForm, EligibleRequest } from './job-form';
import { JobTimeline } from './job-timeline';
import { JobCommentForm } from './job-comment-form';
import { PMChecklist } from '@/components/maintenance/pm-checklist';
import { JobStatusBadge } from './job-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { useGeolocation, useGeolocationPermission } from '@/hooks/use-geolocation';
import {
  updateJobStatus,
  cancelJob,
  assignJob,
  deleteJobAttachment,
} from '@/app/actions/job-actions';
import { PhotoUpload, ExistingPhoto } from '@/components/media/photo-upload';
import {
  approveJob,
  rejectJob,
  approveCompletion,
  rejectCompletion,
} from '@/app/actions/approval-actions';
import { DisplayId } from '@/components/display-id';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { InlineFeedback } from '@/components/inline-feedback';
import { Combobox } from '@/components/combobox';
import { PM_BADGE_CLASS } from '@/lib/constants/approval-status';
import { LEAD_ROLES, ROLES } from '@/lib/constants/roles';
import { JOB_TERMINAL_STATUSES, JOB_ACTIVE_STATUSES } from '@/lib/constants/job-status';
import { REQUEST_LINKABLE_STATUSES } from '@/lib/constants/request-status';
import {
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Ban,
  ThumbsUp,
  ThumbsDown,
  MapPin,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
  commentId: string;
}

interface JobModalProps {
  mode: 'create' | 'view';
  // Create mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // View mode props
  jobId?: string | null;
  currentUserId?: string;
  currentUserRole?: string;
  onActionSuccess?: () => void;
  jobIds?: string[];
  onNavigate?: (jobId: string) => void;
  // Create mode reference data (view mode fetches its own)
  locations?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  users?: { id: string; full_name: string }[];
  eligibleRequests?: EligibleRequest[];
  requestJobLinks?: Record<string, string>;
  companyBudgetThreshold?: number | null;
  // Multi-company access support
  extraCompanies?: { id: string; name: string }[];
  allLocations?: { id: string; name: string; company_id: string }[];
  primaryCompanyName?: string;
}

// ============================================================================
// Internal fields to filter from timeline
// ============================================================================

const INTERNAL_FIELDS = new Set([
  'updated_at', 'created_at', 'deleted_at',
  'approved_at', 'approval_rejected_at',
  'completion_approved_at', 'completion_rejected_at',
  'completion_submitted_at', 'feedback_submitted_at',
]);

// ============================================================================
// Component
// ============================================================================

export function JobModal({
  mode,
  open,
  onOpenChange,
  jobId,
  currentUserId = '',
  currentUserRole = '',
  onActionSuccess,
  jobIds = [],
  onNavigate,
  locations: createLocations,
  categories: createCategories,
  users: createUsers,
  eligibleRequests: createEligibleRequests,
  requestJobLinks: createRequestJobLinks,
  companyBudgetThreshold,
  extraCompanies,
  allLocations: createAllLocations,
  primaryCompanyName,
}: JobModalProps) {
  const router = useRouter();

  // ========================================================================
  // View mode state
  // ========================================================================

  const [job, setJob] = useState<JobWithRelations | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<JobTimelineEvent[]>([]);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [commentPhotos, setCommentPhotos] = useState<PhotoItem[]>([]);
  const [jobPhotoUrls, setJobPhotoUrls] = useState<ExistingPhoto[]>([]);
  const [viewCategories, setViewCategories] = useState<{ id: string; name: string }[]>([]);
  const [viewLocations, setViewLocations] = useState<{ id: string; name: string }[]>([]);
  const [viewUsers, setViewUsers] = useState<{ id: string; name: string }[]>([]);
  const [viewEligibleRequests, setViewEligibleRequests] = useState<EligibleRequest[]>([]);
  const [viewRequestJobLinks, setViewRequestJobLinks] = useState<Record<string, string>>({});
  const [viewLinkedRequestDetails, setViewLinkedRequestDetails] = useState<{
    id: string; display_id: string; title: string; status: string;
    description: string | null; priority: string | null; created_at: string;
    location?: { name: string } | null; category?: { name: string } | null;
    requester?: { full_name: string } | null; assigned_user?: { full_name: string } | null;
  }[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sub-dialog states
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectCompletionOpen, setRejectCompletionOpen] = useState(false);

  // Form states
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCompletionReason, setRejectCompletionReason] = useState('');
  const [assignPicValue, setAssignPicValue] = useState('');

  // Action states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // GPS hook
  const { capturing: capturingGps, capturePosition } = useGeolocation();
  const { permissionState } = useGeolocationPermission();
  const locationActivated = permissionState === 'granted';

  // Timeline scroll ref
  const timelineRef = useRef<HTMLDivElement>(null);

  // ========================================================================
  // Navigation (view mode)
  // ========================================================================

  const currentIndex = jobId ? jobIds.indexOf(jobId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < jobIds.length - 1;

  const goToPrev = () => {
    if (hasPrev) onNavigate?.(jobIds[currentIndex - 1]);
  };

  const goToNext = () => {
    if (hasNext) onNavigate?.(jobIds[currentIndex + 1]);
  };

  // ========================================================================
  // URL sync (view mode)
  // ========================================================================

  useEffect(() => {
    if (mode !== 'view') return;
    if (jobId) {
      window.history.replaceState(null, '', '?view=' + jobId);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [jobId, mode]);

  // ========================================================================
  // Data fetching (view mode)
  // ========================================================================

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch job with full relations
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(
          `*,
          location:locations(name),
          category:categories(name),
          pic:user_profiles!assigned_to(full_name),
          created_by_user:user_profiles!created_by(full_name),
          maintenance_schedule:maintenance_schedules(id, next_due_at, interval_type, interval_days),
          job_requests(request:requests(id, display_id, title, status))`
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (jobError || !jobData) {
        setError('Job not found');
        setLoading(false);
        return;
      }

      const fetchedJob = jobData as unknown as JobWithRelations;
      setJob(fetchedJob);

      // Parallel fetches using company_id from the fetched job
      const companyId = fetchedJob.company_id;

      const [
        auditLogsResult,
        commentsResult,
        statusChangesResult,
        categoriesResult,
        locationsResult,
        usersResult,
        eligibleRequestsResult,
      ] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'jobs')
          .eq('record_id', id)
          .order('performed_at', { ascending: true }),
        supabase
          .from('job_comments')
          .select('*, user:user_profiles(full_name)')
          .eq('job_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),
        supabase
          .from('job_status_changes')
          .select('from_status, to_status, latitude, longitude, created_at')
          .eq('job_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('categories')
          .select('id, name')
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('locations')
          .select('id, name')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('user_profiles')
          .select('id, full_name')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('full_name'),
        supabase
          .from('requests')
          .select('id, display_id, title, priority, status, location_id, category_id, description, assigned_to')
          .eq('company_id', companyId)
          .in('status', [...REQUEST_LINKABLE_STATUSES])
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ]);

      const fetchedComments = commentsResult.data ?? [];
      setComments(fetchedComments as unknown as JobComment[]);
      setViewCategories(categoriesResult.data ?? []);
      setViewLocations(locationsResult.data ?? []);
      setViewUsers((usersResult.data ?? []).map((u) => ({ id: u.id, name: u.full_name })));

      const rawEligible = (eligibleRequestsResult.data ?? []) as (EligibleRequest & { assigned_to: string | null })[];

      // Rule 3: Exclude requests already linked to ANY job, BUT include this job's own linked requests
      const { data: allLinkedData } = await supabase
        .from('job_requests')
        .select('request_id');

      const allLinkedIds = new Set((allLinkedData ?? []).map((r) => r.request_id));
      const currentJobRequestIds = new Set(
        (fetchedJob.job_requests ?? []).map((jr: { request: { id: string } }) => jr.request.id)
      );

      const unlinkedRequests = rawEligible.filter(
        (r) => !allLinkedIds.has(r.id) || currentJobRequestIds.has(r.id)
      );

      // Rule 1: Only show requests where current user is PIC
      const picFiltered = unlinkedRequests.filter(
        (r) => r.assigned_to === currentUserId || currentJobRequestIds.has(r.id)
      );

      setViewEligibleRequests(picFiltered as EligibleRequest[]);

      // In edit mode, keep requestJobLinks for current job's linked requests only
      const viewLinks: Record<string, string> = {};
      for (const reqId of currentJobRequestIds) {
        viewLinks[reqId] = fetchedJob.display_id;
      }
      setViewRequestJobLinks(viewLinks);

      // Fetch full details for linked requests (for read-only display)
      const linkedReqIds = (fetchedJob.job_requests ?? []).map((jr: { request: { id: string } }) => jr.request.id);
      if (linkedReqIds.length > 0) {
        const { data: fullRequests } = await supabase
          .from('requests')
          .select('id, display_id, title, status, description, priority, created_at, location:locations(name), category:categories(name), requester:user_profiles!created_by(full_name)')
          .in('id', linkedReqIds);
        setViewLinkedRequestDetails((fullRequests ?? []) as unknown as typeof viewLinkedRequestDetails);
      } else {
        setViewLinkedRequestDetails([]);
      }

      // Build GPS lookup
      type GpsRecord = { latitude: number | null; longitude: number | null; created_at: string };
      const gpsMap: Record<string, GpsRecord> = {};
      for (const sc of statusChangesResult.data ?? []) {
        const key = `${sc.from_status}->${sc.to_status}`;
        if (!gpsMap[key] || sc.created_at > gpsMap[key].created_at) {
          gpsMap[key] = { latitude: sc.latitude, longitude: sc.longitude, created_at: sc.created_at };
        }
      }

      // Fetch comment photos
      const commentIds = fetchedComments.map((c) => c.id);
      let fetchedCommentPhotos: PhotoItem[] = [];

      if (commentIds.length > 0) {
        const { data: mediaAttachments } = await supabase
          .from('media_attachments')
          .select('id, file_name, file_path, entity_id')
          .eq('entity_type', 'job_comment')
          .in('entity_id', commentIds)
          .is('deleted_at', null);

        if (mediaAttachments && mediaAttachments.length > 0) {
          const { data: signedUrls, error: signedUrlError } = await supabase.storage
            .from('job-photos')
            .createSignedUrls(
              mediaAttachments.map((a) => a.file_path),
              21600
            );

          if (signedUrlError) {
            console.error('[JobModal] Failed to create signed URLs for comment photos:', signedUrlError.message);
          }

          fetchedCommentPhotos = mediaAttachments.map((attachment, index) => ({
            id: attachment.id,
            url: signedUrls?.[index]?.signedUrl ?? '',
            fileName: attachment.file_name,
            commentId: attachment.entity_id,
          })).filter((p) => p.url !== '');
        }
      }
      setCommentPhotos(fetchedCommentPhotos);

      // Fetch job-level photos (entity_type='job')
      const { data: jobAttachments } = await supabase
        .from('media_attachments')
        .select('id, file_name, file_path')
        .eq('entity_type', 'job')
        .eq('entity_id', id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      let fetchedJobPhotos: ExistingPhoto[] = [];
      if (jobAttachments && jobAttachments.length > 0) {
        const { data: signedUrls, error: signedUrlError } = await supabase.storage
          .from('job-photos')
          .createSignedUrls(
            jobAttachments.map((a) => a.file_path),
            21600
          );
        if (signedUrlError) {
          console.error('[JobModal] Failed to create signed URLs for job photos:', signedUrlError.message);
        }
        fetchedJobPhotos = jobAttachments.map((attachment, index) => ({
          id: attachment.id,
          url: signedUrls?.[index]?.signedUrl ?? '',
          fileName: attachment.file_name,
        })).filter((p) => p.url !== '');
      }
      setJobPhotoUrls(fetchedJobPhotos);

      // Batch-fetch performer names for audit logs
      const auditLogs = auditLogsResult.data ?? [];
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

      // Process audit logs into timeline events
      const events: JobTimelineEvent[] = [];

      for (const log of auditLogs) {
        const byUser = userMap[log.user_id] ?? log.user_email ?? 'System';
        const newData = log.new_data as Record<string, unknown> | null;
        const oldData = log.old_data as Record<string, unknown> | null;
        const changedFields = log.changed_fields as string[] | null;

        if (log.operation === 'INSERT') {
          events.push({ type: 'created', at: log.performed_at, by: byUser });
          continue;
        }

        if (log.operation !== 'UPDATE' || !changedFields) continue;

        // Check for budget approval rejection
        if (changedFields.includes('approval_rejection_reason') && newData?.approval_rejection_reason) {
          events.push({
            type: 'approval_rejection',
            at: log.performed_at,
            by: byUser,
            details: { reason: newData.approval_rejection_reason as string },
          });
          continue;
        }

        // Check for completion approval rejection
        if (changedFields.includes('completion_rejection_reason') && newData?.completion_rejection_reason) {
          events.push({
            type: 'approval_rejection',
            at: log.performed_at,
            by: byUser,
            details: { reason: `Completion rejected: ${newData.completion_rejection_reason as string}` },
          });
          continue;
        }

        // Check for cancellation
        if (changedFields.includes('status') && newData?.status === 'cancelled') {
          events.push({ type: 'cancellation', at: log.performed_at, by: byUser });
          continue;
        }

        // Check for budget approval
        if (changedFields.includes('approved_at') && newData?.approved_at) {
          events.push({ type: 'approval', at: log.performed_at, by: byUser });
          continue;
        }

        // Check for completion approval
        if (changedFields.includes('completion_approved_at') && newData?.completion_approved_at) {
          events.push({ type: 'approval', at: log.performed_at, by: byUser });
          continue;
        }

        // Check for budget approval submission
        if (changedFields.includes('status') && newData?.status === 'pending_approval') {
          events.push({ type: 'approval_submitted', at: log.performed_at, by: byUser });
          continue;
        }

        // Check for completion approval submission
        if (changedFields.includes('status') && newData?.status === 'pending_completion_approval') {
          events.push({ type: 'approval_submitted', at: log.performed_at, by: byUser });
          continue;
        }

        // Check for assignment
        if (changedFields.includes('assigned_to') && newData?.assigned_to) {
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

          events.push({
            type: 'assignment',
            at: log.performed_at,
            by: byUser,
            details: { new_pic: newPicName, old_pic: oldPicName },
          });
          continue;
        }

        // Check for status change
        if (changedFields.includes('status') && newData?.status) {
          const fromSt = oldData?.status as string | undefined;
          const toSt = newData?.status as string;
          const gpsKey = fromSt ? `${fromSt}->${toSt}` : undefined;
          const gpsData = gpsKey ? gpsMap[gpsKey] : undefined;
          events.push({
            type: 'status_change',
            at: log.performed_at,
            by: byUser,
            details: { old_status: fromSt, new_status: toSt },
            latitude: gpsData?.latitude ?? null,
            longitude: gpsData?.longitude ?? null,
          });
          continue;
        }

        // Generic field update
        const meaningfulFields = changedFields.filter((f) => !INTERNAL_FIELDS.has(f));
        if (meaningfulFields.length === 0) continue;
        const updatedField = meaningfulFields[0];
        events.push({
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

      setTimelineEvents(events);
    } catch {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'view' && jobId) {
      fetchData(jobId);
    } else if (mode === 'view' && !jobId) {
      // Reset state when modal closes
      setJob(null);
      setTimelineEvents([]);
      setComments([]);
      setCommentPhotos([]);
      setJobPhotoUrls([]);
      setViewCategories([]);
      setViewLocations([]);
      setViewUsers([]);
      setViewEligibleRequests([]);
      setViewRequestJobLinks({});
      setViewLinkedRequestDetails([]);
      setError(null);
      setFeedback(null);
    }
  }, [jobId, refreshKey, fetchData, mode]);

  // Scroll timeline to bottom when events load
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timelineEvents, comments]);

  // Action success handler
  const handleActionSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    router.refresh();
    onActionSuccess?.();
  }, [router, onActionSuccess]);

  // ========================================================================
  // Permission checks (view mode)
  // ========================================================================

  const isGaLeadOrAdmin = (LEAD_ROLES as readonly string[]).includes(currentUserRole);
  const isFinanceApproverOnly = currentUserRole === ROLES.FINANCE_APPROVER;
  const isPIC = job?.assigned_to === currentUserId;
  const isCreator = job?.created_by === currentUserId;

  const canEdit = isGaLeadOrAdmin && !(JOB_TERMINAL_STATUSES as readonly string[]).includes(job?.status ?? '');
  const picLocked = !!job && !['created', 'assigned'].includes(job.status);
  const canAssignPIC = isGaLeadOrAdmin && job?.status === 'created';
  const canStartWork = isPIC && job?.status === 'assigned';
  const canApproveReject = isCreator && job?.status === 'pending_approval';
  const canApproveCompletion = isCreator && job?.status === 'pending_completion_approval';
  const canMarkComplete = (isGaLeadOrAdmin || isPIC) && job?.status === 'in_progress';
  const canCancel = isGaLeadOrAdmin && !isFinanceApproverOnly && !(JOB_TERMINAL_STATUSES as readonly string[]).includes(job?.status ?? '');
  const canComment =
    (LEAD_ROLES as readonly string[]).includes(currentUserRole) ||
    job?.assigned_to === currentUserId;

  // ========================================================================
  // Action handlers (view mode)
  // ========================================================================

  const handleActivateLocation = async () => {
    setFeedback(null);
    try {
      await capturePosition();
      setFeedback({ type: 'success', message: 'Location activated. You can now start work.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to get location. Please allow location access.',
      });
    }
  };

  const handleStartWork = async () => {
    setFeedback(null);
    let gps: { latitude: number; longitude: number; accuracy: number } | undefined;
    try {
      gps = await capturePosition();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to get location. Please allow location access.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateJobStatus({
        id: job!.id,
        status: 'in_progress',
        latitude: gps.latitude,
        longitude: gps.longitude,
        gpsAccuracy: gps.accuracy,
      });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Work started.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to start' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await approveJob({ job_id: job!.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Job approved. Work can proceed.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to approve' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await rejectJob({ job_id: job!.id, reason: rejectReason.trim() });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setRejectOpen(false);
      setRejectReason('');
      setFeedback({ type: 'success', message: 'Job rejected.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveCompletion = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await approveCompletion({ job_id: job!.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Completion approved.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to approve completion' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectCompletion = async () => {
    if (!rejectCompletionReason.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await rejectCompletion({ job_id: job!.id, reason: rejectCompletionReason.trim() });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setRejectCompletionOpen(false);
      setRejectCompletionReason('');
      setFeedback({ type: 'success', message: 'Completion rejected.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject completion' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPIC = async () => {
    if (!assignPicValue) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await assignJob({ id: job!.id, assigned_to: assignPicValue });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setAssignPicValue('');
      setFeedback({ type: 'success', message: 'PIC assigned.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to assign PIC' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await cancelJob({ id: job!.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setCancelOpen(false);
      setFeedback({ type: 'success', message: 'Job cancelled.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to cancel' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    setFeedback(null);
    let gps: { latitude: number; longitude: number; accuracy: number } | undefined;
    try {
      gps = await capturePosition();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to get location. Please allow location access.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateJobStatus({
        id: job!.id,
        status: 'completed',
        latitude: gps.latitude,
        longitude: gps.longitude,
        gpsAccuracy: gps.accuracy,
      });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }
      setFeedback({ type: 'success', message: 'Job marked as complete.' });
      handleActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to complete' });
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================================
  // Create mode dialog open state
  // ========================================================================

  const isDialogOpen = mode === 'create' ? !!open : !!jobId;

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (mode === 'create') {
      onOpenChange?.(newOpen);
    } else {
      if (!newOpen) {
        onOpenChange?.(false);
      }
    }
  };

  // ========================================================================
  // Render: Create mode
  // ========================================================================

  if (mode === 'create') {
    return (
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
          <DialogHeader>
            <DialogTitle>New Job</DialogTitle>
          </DialogHeader>
          <JobForm
            locations={createLocations ?? []}
            categories={createCategories ?? []}
            users={createUsers ?? []}
            eligibleRequests={createEligibleRequests ?? []}
            requestJobLinks={createRequestJobLinks ?? {}}
            prefillRequest={null}
            mode="create"
            companyBudgetThreshold={companyBudgetThreshold}
            extraCompanies={extraCompanies}
            allLocations={createAllLocations}
            primaryCompanyName={primaryCompanyName}
            onSuccess={() => {
              handleDialogOpenChange(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // ========================================================================
  // Render: View mode
  // ========================================================================

  // Derive form data from fetched job
  const formUsers = viewUsers.map((u) => ({ id: u.id, full_name: u.name }));

  const initialData = job ? {
    title: job.title,
    description: job.description ?? '',
    location_id: job.location_id,
    category_id: job.category_id,
    priority: job.priority,
    assigned_to: job.assigned_to,
    estimated_cost: job.estimated_cost ?? null,
    linked_request_ids: (job.job_requests ?? []).map((jr) => jr.request.id),
  } : undefined;

  const linkedRequestDetails = viewLinkedRequestDetails;

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className="max-w-[1000px] max-h-[90vh] flex flex-col p-0 gap-0 max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0"
          showCloseButton={true}
        >
          <DialogTitle className="sr-only">Job Details</DialogTitle>
          {/* Loading state */}
          {loading && (
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-[600px_400px] max-lg:grid-cols-1 gap-6 mt-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex gap-2">
                {jobId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(jobId)}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Retry
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {job && !loading && !error && (
            <>
              {/* Header (non-scrollable) */}
              <div className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Prev/Next navigation */}
                  {jobIds.length > 1 && (
                    <div className="flex items-center gap-1 mr-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!hasPrev}
                        onClick={goToPrev}
                        aria-label="Previous job"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!hasNext}
                        onClick={goToNext}
                        aria-label="Next job"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">
                        {currentIndex + 1}/{jobIds.length}
                      </span>
                    </div>
                  )}

                  <h2 className="text-xl font-bold tracking-tight">
                    <DisplayId>{job.display_id}</DisplayId>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <JobStatusBadge status={job.status} />
                  {job.priority && <PriorityBadge priority={job.priority} />}
                  {job.job_type === 'preventive_maintenance' && (
                    <span className={PM_BADGE_CLASS}>
                      PM
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Created {format(new Date(job.created_at), 'dd-MM-yyyy')} by {job.created_by_user?.full_name ?? 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Split layout: Form left, Timeline right */}
              <div className="flex-1 min-h-0 grid grid-cols-[600px_400px] max-lg:grid-cols-1">
                {/* Left: Form (scrollable) */}
                <div className="overflow-y-auto px-6 py-4 max-lg:border-b space-y-4">
                  <JobForm
                    mode="edit"
                    jobId={job.id}
                    initialData={initialData}
                    readOnly={!canEdit}
                    picLocked={picLocked}
                    locations={viewLocations}
                    categories={viewCategories}
                    users={formUsers}
                    eligibleRequests={viewEligibleRequests}
                    requestJobLinks={viewRequestJobLinks}
                    linkedRequestDetails={linkedRequestDetails}
                    onSuccess={handleActionSuccess}
                  />

                  {/* PM Checklist */}
                  {job.job_type === 'preventive_maintenance' && job.checklist_responses && (
                    <PMChecklist
                      jobId={job.id}
                      checklist={job.checklist_responses}
                      jobStatus={job.status}
                      canEdit={
                        ((LEAD_ROLES as readonly string[]).includes(currentUserRole) ||
                          job.assigned_to === currentUserId) &&
                        (JOB_ACTIVE_STATUSES as readonly string[]).includes(job.status)
                      }
                    />
                  )}

                  {/* Job Photos */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Photos</p>
                    <PhotoUpload
                      onChange={async (files) => {
                        for (const file of files) {
                          const fd = new FormData();
                          fd.append('entity_type', 'job');
                          fd.append('entity_id', job.id);
                          fd.append('photo', file);
                          await fetch('/api/uploads/entity-photos', { method: 'POST', body: fd });
                        }
                        handleActionSuccess();
                      }}
                      existingPhotos={jobPhotoUrls}
                      onRemoveExisting={canEdit ? async (attachmentId) => {
                        await deleteJobAttachment({ attachmentId });
                        handleActionSuccess();
                      } : undefined}
                      disabled={!canEdit}
                      maxPhotos={10}
                      showCount
                      enableAnnotation
                      enableMobileCapture={false}
                    />
                  </div>
                </div>

                {/* Right: Timeline (scrollable) */}
                <div
                  ref={timelineRef}
                  className="overflow-y-auto border-l max-lg:border-l-0 px-6 py-4 flex flex-col"
                >
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    Timeline
                  </h3>
                  <div className="flex-1 min-h-0">
                    <JobTimeline
                      events={timelineEvents}
                      comments={comments}
                      commentPhotos={commentPhotos}
                    />
                  </div>

                  {canComment && (
                    <div className="shrink-0 mt-4 pt-4 border-t">
                      <JobCommentForm
                        jobId={job.id}
                        jobStatus={job.status}
                        onSuccess={handleActionSuccess}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky action bar */}
              <div className="border-t px-6 py-3 shrink-0 bg-background space-y-2">
                {feedback && (
                  <InlineFeedback
                    type={feedback.type}
                    message={feedback.message}
                    onDismiss={() => setFeedback(null)}
                  />
                )}

                <div className="flex items-center justify-between gap-2">
                  {/* Left: Primary actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {canAssignPIC && (
                      <>
                        <div className="w-48">
                          <Combobox
                            options={(viewUsers ?? []).map((u) => ({ label: u.name, value: u.id }))}
                            value={assignPicValue}
                            onValueChange={setAssignPicValue}
                            placeholder="Select PIC..."
                            searchPlaceholder="Search users..."
                            emptyText="No users found."
                            disabled={submitting}
                          />
                        </div>
                        <Button size="sm" onClick={handleAssignPIC} disabled={submitting || !assignPicValue}>
                          Assign
                        </Button>
                      </>
                    )}

                    {canStartWork && !locationActivated && (
                      <Button size="sm" onClick={handleActivateLocation} disabled={submitting || capturingGps}>
                        <MapPin className="mr-2 h-4 w-4" />
                        {capturingGps ? 'Getting location...' : 'Activate Location'}
                      </Button>
                    )}

                    {canStartWork && locationActivated && (
                      <Button size="sm" onClick={handleStartWork} disabled={submitting || capturingGps}>
                        <Play className="mr-2 h-4 w-4" />
                        {capturingGps ? 'Getting location...' : 'Start Work'}
                      </Button>
                    )}

                    {canApproveReject && (
                      <Button size="sm" onClick={handleApprove} disabled={submitting}>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve Budget
                      </Button>
                    )}

                    {canApproveCompletion && (
                      <Button size="sm" onClick={handleApproveCompletion} disabled={submitting}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Completion
                      </Button>
                    )}

                    {canMarkComplete && (
                      <Button size="sm" onClick={handleMarkComplete} disabled={submitting || capturingGps}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {capturingGps ? 'Getting location...' : 'Mark Complete'}
                      </Button>
                    )}
                  </div>

                  {/* Right: Secondary/destructive */}
                  <div className="flex flex-wrap items-center gap-2">
                    {canApproveReject && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setRejectReason(''); setRejectOpen(true); }}
                        disabled={submitting}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Reject Budget</span>
                      </Button>
                    )}

                    {canApproveCompletion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setRejectCompletionReason(''); setRejectCompletionOpen(true); }}
                        disabled={submitting}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Reject Completion</span>
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelOpen(true)}
                        disabled={submitting}
                      >
                        <Ban className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Cancel Job</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs (render outside modal for z-index stacking) */}
      {job && (
        <>
          {/* Reject Budget Dialog */}
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Reject Budget</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provide a reason for rejecting this budget. The job will return to In Progress so the PIC can revise.
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="modal-reject-reason">
                    Rejection Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="modal-reject-reason"
                    placeholder="Explain why this budget is being rejected..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    maxLength={1000}
                    className="min-h-24 resize-y"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {rejectReason.length}/1000
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={submitting || !rejectReason.trim()}
                  >
                    {submitting ? 'Rejecting...' : 'Reject Budget'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reject Completion Dialog */}
          <Dialog open={rejectCompletionOpen} onOpenChange={setRejectCompletionOpen}>
            <DialogContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Reject Completion</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provide a reason for rejecting this completion. The job will return to In Progress for rework.
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="modal-reject-completion-reason">
                    Rejection Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="modal-reject-completion-reason"
                    placeholder="Explain why the completion is being rejected..."
                    value={rejectCompletionReason}
                    onChange={(e) => setRejectCompletionReason(e.target.value)}
                    maxLength={1000}
                    className="min-h-24 resize-y"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {rejectCompletionReason.length}/1000
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectCompletionOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectCompletion}
                    disabled={submitting || !rejectCompletionReason.trim()}
                  >
                    {submitting ? 'Rejecting...' : 'Reject Completion'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cancel Confirmation AlertDialog */}
          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Job?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel job <strong>{job.display_id}</strong> and return all linked requests to
                  &quot;Triaged&quot; status. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submitting}>Keep Job</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={submitting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {submitting ? 'Cancelling...' : 'Cancel Job'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
