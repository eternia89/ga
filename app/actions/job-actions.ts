'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { createJobSchema, updateJobSchema, jobCommentSchema } from '@/lib/validations/job-schema';
import { GA_ROLES, LEAD_ROLES } from '@/lib/constants/roles';
import { z } from 'zod';
import { createNotifications } from '@/lib/notifications/helpers';
import { highestPriority } from '@/lib/jobs/priority';
import { formatIDR } from '@/lib/utils';
import { advanceFloatingScheduleCore } from '@/app/actions/pm-job-actions';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertCompanyAccess } from '@/lib/auth/company-access';
import { assertNotStale } from '@/lib/utils/optimistic-lock';
import type { ActionOk, ActionResponse } from '@/lib/types/action-responses';

// ============================================================================
// createJob — ga_lead, admin, or ga_staff
// ============================================================================
export const createJob = authActionClient
  .schema(createJobSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionResponse<{ jobId: string; displayId: string }>> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(GA_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    // Determine effective company_id (multi-company access support)
    const effectiveCompanyId = parsedInput.company_id ?? profile.company_id;

    // Validate extra company access if a different company was selected
    if (parsedInput.company_id) {
      await assertCompanyAccess(supabase, profile.id, parsedInput.company_id, profile.company_id);
    }

    // Generate display_id atomically via DB function
    const { data: displayId, error: rpcError } = await supabase
      .rpc('generate_job_display_id', { p_company_id: effectiveCompanyId });

    if (rpcError || !displayId) {
      const msg = rpcError?.message || '';
      if (msg.includes('Company code')) {
        throw new Error('Company code must be set (exactly 2 characters) before creating jobs. Update it in Admin > Companies.');
      }
      throw new Error('Failed to generate job ID. Please try again.');
    }

    // ── Validate linked requests (Rules 1-3) ──
    if (parsedInput.linked_request_ids && parsedInput.linked_request_ids.length > 0) {
      // Rule 2: Only triaged/in_progress requests can be linked
      const { data: requestsToLink } = await supabase
        .from('requests')
        .select('id, display_id, status, assigned_to')
        .in('id', parsedInput.linked_request_ids)
        .is('deleted_at', null);

      if (!requestsToLink || requestsToLink.length !== parsedInput.linked_request_ids.length) {
        throw new Error('One or more selected requests were not found.');
      }

      const invalidStatus = requestsToLink.filter((r) => !['triaged', 'in_progress'].includes(r.status));
      if (invalidStatus.length > 0) {
        throw new Error("Cannot link requests with status 'New'. Only triaged or in-progress requests can be linked.");
      }

      // Rule 3: Each request can only be linked to one job
      const { data: existingLinks } = await supabase
        .from('job_requests')
        .select('request_id')
        .in('request_id', parsedInput.linked_request_ids);

      if (existingLinks && existingLinks.length > 0) {
        const alreadyLinkedIds = existingLinks.map((l) => l.request_id);
        const alreadyLinkedRequests = requestsToLink.filter((r) => alreadyLinkedIds.includes(r.id));
        const displayIds = alreadyLinkedRequests.map((r) => r.display_id).join(', ');
        throw new Error(`Request ${displayIds} is already linked to another job.`);
      }

      // Rule 1: Only the PIC assigned to a request can link it
      const notAssigned = requestsToLink.filter((r) => r.assigned_to !== profile.id);
      if (notAssigned.length > 0) {
        throw new Error('You can only link requests assigned to you as PIC.');
      }
    }

    // Auto-compute priority from linked requests if any
    let computedPriority = parsedInput.priority;
    if (parsedInput.linked_request_ids && parsedInput.linked_request_ids.length > 0) {
      const { data: linkedRequests } = await supabase
        .from('requests')
        .select('priority')
        .in('id', parsedInput.linked_request_ids)
        .is('deleted_at', null);

      if (linkedRequests && linkedRequests.length > 0) {
        computedPriority = highestPriority(linkedRequests.map((r) => r.priority)) as typeof parsedInput.priority;
      }
    }

    // Insert job
    const insertData: Record<string, unknown> = {
      company_id: effectiveCompanyId,
      display_id: displayId,
      title: parsedInput.title,
      description: parsedInput.description,
      location_id: parsedInput.location_id,
      category_id: parsedInput.category_id,
      priority: computedPriority,
      created_by: profile.id,
      status: 'created',
    };

    // Set estimated_cost if provided
    if (parsedInput.estimated_cost !== undefined && parsedInput.estimated_cost > 0) {
      insertData.estimated_cost = parsedInput.estimated_cost;
    }

    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert(insertData)
      .select('id, display_id')
      .single();

    if (insertError || !job) {
      throw new Error(insertError?.message ?? 'Failed to create job');
    }

    // If estimated_cost >= budget_threshold, transition to pending_approval
    if (parsedInput.estimated_cost !== undefined && parsedInput.estimated_cost > 0) {
      const { data: thresholdSetting } = await supabase
        .from('company_settings')
        .select('value')
        .eq('company_id', effectiveCompanyId)
        .eq('key', 'budget_threshold')
        .single();

      const budgetThreshold = thresholdSetting ? parseInt(thresholdSetting.value, 10) : null;

      if (budgetThreshold !== null && parsedInput.estimated_cost >= budgetThreshold) {
        const now = new Date().toISOString();
        await supabase
          .from('jobs')
          .update({
            status: 'pending_approval',
            approval_submitted_at: now,
          })
          .eq('id', job.id);
      }
    }

    // Link requests via job_requests join table
    if (parsedInput.linked_request_ids && parsedInput.linked_request_ids.length > 0) {
      const jobRequestRows = parsedInput.linked_request_ids.map((requestId) => ({
        job_id: job.id,
        request_id: requestId,
        company_id: effectiveCompanyId,
        linked_by: profile.id,
      }));

      const { error: linkError } = await supabase
        .from('job_requests')
        .insert(jobRequestRows);

      if (linkError) {
        throw new Error(`Failed to link requests: ${linkError.message}`);
      }

      // Move triaged linked requests to in_progress (skip already in_progress)
      const { error: updateReqError } = await supabase
        .from('requests')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .in('id', parsedInput.linked_request_ids)
        .in('status', ['triaged']);

      if (updateReqError) {
        throw new Error(`Failed to update request statuses: ${updateReqError.message}`);
      }
    }

    revalidatePath('/jobs');
    revalidatePath('/requests');
    return { success: true, jobId: job.id, displayId: job.display_id };
  });

