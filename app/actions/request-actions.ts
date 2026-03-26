'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { requestSubmitSchema, requestEditSchema, triageSchema, rejectSchema } from '@/lib/validations/request-schema';
import { LEAD_ROLES, ROLES } from '@/lib/constants/roles';
import { REQUEST_LINKABLE_STATUSES, REQUEST_TRIAGEABLE_STATUSES } from '@/lib/constants/request-status';
import { feedbackSchema } from '@/lib/validations/job-schema';
import { z } from 'zod';
import { safeCreateNotifications } from '@/lib/notifications/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertCompanyAccess } from '@/lib/auth/company-access';
import { assertNotStale } from '@/lib/utils/optimistic-lock';
import type { ActionOk, ActionResponse } from '@/lib/types/action-responses';

// ============================================================================
// createRequest — any authenticated user, auto-fills division from profile
// ============================================================================
export const createRequest = authActionClient
  .schema(requestSubmitSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionResponse<{ requestId: string; displayId: string }>> => {
    const { supabase, profile } = ctx;

    // Guard: user must have a division assigned
    if (!profile.division_id) {
      throw new Error('Your account has no division assigned. Contact your administrator.');
    }

    // Determine effective company_id (multi-company access support)
    const effectiveCompanyId = parsedInput.company_id ?? profile.company_id;

    // Validate extra company access if a different company was selected
    if (parsedInput.company_id) {
      await assertCompanyAccess(supabase, profile.id, parsedInput.company_id, profile.company_id);
    }

    // Generate display_id atomically via DB function
    const { data: displayId, error: rpcError } = await supabase
      .rpc('generate_request_display_id', { p_company_id: effectiveCompanyId });

    if (rpcError || !displayId) {
      const msg = rpcError?.message || '';
      if (msg.includes('Company code')) {
        throw new Error('Company code must be set (exactly 2 characters) before creating requests. Update it in Admin > Companies.');
      }
      throw new Error('Failed to generate request ID. Please try again.');
    }

    // Auto-generate title from first 100 chars of description (normalized whitespace)
    const title = parsedInput.description.replace(/\s+/g, ' ').trim().slice(0, 100);

    const { data, error } = await supabase
      .from('requests')
      .insert({
        company_id: effectiveCompanyId,
        division_id: profile.division_id,
        location_id: parsedInput.location_id,
        requester_id: profile.id,
        display_id: displayId,
        title,
        description: parsedInput.description,
        status: 'submitted',
      })
      .select('id, display_id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true, requestId: data.id, displayId: data.display_id };
  });

// ============================================================================
// updateRequest — requester only, while status = 'submitted'
// ============================================================================
export const updateRequest = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: requestEditSchema, updated_at: z.string().max(50).optional() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Fetch the request — must be owned by requester and in submitted status
    const { data: existing } = await supabase
      .from('requests')
      .select('id, status, requester_id, updated_at')
      .eq('id', parsedInput.id)
      .eq('requester_id', profile.id)
      .eq('status', 'submitted')
      .single();

    if (!existing) {
      throw new Error('Cannot edit — request is not in New status or you are not the requester');
    }

    // Optimistic locking: reject if entity was modified since the form loaded
    assertNotStale(parsedInput.updated_at, existing.updated_at);

    // Regenerate title from updated description
    const title = parsedInput.data.description.replace(/\s+/g, ' ').trim().slice(0, 100);

    const { error } = await supabase
      .from('requests')
      .update({
        description: parsedInput.data.description,
        location_id: parsedInput.data.location_id,
        title,
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// triageRequest — ga_lead or admin only, request must be in 'submitted' status
// ============================================================================
export const triageRequest = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: triageSchema }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    const isGaLeadOrAdmin = (LEAD_ROLES as readonly string[]).includes(profile.role);
    const isGaStaff = profile.role === ROLES.GA_STAFF;

    if (!isGaLeadOrAdmin && !isGaStaff) {
      throw new Error('Triage access required');
    }

    // Verify request is in submitted or triaged status — also fetch requester_id and display_id
    const { data: request } = await supabase
      .from('requests')
      .select('id, status, requester_id, display_id, company_id')
      .eq('id', parsedInput.id)
      .single();

    if (!request || !(REQUEST_TRIAGEABLE_STATUSES as readonly string[]).includes(request.status)) {
      throw new Error('Request can only be triaged when in New or Triaged status');
    }

    // GA Staff can only triage new (submitted) requests — not already-triaged ones
    if (isGaStaff && request.status !== 'submitted') {
      throw new Error('GA Staff can only triage new requests.');
    }

    // GA Staff can only assign to themselves
    if (isGaStaff && parsedInput.data.assigned_to !== profile.id) {
      throw new Error('GA Staff can only assign requests to themselves.');
    }

    const updateData: Record<string, string> = {
      category_id: parsedInput.data.category_id,
      priority: parsedInput.data.priority,
      assigned_to: parsedInput.data.assigned_to,
    };

    // Only transition status if currently submitted
    if (request.status === 'submitted') {
      updateData.status = 'triaged';
    }

    const { error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // Fetch PIC name for notification body
    const { data: assignedUser } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', parsedInput.data.assigned_to)
      .single();

    const picName = assignedUser?.full_name ?? 'the assigned staff';

    // Non-blocking notification: notify requester and PIC (actor excluded automatically)
    safeCreateNotifications({
      companyId: request.company_id,
      recipientIds: [request.requester_id, parsedInput.data.assigned_to],
      actorId: profile.id,
      title: `Request ${request.display_id} triaged`,
      body: `Priority: ${parsedInput.data.priority}, assigned to ${picName}`,
      type: 'status_change',
      entityType: 'request',
      entityId: request.id,
    });

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// cancelRequest — requester only, while status = 'submitted'
// ============================================================================
export const cancelRequest = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data, error } = await supabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', parsedInput.id)
      .eq('requester_id', profile.id)
      .eq('status', 'submitted')
      .select('id, display_id, company_id');

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('Cannot cancel — request is not in New status or you are not the requester');
    }

    const cancelledRequest = data[0];

    // Non-blocking notification: notify GA Lead and Admin users in the same company
    const { data: gaUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .in('role', [...LEAD_ROLES])
      .eq('company_id', profile.company_id)
      .is('deleted_at', null);

    if (gaUsers && gaUsers.length > 0) {
      safeCreateNotifications({
        companyId: cancelledRequest.company_id,
        recipientIds: gaUsers.map((u) => u.id),
        actorId: profile.id,
        title: `Request ${cancelledRequest.display_id} cancelled`,
        body: `Cancelled by the requester`,
        type: 'status_change',
        entityType: 'request',
        entityId: cancelledRequest.id,
      });
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// rejectRequest — ga_lead or admin only, from 'submitted' or 'triaged'
// ============================================================================
export const rejectRequest = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: rejectSchema }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('Triage access required');
    }

    // Verify request is in a rejectable status — also fetch requester_id, display_id, company_id
    const { data: request } = await supabase
      .from('requests')
      .select('id, status, requester_id, display_id, company_id')
      .eq('id', parsedInput.id)
      .single();

    if (!request || !(REQUEST_TRIAGEABLE_STATUSES as readonly string[]).includes(request.status)) {
      throw new Error('Request can only be rejected when in New or Triaged status');
    }

    const { error } = await supabase
      .from('requests')
      .update({
        status: 'rejected',
        rejection_reason: parsedInput.data.reason,
        rejected_at: new Date().toISOString(),
        rejected_by: profile.id,
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // Non-blocking notification: notify the requester
    const truncatedReason = parsedInput.data.reason.substring(0, 100);
    safeCreateNotifications({
      companyId: request.company_id,
      recipientIds: [request.requester_id],
      actorId: profile.id,
      title: `Request ${request.display_id} rejected`,
      body: truncatedReason,
      type: 'status_change',
      entityType: 'request',
      entityId: request.id,
    });

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// completeRequest — PIC or GA Lead/Admin, from triaged or in_progress
// Moves request to pending_acceptance so requester can accept/reject
// ============================================================================
export const completeRequest = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Fetch request
    const { data: request } = await supabase
      .from('requests')
      .select('id, status, assigned_to, requester_id, display_id, company_id')
      .eq('id', parsedInput.id)
      .single();

    if (!request) {
      throw new Error('Request not found');
    }

    // Permission check: must be PIC or GA Lead/Admin
    const isPic = request.assigned_to === profile.id;
    const isGaLeadOrAdmin = (LEAD_ROLES as readonly string[]).includes(profile.role);

    if (!isPic && !isGaLeadOrAdmin) {
      throw new Error('Only the assigned PIC or GA Lead can complete this request.');
    }

    // Status check: must be triaged or in_progress
    if (!(REQUEST_LINKABLE_STATUSES as readonly string[]).includes(request.status)) {
      throw new Error('Request can only be completed when in Triaged or In Progress status');
    }

    // Update request to pending_acceptance
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('requests')
      .update({
        status: 'pending_acceptance',
        completed_at: now,
        updated_at: now,
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // Non-blocking notification to requester
    safeCreateNotifications({
      companyId: request.company_id,
      recipientIds: [request.requester_id],
      actorId: profile.id,
      title: `Request ${request.display_id} completed`,
      body: `Your request has been completed. Please accept or reject the work.`,
      type: 'completion',
      entityType: 'request',
      entityId: request.id,
    });

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// deleteMediaAttachment — requester only, while request status = 'submitted'
// ============================================================================
export const deleteMediaAttachment = authActionClient
  .schema(z.object({ attachmentId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Fetch the attachment
    const { data: attachment } = await supabase
      .from('media_attachments')
      .select('id, entity_id, entity_type')
      .eq('id', parsedInput.attachmentId)
      .is('deleted_at', null)
      .single();

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Verify entity_type is 'request'
    if (attachment.entity_type !== 'request') {
      throw new Error('Attachment not found');
    }

    // Verify user owns the parent request and it's in submitted status
    const { data: request } = await supabase
      .from('requests')
      .select('id, company_id, status, requester_id')
      .eq('id', attachment.entity_id)
      .eq('requester_id', profile.id)
      .eq('status', 'submitted')
      .single();

    if (!request) {
      throw new Error('Cannot delete — request is not in New status or you are not the requester');
    }

    // Soft-delete the attachment via admin client to bypass RLS WITH CHECK
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('media_attachments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsedInput.attachmentId)
      .eq('company_id', request.company_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// acceptRequest — requester or admin only, request must be pending_acceptance
// ============================================================================
export const acceptRequest = authActionClient
  .schema(z.object({ request_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data: request } = await supabase
      .from('requests')
      .select('id, status, requester_id')
      .eq('id', parsedInput.request_id)
      .single();

    if (!request || request.status !== 'pending_acceptance') {
      throw new Error('Request is not in Pending Acceptance status');
    }

    const isRequester = request.requester_id === profile.id;

    if (!isRequester) {
      throw new Error('Only the requester can accept this request');
    }

    const { error } = await supabase
      .from('requests')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.request_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    revalidatePath(`/requests/${parsedInput.request_id}`);
    return { success: true };
  });

// ============================================================================
// rejectCompletedWork — requester or admin only, request must be pending_acceptance
// Reverts linked jobs to in_progress so PIC can rework
// ============================================================================
export const rejectCompletedWork = authActionClient
  .schema(z.object({ request_id: z.string().uuid(), reason: z.string().min(1).max(1000) }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data: request } = await supabase
      .from('requests')
      .select('id, status, requester_id')
      .eq('id', parsedInput.request_id)
      .single();

    if (!request || request.status !== 'pending_acceptance') {
      throw new Error('Request is not in Pending Acceptance status');
    }

    const isRequester = request.requester_id === profile.id;

    if (!isRequester) {
      throw new Error('Only the requester can reject this work');
    }

    // Update request: revert to in_progress with rejection reason
    const { error: requestError } = await supabase
      .from('requests')
      .update({
        status: 'in_progress',
        acceptance_rejected_reason: parsedInput.reason,
      })
      .eq('id', parsedInput.request_id);

    if (requestError) {
      throw new Error(requestError.message);
    }

    // Revert linked jobs back to in_progress and clear completed_at
    const { data: jobLinks } = await supabase
      .from('job_requests')
      .select('job_id')
      .eq('request_id', parsedInput.request_id);

    if (jobLinks && jobLinks.length > 0) {
      const jobIds = jobLinks.map((jl) => jl.job_id);
      const { error: revertJobError } = await supabase
        .from('jobs')
        .update({
          status: 'in_progress',
          completed_at: null,
        })
        .in('id', jobIds)
        .eq('status', 'completed');

      if (revertJobError) {
        console.error('[rejectWork] Failed to revert linked jobs, rolling back request status:', revertJobError.message);
        // Rollback request status to pending_acceptance
        await supabase
          .from('requests')
          .update({ status: 'pending_acceptance', acceptance_rejected_reason: null })
          .eq('id', parsedInput.request_id);
        throw new Error('Failed to revert linked jobs. Please try again.');
      }
    }

    revalidatePath('/requests');
    revalidatePath(`/requests/${parsedInput.request_id}`);
    return { success: true };
  });

// ============================================================================
// submitFeedback — requester only, request must be in accepted status
// Sets feedback_rating and feedback_comment, transitions to closed
// ============================================================================
export const submitFeedback = authActionClient
  .schema(feedbackSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data: request } = await supabase
      .from('requests')
      .select('id, status, requester_id')
      .eq('id', parsedInput.request_id)
      .single();

    if (!request || request.status !== 'accepted') {
      throw new Error('Request must be in Accepted status to submit feedback');
    }

    if (request.requester_id !== profile.id) {
      throw new Error('Only the requester can submit feedback');
    }

    const { error } = await supabase
      .from('requests')
      .update({
        feedback_rating: parsedInput.rating,
        feedback_comment: parsedInput.comment ?? null,
        status: 'closed',
      })
      .eq('id', parsedInput.request_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/requests');
    revalidatePath(`/requests/${parsedInput.request_id}`);
    return { success: true };
  });

// ============================================================================
// getRequestPhotos — fetch signed URLs for request photos (6 hour expiry)
// ============================================================================
export const getRequestPhotos = authActionClient
  .schema(z.object({ requestId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionResponse<{ photos: Array<{ id: string; fileName: string; url: string; mimeType: string | null }> }>> => {
    const { supabase } = ctx;

    const { data: attachments } = await supabase
      .from('media_attachments')
      .select('id, file_name, file_path, mime_type')
      .eq('entity_type', 'request')
      .eq('entity_id', parsedInput.requestId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (!attachments || attachments.length === 0) {
      return { success: true, photos: [] };
    }

    // Generate signed URLs with 6-hour expiry
    const { data: signedUrls, error: signedUrlError } = await supabase.storage
      .from('request-photos')
      .createSignedUrls(
        attachments.map((a) => a.file_path),
        21600
      );

    if (signedUrlError) {
      console.error('[getRequestPhotos] Failed to create signed URLs:', signedUrlError.message);
    }

    const photos = attachments
      .map((attachment, index) => ({
        id: attachment.id,
        fileName: attachment.file_name,
        url: signedUrls?.[index]?.signedUrl ?? '',
        mimeType: attachment.mime_type,
      }))
      .filter((p) => p.url !== '');

    return { success: true, photos };
  });
