'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { createNotifications } from '@/lib/notifications/helpers';

// ============================================================================
// submitForApproval — ga_lead or admin only
// Checks estimated_cost >= company budget_threshold before allowing transition
// ============================================================================
export const submitForApproval = authActionClient
  .schema(z.object({ job_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('GA Lead or Admin access required');
    }

    // Fetch the job
    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, estimated_cost, company_id, display_id')
      .eq('id', parsedInput.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (!['assigned', 'in_progress'].includes(job.status)) {
      throw new Error('Job must be in Assigned or In Progress status to submit for approval');
    }

    // Fetch company budget threshold
    const { data: setting } = await supabase
      .from('company_settings')
      .select('value')
      .eq('company_id', job.company_id)
      .eq('key', 'budget_threshold')
      .single();

    const budgetThreshold = setting ? parseInt(setting.value, 10) : null;

    if (budgetThreshold === null) {
      throw new Error('Budget threshold not configured. Please configure it in Company Settings before submitting for approval.');
    }

    const estimatedCost = job.estimated_cost ?? 0;
    if (estimatedCost < budgetThreshold) {
      throw new Error(
        `Estimated cost (${estimatedCost}) is below the approval threshold (${budgetThreshold}). Approval is only required for jobs at or above this amount.`
      );
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'pending_approval',
        approval_submitted_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');

    // Non-blocking notification: notify finance approvers and admins
    const { data: financeApprovers } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('company_id', job.company_id)
      .in('role', ['finance_approver', 'admin'])
      .is('deleted_at', null);

    if (financeApprovers && financeApprovers.length > 0) {
      createNotifications({
        companyId: job.company_id,
        recipientIds: financeApprovers.map((u) => u.id),
        actorId: profile.id,
        title: `Job ${job.display_id} requires approval`,
        body: `Estimated cost: Rp ${(estimatedCost).toLocaleString('id-ID')}`,
        type: 'approval',
        entityType: 'job',
        entityId: parsedInput.job_id,
      });
    }

    return { success: true };
  });

// ============================================================================
// approveJob — finance_approver or admin only
// Sets job status back to in_progress (approval granted, work continues)
// ============================================================================
export const approveJob = authActionClient
  .schema(z.object({ job_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['finance_approver', 'admin'].includes(profile.role)) {
      throw new Error('Finance Approver or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'pending_approval') {
      throw new Error('Job is not pending approval');
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'in_progress',
        approved_at: new Date().toISOString(),
        approved_by: profile.id,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    // Non-blocking notification: notify job creator and assigned PIC
    const approvalRecipients = [job.created_by, job.assigned_to].filter(Boolean) as string[];
    createNotifications({
      companyId: job.company_id,
      recipientIds: approvalRecipients,
      actorId: profile.id,
      title: `Job ${job.display_id} approved`,
      body: 'Budget approved — work continues',
      type: 'approval',
      entityType: 'job',
      entityId: parsedInput.job_id,
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });

// ============================================================================
// rejectJob — finance_approver or admin only; reason required
// Sends job back to 'in_progress' so PIC can revise cost and resubmit
// ============================================================================
export const rejectJob = authActionClient
  .schema(z.object({
    job_id: z.string().uuid(),
    reason: z.string()
      .min(1, 'Rejection reason is required')
      .max(1000, 'Reason must be under 1000 characters'),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['finance_approver', 'admin'].includes(profile.role)) {
      throw new Error('Finance Approver or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'pending_approval') {
      throw new Error('Job is not pending approval');
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'in_progress',
        approval_submitted_at: null,
        approval_rejected_at: now,
        approval_rejected_by: profile.id,
        approval_rejection_reason: parsedInput.reason,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    // Non-blocking notification: notify job creator and assigned PIC with reason
    const rejectionRecipients = [job.created_by, job.assigned_to].filter(Boolean) as string[];
    const truncatedReason = parsedInput.reason.substring(0, 100);
    createNotifications({
      companyId: job.company_id,
      recipientIds: rejectionRecipients,
      actorId: profile.id,
      title: `Job ${job.display_id} approval rejected`,
      body: truncatedReason,
      type: 'approval',
      entityType: 'job',
      entityId: parsedInput.job_id,
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });

// ============================================================================
// approveCompletion — finance_approver or admin only
// Transitions job from pending_completion_approval → completed.
// Moves linked requests to pending_acceptance (same as direct completion path).
// ============================================================================
export const approveCompletion = authActionClient
  .schema(z.object({ job_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['finance_approver', 'admin'].includes(profile.role)) {
      throw new Error('Finance Approver or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
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
        });
      }
    }

    // Notify job creator and PIC about completion approval
    const completionRecipients = [job.created_by, job.assigned_to].filter(Boolean) as string[];
    createNotifications({
      companyId: job.company_id,
      recipientIds: completionRecipients,
      actorId: profile.id,
      title: `Job ${job.display_id} completion approved`,
      body: 'Completion approved — linked requests moved to pending acceptance',
      type: 'approval',
      entityType: 'job',
      entityId: parsedInput.job_id,
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    revalidatePath('/requests');
    return { success: true };
  });

// ============================================================================
// rejectCompletion — finance_approver or admin only; reason required
// Sends job back to 'in_progress' so PIC can rework and resubmit.
// ============================================================================
export const rejectCompletion = authActionClient
  .schema(z.object({
    job_id: z.string().uuid(),
    reason: z.string()
      .min(1, 'Rejection reason is required')
      .max(1000, 'Reason must be under 1000 characters'),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check
    if (!['finance_approver', 'admin'].includes(profile.role)) {
      throw new Error('Finance Approver or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to')
      .eq('id', parsedInput.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
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

    // Notify job creator and PIC about completion rejection
    const rejectionRecipients = [job.created_by, job.assigned_to].filter(Boolean) as string[];
    const truncatedReason = parsedInput.reason.substring(0, 100);
    createNotifications({
      companyId: job.company_id,
      recipientIds: rejectionRecipients,
      actorId: profile.id,
      title: `Job ${job.display_id} completion rejected`,
      body: truncatedReason,
      type: 'approval',
      entityType: 'job',
      entityId: parsedInput.job_id,
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });

// ============================================================================
// unapproveJob — finance_approver or admin only
// Clears approval so the PIC can re-edit the budget. Status stays in_progress.
// ============================================================================
export const unapproveJob = authActionClient
  .schema(z.object({ job_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    if (!['finance_approver', 'admin'].includes(profile.role)) {
      throw new Error('Finance Approver or Admin access required');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, company_id, display_id, created_by, assigned_to, approved_at')
      .eq('id', parsedInput.job_id)
      .eq('company_id', profile.company_id)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'in_progress' || !job.approved_at) {
      throw new Error('Job must be in progress and previously approved to un-approve');
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        approved_at: null,
        approved_by: null,
        approval_submitted_at: null,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    const recipients = [job.created_by, job.assigned_to].filter(Boolean) as string[];
    createNotifications({
      companyId: job.company_id,
      recipientIds: recipients,
      actorId: profile.id,
      title: `Job ${job.display_id} budget unlocked`,
      body: 'Approval revoked — budget can be edited again',
      type: 'approval',
      entityType: 'job',
      entityId: parsedInput.job_id,
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });
