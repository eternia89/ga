'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';

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
      .select('id, status, estimated_cost, company_id')
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
    return { success: true };
  });

// ============================================================================
// approveJob — finance_approver or admin only
// Sets job status to in_progress (approval granted, work can proceed)
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
      .select('id, status, company_id')
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

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });

// ============================================================================
// rejectJob — finance_approver or admin only; reason required
// Sends job back to 'assigned' status; clears approval_submitted_at
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
      .select('id, status, company_id')
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
        status: 'assigned',
        approval_submitted_at: null,
        approval_rejected_at: now,
        approval_rejected_by: profile.id,
        approval_rejection_reason: parsedInput.reason,
      })
      .eq('id', parsedInput.job_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${parsedInput.job_id}`);
    revalidatePath('/approvals');
    return { success: true };
  });
