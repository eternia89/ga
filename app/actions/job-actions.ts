'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { createJobSchema, updateJobSchema, jobCommentSchema } from '@/lib/validations/job-schema';
import { z } from 'zod';
import { createNotifications } from '@/lib/notifications/helpers';

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'] as const;

function highestPriority(priorities: (string | null)[]): string {
  let maxIndex = -1;
  for (const p of priorities) {
    if (!p) continue;
    const idx = PRIORITY_ORDER.indexOf(p as typeof PRIORITY_ORDER[number]);
    if (idx > maxIndex) maxIndex = idx;
  }
  return maxIndex >= 0 ? PRIORITY_ORDER[maxIndex] : 'low';
}

// ============================================================================
// createJob — ga_lead or admin only
// ============================================================================
export const createJob = authActionClient
  .schema(createJobSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    // Generate display_id atomically via DB function
    const { data: displayId, error: rpcError } = await supabase
      .rpc('generate_job_display_id', { p_company_id: profile.company_id });

    if (rpcError || !displayId) {
      throw new Error('Failed to generate job ID. Please try again.');
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
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        company_id: profile.company_id,
        display_id: displayId,
        title: parsedInput.title,
        description: parsedInput.description,
        location_id: parsedInput.location_id,
        category_id: parsedInput.category_id,
        priority: computedPriority,
        assigned_to: parsedInput.assigned_to ?? null,
        estimated_cost: parsedInput.estimated_cost ?? null,
        created_by: profile.id,
        status: 'created',
      })
      .select('id, display_id')
      .single();

    if (insertError || !job) {
      throw new Error(insertError?.message ?? 'Failed to create job');
    }

    // Link requests via job_requests join table
    if (parsedInput.linked_request_ids && parsedInput.linked_request_ids.length > 0) {
      const jobRequestRows = parsedInput.linked_request_ids.map((requestId) => ({
        job_id: job.id,
        request_id: requestId,
        company_id: profile.company_id,
        linked_by: profile.id,
      }));

      const { error: linkError } = await supabase
        .from('job_requests')
        .insert(jobRequestRows);

      if (linkError) {
        throw new Error(`Failed to link requests: ${linkError.message}`);
      }

      // Move each linked request to in_progress
      const { error: updateReqError } = await supabase
        .from('requests')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .in('id', parsedInput.linked_request_ids)
        .neq('status', 'cancelled');

      if (updateReqError) {
        throw new Error(`Failed to update request statuses: ${updateReqError.message}`);
      }
    }

    // If assigned_to provided, set status to assigned
    if (parsedInput.assigned_to) {
      await supabase
        .from('jobs')
        .update({ status: 'assigned' })
        .eq('id', job.id);
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
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    // Fetch existing job
    const { data: existing } = await supabase
      .from('jobs')
      .select('id, status, company_id')
      .eq('id', parsedInput.id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Job not found');
    }

    const { id, linked_request_ids, ...updateFields } = parsedInput;

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
        await supabase
          .from('job_requests')
          .delete()
          .eq('job_id', id)
          .in('request_id', toRemove);
      }

      if (toAdd.length > 0) {
        await supabase
          .from('job_requests')
          .insert(toAdd.map((requestId) => ({
            job_id: id,
            request_id: requestId,
            company_id: profile.company_id,
            linked_by: profile.id,
          })));

        // Move newly linked requests to in_progress
        await supabase
          .from('requests')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .in('id', toAdd)
          .neq('status', 'cancelled');
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

    if (Object.keys(fieldsToUpdate).length > 0) {
      const { error } = await supabase
        .from('jobs')
        .update(fieldsToUpdate)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
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
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, display_id')
      .eq('id', parsedInput.id)
      .eq('company_id', profile.company_id)
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
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.id}`);
    return { success: true };
  });

// ============================================================================
// updateJobStatus — ga_lead/admin OR assigned PIC
// When transitioning to 'completed': set completed_at, move linked requests to
// 'pending_acceptance' and set their completed_at.
// ============================================================================
export const updateJobStatus = authActionClient
  .schema(z.object({
    id: z.string().uuid(),
    status: z.enum(['assigned', 'in_progress', 'completed', 'pending_approval']),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch job
    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, assigned_to, company_id, created_by, display_id')
      .eq('id', parsedInput.id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    const isLead = ['ga_lead', 'admin'].includes(profile.role);
    const isPIC = job.assigned_to === profile.id;

    if (!isLead && !isPIC) {
      throw new Error('Permission denied — only GA Lead, Admin, or assigned PIC can update job status');
    }

    // Validate allowed transitions
    const validTransitions: Record<string, string[]> = {
      created: ['assigned'],
      assigned: ['in_progress', 'pending_approval'],
      in_progress: ['completed', 'pending_approval'],
      pending_approval: ['in_progress'], // after approval (approval action handles the approve path)
      completed: [],
      cancelled: [],
    };

    const allowedNext = validTransitions[job.status] ?? [];
    if (!allowedNext.includes(parsedInput.status)) {
      throw new Error(`Cannot transition from '${job.status}' to '${parsedInput.status}'`);
    }

    const now = new Date().toISOString();
    const jobUpdate: Record<string, unknown> = { status: parsedInput.status };

    if (parsedInput.status === 'completed') {
      jobUpdate.completed_at = now;
    }

    const { error } = await supabase
      .from('jobs')
      .update(jobUpdate)
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // TODO(PM-INTEGRATION): When completing a PM job, call advanceFloatingSchedule.
    // Example integration:
    //   if (parsedInput.status === 'completed') {
    //     const { data: fullJob } = await supabase.from('jobs').select('job_type').eq('id', parsedInput.id).single();
    //     if (fullJob?.job_type === 'preventive_maintenance') {
    //       await advanceFloatingSchedule({ jobId: parsedInput.id }); // from pm-job-actions.ts
    //     }
    //   }
    // This advances floating schedule next_due_at from completion date (not generation date).
    // Fixed schedule next_due_at is already advanced by the cron at job generation time.

    // When completing, move all linked requests to pending_acceptance
    if (parsedInput.status === 'completed') {
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
          });
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
      });
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.id}`);
    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// cancelJob — ga_lead or admin only; moves linked requests back to 'triaged'
// ============================================================================
export const cancelJob = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, assigned_to, display_id, company_id')
      .eq('id', parsedInput.id)
      .eq('company_id', profile.company_id)
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
      });
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
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch job to verify access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, assigned_to, company_id')
      .eq('id', parsedInput.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    const isLead = ['ga_lead', 'admin'].includes(profile.role);
    const isPIC = job.assigned_to === profile.id;

    if (!isLead && !isPIC) {
      throw new Error('Only GA Lead, Admin, or assigned PIC can post comments');
    }

    const { data: comment, error } = await supabase
      .from('job_comments')
      .insert({
        job_id: parsedInput.job_id,
        user_id: profile.id,
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