// ============================================================================
// updateJob — ga_lead or admin only
// ============================================================================
export const updateJob = authActionClient
  .schema(updateJobSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    // Fetch existing job
    const { data: existing } = await supabase
      .from('jobs')
      .select('id, status, company_id, estimated_cost, approved_at, updated_at')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Job not found');
    }

    // Optimistic locking: reject if entity was modified since the form loaded
    assertNotStale(parsedInput.updated_at, existing.updated_at);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, linked_request_ids, updated_at: _lockToken, ...updateFields } = parsedInput;

    // Block PIC changes once job is past 'assigned' status
    const PIC_EDITABLE_STATUSES = ['created', 'assigned'];
    if (updateFields.assigned_to !== undefined && !PIC_EDITABLE_STATUSES.includes(existing.status)) {
      throw new Error('Cannot change PIC after work has started');
    }

    // If linked_request_ids changed, diff and update
    if (linked_request_ids !== undefined) {
      // Fetch current links
      const { data: currentLinks } = await supabase
        .from('job_requests')
        .select('request_id')
        .eq('job_id', id);

      const currentIds = new Set(currentLinks?.map((l) => l.request_id) ?? []);
      const newIds = new Set(linked_request_ids);

      // Requests to unlink
      const toRemove = [...currentIds].filter((rid) => !newIds.has(rid));
      // Requests to link
      const toAdd = [...newIds].filter((rid) => !currentIds.has(rid));

      if (toRemove.length > 0) {
        const { error: unlinkError } = await supabase
          .from('job_requests')
          .delete()
          .eq('job_id', id)
          .in('request_id', toRemove);
        if (unlinkError) {
          throw new Error(`Failed to unlink requests: ${unlinkError.message}`);
        }
      }

      if (toAdd.length > 0) {
        // ── Validate newly linked requests (Rules 1-3) ──
        // Rule 2: Only triaged/in_progress requests can be linked
        const { data: requestsToAdd } = await supabase
          .from('requests')
          .select('id, display_id, status, assigned_to')
          .in('id', toAdd)
          .is('deleted_at', null);

        if (!requestsToAdd || requestsToAdd.length !== toAdd.length) {
          throw new Error('One or more selected requests were not found.');
        }

        const invalidStatus = requestsToAdd.filter((r) => !['triaged', 'in_progress'].includes(r.status));
        if (invalidStatus.length > 0) {
          throw new Error("Cannot link requests with status 'New'. Only triaged or in-progress requests can be linked.");
        }

        // Rule 3: Each request can only be linked to one job (exclude current job's own links)
        const { data: existingLinks } = await supabase
          .from('job_requests')
          .select('request_id')
          .in('request_id', toAdd)
          .neq('job_id', id);

        if (existingLinks && existingLinks.length > 0) {
          const alreadyLinkedIds = existingLinks.map((l) => l.request_id);
          const alreadyLinkedRequests = requestsToAdd.filter((r) => alreadyLinkedIds.includes(r.id));
          const displayIds = alreadyLinkedRequests.map((r) => r.display_id).join(', ');
          throw new Error(`Request ${displayIds} is already linked to another job.`);
        }

        // Rule 1: Only the PIC assigned to a request can link it
        const notAssigned = requestsToAdd.filter((r) => r.assigned_to !== profile.id);
        if (notAssigned.length > 0) {
          throw new Error('You can only link requests assigned to you as PIC.');
        }

        await supabase
          .from('job_requests')
          .insert(toAdd.map((requestId) => ({
            job_id: id,
            request_id: requestId,
            company_id: profile.company_id,
            linked_by: profile.id,
          })));

        // Move triaged newly linked requests to in_progress (skip already in_progress)
        await supabase
          .from('requests')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .in('id', toAdd)
          .in('status', ['triaged']);
      }

      // Recalculate priority from all current linked requests
      if (linked_request_ids.length > 0) {
        const { data: linkedRequests } = await supabase
          .from('requests')
          .select('priority')
          .in('id', linked_request_ids)
          .is('deleted_at', null);

        if (linkedRequests && linkedRequests.length > 0) {
          updateFields.priority = highestPriority(linkedRequests.map((r) => r.priority)) as typeof parsedInput.priority;
        }
      }
    }

    // Only update non-undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    if (updateFields.title !== undefined) fieldsToUpdate.title = updateFields.title;
    if (updateFields.description !== undefined) fieldsToUpdate.description = updateFields.description;
    if (updateFields.location_id !== undefined) fieldsToUpdate.location_id = updateFields.location_id;
    if (updateFields.category_id !== undefined) fieldsToUpdate.category_id = updateFields.category_id;
    if (updateFields.priority !== undefined) fieldsToUpdate.priority = updateFields.priority;
    if (updateFields.assigned_to !== undefined) fieldsToUpdate.assigned_to = updateFields.assigned_to;
    if (updateFields.estimated_cost !== undefined) fieldsToUpdate.estimated_cost = updateFields.estimated_cost;

    // Auto-transition: if assigning a PIC on a 'created' job, move to 'assigned'
    if (fieldsToUpdate.assigned_to && existing.status === 'created') {
      fieldsToUpdate.status = 'assigned';
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      const { error } = await supabase
        .from('jobs')
        .update(fieldsToUpdate)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Notify newly assigned PIC
      if (fieldsToUpdate.assigned_to) {
        const { data: jobDisplay } = await supabase
          .from('jobs')
          .select('display_id')
          .eq('id', id)
          .single();

        createNotifications({
          companyId: profile.company_id,
          recipientIds: [fieldsToUpdate.assigned_to as string],
          actorId: profile.id,
          title: `Job ${jobDisplay?.display_id ?? id} assigned to you`,
          body: 'You have been assigned as PIC for this job',
          type: 'assignment',
          entityType: 'job',
          entityId: id,
        }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
      }

    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${id}`);
    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// assignJob — ga_lead or admin only; sets assigned_to and moves to 'assigned'
// ============================================================================
export const assignJob = authActionClient
  .schema(z.object({ id: z.string().uuid(), assigned_to: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, display_id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    const updateData: Record<string, string> = { assigned_to: parsedInput.assigned_to };

    // Only transition to 'assigned' if currently 'created'
    if (job.status === 'created') {
      updateData.status = 'assigned';
    }

    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // Non-blocking notification: notify the assigned PIC
    createNotifications({
      companyId: profile.company_id,
      recipientIds: [parsedInput.assigned_to],
      actorId: profile.id,
      title: `Job ${job.display_id} assigned to you`,
      body: 'You have been assigned as PIC for this job',
      type: 'assignment',
      entityType: 'job',
      entityId: parsedInput.id,
    }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.id}`);
    return { success: true };
  });

// ============================================================================
// updateJobStatus — ga_lead/admin OR assigned PIC (Start Work: PIC only)
// When transitioning to 'completed': check budget_threshold to determine if
// completion approval is required. If cost >= threshold, transition to
// 'pending_completion_approval' instead of 'completed' directly.
// GPS coordinates are recorded for every status change (REQ-JOB-010).
// ============================================================================
export const updateJobStatus = authActionClient
  .schema(z.object({
    id: z.string().uuid(),
    status: z.enum(['assigned', 'in_progress', 'completed']),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    gpsAccuracy: z.number().optional(),
  }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Fetch job
    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, assigned_to, company_id, created_by, display_id, estimated_cost, job_type, maintenance_schedule_id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    const isLead = (LEAD_ROLES as readonly string[]).includes(profile.role);
    const isPIC = job.assigned_to === profile.id;

    if (!isLead && !isPIC) {
      throw new Error('Permission denied — only GA Lead, Admin, or assigned PIC can update job status');
    }

    // Start Work (in_progress) restricted to PIC only — defense in depth
    if (parsedInput.status === 'in_progress' && !isPIC) {
      throw new Error('Permission denied — only the assigned PIC can start work');
    }

    // Validate allowed transitions
    const validTransitions: Record<string, string[]> = {
      created: ['assigned'],
      assigned: ['in_progress'],
      in_progress: ['completed'],
      pending_approval: [], // handled by approveJob/rejectJob
      pending_completion_approval: [], // handled by approveCompletion/rejectCompletion
      completed: [],
      cancelled: [],
    };

    const allowedNext = validTransitions[job.status] ?? [];
    if (!allowedNext.includes(parsedInput.status)) {
      throw new Error(`Cannot transition from '${job.status}' to '${parsedInput.status}'`);
    }

    const now = new Date().toISOString();

    let actualStatus: string = parsedInput.status;

    // When marking complete, check if completion approval is required
    let requiresCompletionApproval = false;

    if (parsedInput.status === 'completed') {
      // Block completion without assigned PIC — require accountability
      if (!job.assigned_to) {
        throw new Error('Cannot complete a job without an assigned PIC. Assign someone first.');
      }

      const { data: setting } = await supabase
        .from('company_settings')
        .select('value')
        .eq('company_id', job.company_id)
        .eq('key', 'budget_threshold')
        .single();

      const budgetThreshold = setting ? parseInt(setting.value, 10) : null;
      const estimatedCost = job.estimated_cost ?? 0;

      if (budgetThreshold !== null && estimatedCost >= budgetThreshold) {
        actualStatus = 'pending_completion_approval';
        requiresCompletionApproval = true;
      }
    }

    const jobUpdate: Record<string, unknown> = { status: actualStatus };

    // Set started_at when transitioning to in_progress
    if (actualStatus === 'in_progress' && job.status === 'assigned') {
      jobUpdate.started_at = now;
    }

    if (requiresCompletionApproval) {
      jobUpdate.completion_submitted_at = now;
    } else if (actualStatus === 'completed') {
      jobUpdate.completed_at = now;
    }

    const { error } = await supabase
      .from('jobs')
      .update(jobUpdate)
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // Record GPS status change (REQ-JOB-010)
    await supabase
      .from('job_status_changes')
      .insert({
        job_id: parsedInput.id,
        company_id: job.company_id,
        from_status: job.status,
        to_status: actualStatus,
        changed_by: profile.id,
        latitude: parsedInput.latitude ?? null,
        longitude: parsedInput.longitude ?? null,
        gps_accuracy: parsedInput.gpsAccuracy ?? null,
      });

    // Advance floating schedule when completing a PM job
    if (actualStatus === 'completed' && job.job_type === 'preventive_maintenance') {
      await advanceFloatingScheduleCore(supabase, parsedInput.id);
    }

    if (requiresCompletionApproval) {
      // Notify job creator that completion approval is needed
      createNotifications({
        companyId: job.company_id,
        recipientIds: [job.created_by],
        actorId: profile.id,
        title: `Job ${job.display_id} requires completion approval`,
        body: `Estimated cost: ${formatIDR(job.estimated_cost ?? 0)}`,
        type: 'approval',
        entityType: 'job',
        entityId: parsedInput.id,
      }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
    }

    // When directly completing (no completion approval required), move linked requests
    if (actualStatus === 'completed') {
      const { data: linkedJobRequests } = await supabase
        .from('job_requests')
        .select('request_id')
        .eq('job_id', parsedInput.id);

      if (linkedJobRequests && linkedJobRequests.length > 0) {
        const requestIds = linkedJobRequests.map((jr) => jr.request_id);
        await supabase
          .from('requests')
          .update({
            status: 'pending_acceptance',
            completed_at: now,
            updated_at: now,
          })
          .in('id', requestIds)
          .neq('status', 'cancelled');

        // Non-blocking notification: notify requesters with auto-accept warning
        const { data: linkedRequests } = await supabase
          .from('requests')
          .select('requester_id, display_id')
          .in('id', requestIds)
          .is('deleted_at', null);

        if (linkedRequests && linkedRequests.length > 0) {
          const requesterIds = [...new Set(linkedRequests.map((r) => r.requester_id))];
          createNotifications({
            companyId: job.company_id,
            recipientIds: requesterIds,
            actorId: profile.id,
            title: `Job completed — please review`,
            body: 'Your request work is done. Accept or reject within 7 days or it will be auto-accepted.',
            type: 'auto_accept_warning',
            entityType: 'job',
            entityId: parsedInput.id,
          }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
        }
      }

      // Non-blocking notification: notify job creator and assigned PIC about completion
      const completionRecipients = [job.created_by, job.assigned_to].filter(Boolean) as string[];
      createNotifications({
        companyId: job.company_id,
        recipientIds: completionRecipients,
        actorId: profile.id,
        title: `Job ${job.display_id} completed`,
        type: 'completion',
        entityType: 'job',
        entityId: parsedInput.id,
      }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.id}`);
    revalidatePath('/requests');
    revalidatePath('/approvals');
    return { success: true };
  });

// ============================================================================
// cancelJob — ga_lead or admin only; moves linked requests back to 'triaged'
// ============================================================================
export const cancelJob = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, assigned_to, display_id, company_id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'completed') {
      throw new Error('Cannot cancel a completed job');
    }

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'cancelled' })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // Non-blocking notification: notify the assigned PIC (if any)
    if (job.assigned_to) {
      createNotifications({
        companyId: profile.company_id,
        recipientIds: [job.assigned_to],
        actorId: profile.id,
        title: `Job ${job.display_id} cancelled`,
        type: 'status_change',
        entityType: 'job',
        entityId: parsedInput.id,
      }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
    }

    // Move linked requests back to triaged
    const { data: linkedJobRequests } = await supabase
      .from('job_requests')
      .select('request_id')
      .eq('job_id', parsedInput.id);

    if (linkedJobRequests && linkedJobRequests.length > 0) {
      const requestIds = linkedJobRequests.map((jr) => jr.request_id);
      await supabase
        .from('requests')
        .update({ status: 'triaged', updated_at: new Date().toISOString() })
        .in('id', requestIds)
        .in('status', ['in_progress', 'pending_acceptance']);
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.id}`);
    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// addJobComment — ga_lead/admin OR assigned PIC
// ============================================================================
export const addJobComment = authActionClient
  .schema(jobCommentSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionResponse<{ commentId: string }>> => {
    const { supabase, profile } = ctx;

    // Fetch job to verify access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, assigned_to, company_id')
      .eq('id', parsedInput.job_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    const isLead = (LEAD_ROLES as readonly string[]).includes(profile.role);
    const isPIC = job.assigned_to === profile.id;

    if (!isLead && !isPIC) {
      throw new Error('Only GA Lead, Admin, or assigned PIC can post comments');
    }

    const { data: comment, error } = await supabase
      .from('job_comments')
      .insert({
        job_id: parsedInput.job_id,
        user_id: profile.id,
        company_id: job.company_id,
        content: parsedInput.content,
      })
      .select('id')
      .single();

    if (error || !comment) {
      throw new Error(error?.message ?? 'Failed to create comment');
    }

    revalidatePath(`/jobs/${parsedInput.job_id}`);
    return { success: true, commentId: comment.id };
  });

// ============================================================================
// deleteJobAttachment — ga_lead or admin only; soft-deletes media_attachment
// ============================================================================
export const deleteJobAttachment = authActionClient
  .schema(z.object({ attachmentId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('Only GA Lead or Admin can delete job photos');
    }

    // Fetch the attachment
    const { data: attachment } = await supabase
      .from('media_attachments')
      .select('id, entity_id, entity_type, file_path')
      .eq('id', parsedInput.attachmentId)
      .is('deleted_at', null)
      .single();

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Verify entity_type is 'job'
    if (attachment.entity_type !== 'job') {
      throw new Error('Attachment not found');
    }

    // Verify the parent job belongs to user's company and is not deleted
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', attachment.entity_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found or access denied');
    }

    // Soft-delete the attachment via admin client to bypass RLS WITH CHECK
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('media_attachments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsedInput.attachmentId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/jobs');
    return { success: true };
  });
