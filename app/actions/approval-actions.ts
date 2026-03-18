'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { createNotifications } from '@/lib/notifications/helpers';
import type { ActionOk } from '@/lib/types/action-responses';

// ============================================================================
// approveJob — job creator only
// Sets job status from pending_approval to created (so PIC can be assigned)
// ============================================================================
export const approveJob = authActionClient
  .schema(z.object({ job_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Only the job creator can approve budget
    if (job.created_by !== profile.id) {
      throw new Error('Only the job creator can approve the budget');
    }

    if (job.status !== 'pending_approval') {
      throw new Error('Job is not pending approval');
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'created',
        approved_at: new Date().toISOString(),
        approved_by: profile.id,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    // Notify PIC if assigned
    if (job.assigned_to) {
      createNotifications({
        companyId: job.company_id,
        recipientIds: [job.assigned_to],
        actorId: profile.id,
        title: `Job ${job.display_id} budget approved`,
        body: 'Budget approved — PIC can now be assigned',
        type: 'approval',
        entityType: 'job',
        entityId: parsedInput.job_id,
      }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });

// ============================================================================
// rejectJob — job creator only; reason required
// Sends job back to 'created' with rejection info recorded
// ============================================================================
export const rejectJob = authActionClient
  .schema(z.object({
    job_id: z.string().uuid(),
    reason: z.string()
      .min(1, 'Rejection reason is required')
      .max(1000, 'Reason must be under 1000 characters'),
  }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Only the job creator can reject budget
    if (job.created_by !== profile.id) {
      throw new Error('Only the job creator can reject the budget');
    }

    if (job.status !== 'pending_approval') {
      throw new Error('Job is not pending approval');
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'created',
        approval_submitted_at: null,
        approval_rejected_at: now,
        approval_rejected_by: profile.id,
        approval_rejection_reason: parsedInput.reason,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    // Notify PIC if assigned
    if (job.assigned_to) {
      createNotifications({
        companyId: job.company_id,
        recipientIds: [job.assigned_to],
        actorId: profile.id,
        title: `Job ${job.display_id} budget rejected`,
        body: parsedInput.reason.substring(0, 100),
        type: 'approval',
        entityType: 'job',
        entityId: parsedInput.job_id,
      }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });

// ============================================================================
// approveCompletion — job creator only
// Transitions job from pending_completion_approval → completed.
// Moves linked requests to pending_acceptance (same as direct completion path).
// ============================================================================
export const approveCompletion = authActionClient
  .schema(z.object({ job_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Only the job creator can approve completion
    if (job.created_by !== profile.id) {
      throw new Error('Only the job creator can approve completion');
    }

    if (job.status !== 'pending_completion_approval') {
      throw new Error('Job is not pending completion approval');
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        completed_at: now,
        completion_approved_at: now,
        completion_approved_by: profile.id,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    // Move all linked requests to pending_acceptance
    const { data: linkedJobRequests } = await supabase
      .from('job_requests')
      .select('request_id')
      .eq('job_id', parsedInput.job_id);

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

      // Notify requesters with auto-accept warning
      const { data: linkedRequests } = await supabase
        .from('requests')
        .select('requester_id')
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
          entityId: parsedInput.job_id,
        }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
      }
    }

    // Notify PIC about completion approval
    if (job.assigned_to) {
      createNotifications({
        companyId: job.company_id,
        recipientIds: [job.assigned_to],
        actorId: profile.id,
        title: `Job ${job.display_id} completion approved`,
        body: 'Completion approved — linked requests moved to pending acceptance',
        type: 'approval',
        entityType: 'job',
        entityId: parsedInput.job_id,
      }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// rejectCompletion — job creator only; reason required
// Sends job back to 'in_progress' so PIC can rework and resubmit.
// ============================================================================
export const rejectCompletion = authActionClient
  .schema(z.object({
    job_id: z.string().uuid(),
    reason: z.string()
      .min(1, 'Rejection reason is required')
      .max(1000, 'Reason must be under 1000 characters'),
  }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Only the job creator can reject completion
    if (job.created_by !== profile.id) {
      throw new Error('Only the job creator can reject completion');
    }

    if (job.status !== 'pending_completion_approval') {
      throw new Error('Job is not pending completion approval');
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'in_progress',
        completion_submitted_at: null, // Clear so PIC can resubmit
        completion_rejected_at: now,
        completion_rejected_by: profile.id,
        completion_rejection_reason: parsedInput.reason,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    // Notify PIC about completion rejection
    if (job.assigned_to) {
      createNotifications({
        companyId: job.company_id,
        recipientIds: [job.assigned_to],
        actorId: profile.id,
        title: `Job ${job.display_id} completion rejected`,
        body: parsedInput.reason.substring(0, 100),
        type: 'approval',
        entityType: 'job',
        entityId: parsedInput.job_id,
      }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });

