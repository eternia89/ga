'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { LEAD_ROLES } from '@/lib/constants/roles';
import { type SupabaseClient } from '@supabase/supabase-js';
import type { PMJobChecklist, ChecklistResponse } from '@/lib/types/maintenance';
import type { ActionOk, ChecklistProgressResponse, ChecklistCompleteResponse, AdvanceScheduleResponse } from '@/lib/types/action-responses';

// ============================================================================
// savePMChecklistItem — save-as-you-go for individual checklist items
// PIC fills out the checklist item by item; each save persists immediately
// ============================================================================
export const savePMChecklistItem = authActionClient
  .schema(
    z.object({
      jobId: z.string().uuid(),
      itemId: z.string(),
      value: z.union([z.boolean(), z.string().max(1000), z.number(), z.null()]),
    })
  )
  .action(async ({ parsedInput, ctx }): Promise<ChecklistProgressResponse> => {
    const { supabase, profile } = ctx;

    // Fetch job and verify access (PIC, ga_lead, or admin only)
    const { data: job } = await supabase
      .from('jobs')
      .select('id, assigned_to, checklist_responses, job_type, status')
      .eq('id', parsedInput.jobId)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.job_type !== 'preventive_maintenance') {
      throw new Error('This action is only for PM jobs');
    }

    const isLead = (LEAD_ROLES as readonly string[]).includes(profile.role);
    const isPIC = job.assigned_to === profile.id;
    if (!isLead && !isPIC) {
      throw new Error('Only GA Lead, Admin, or assigned PIC can update checklist items');
    }

    if (['completed', 'cancelled'].includes(job.status)) {
      throw new Error('Cannot edit checklist for a completed or cancelled job');
    }

    // Fetch-modify-replace on checklist_responses JSONB
    const checklist = job.checklist_responses as PMJobChecklist | null;
    if (!checklist) {
      throw new Error('This PM job has no checklist');
    }

    const responses: ChecklistResponse[] = checklist.items ?? [];
    const idx = responses.findIndex((r) => r.item_id === parsedInput.itemId);

    if (idx < 0) {
      throw new Error(`Checklist item ${parsedInput.itemId} not found in this job`);
    }

    // Update value and set completed_at timestamp
    const updatedResponses = [...responses];
    updatedResponses[idx] = {
      ...updatedResponses[idx],
      value: parsedInput.value,
      completed_at:
        parsedInput.value !== null
          ? new Date().toISOString()
          : undefined,
    };

    const updatedChecklist: PMJobChecklist = {
      ...checklist,
      items: updatedResponses,
    };

    const { error } = await supabase
      .from('jobs')
      .update({ checklist_responses: updatedChecklist })
      .eq('id', parsedInput.jobId);

    if (error) {
      throw new Error(error.message);
    }

    // Return progress counts for UI feedback
    const completedCount = updatedResponses.filter((r) => r.value !== null).length;
    const totalCount = updatedResponses.length;

    revalidatePath(`/jobs/${parsedInput.jobId}`);
    return { success: true, completedCount, totalCount };
  });

// ============================================================================
// savePMChecklistPhoto — save photo URLs for photo-type checklist items
// The actual file upload goes through the existing job photos API route;
// this action only persists the URL(s) to the checklist response.
// ============================================================================
export const savePMChecklistPhoto = authActionClient
  .schema(
    z.object({
      jobId: z.string().uuid(),
      itemId: z.string(),
      photoUrls: z.array(z.string().max(2048)),
    })
  )
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Fetch job and verify access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, assigned_to, checklist_responses, job_type, status')
      .eq('id', parsedInput.jobId)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.job_type !== 'preventive_maintenance') {
      throw new Error('This action is only for PM jobs');
    }

    const isLead = (LEAD_ROLES as readonly string[]).includes(profile.role);
    const isPIC = job.assigned_to === profile.id;
    if (!isLead && !isPIC) {
      throw new Error('Only GA Lead, Admin, or assigned PIC can update checklist photos');
    }

    if (['completed', 'cancelled'].includes(job.status)) {
      throw new Error('Cannot edit checklist for a completed or cancelled job');
    }

    const checklist = job.checklist_responses as PMJobChecklist | null;
    if (!checklist) {
      throw new Error('This PM job has no checklist');
    }

    const responses: ChecklistResponse[] = checklist.items ?? [];
    const idx = responses.findIndex((r) => r.item_id === parsedInput.itemId);

    if (idx < 0) {
      throw new Error(`Checklist item ${parsedInput.itemId} not found in this job`);
    }

    const updatedResponses = [...responses];
    updatedResponses[idx] = {
      ...updatedResponses[idx],
      value: parsedInput.photoUrls,
      photo_urls: parsedInput.photoUrls,
      completed_at:
        parsedInput.photoUrls.length > 0
          ? new Date().toISOString()
          : undefined,
    };

    const updatedChecklist: PMJobChecklist = {
      ...checklist,
      items: updatedResponses,
    };

    const { error } = await supabase
      .from('jobs')
      .update({ checklist_responses: updatedChecklist })
      .eq('id', parsedInput.jobId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/jobs/${parsedInput.jobId}`);
    return { success: true };
  });

// ============================================================================
// completePMChecklist — validate all items filled; update checklist_completed_at
// Per CONTEXT.md: "All checklist items are required when filling out a PM job"
// Does NOT change job status — PIC still marks job as complete via normal flow.
// ============================================================================
export const completePMChecklist = authActionClient
  .schema(z.object({ jobId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ChecklistCompleteResponse> => {
    const { supabase, profile } = ctx;

    const { data: job } = await supabase
      .from('jobs')
      .select('id, assigned_to, checklist_responses, job_type, status')
      .eq('id', parsedInput.jobId)
      .is('deleted_at', null)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.job_type !== 'preventive_maintenance') {
      throw new Error('This action is only for PM jobs');
    }

    const isLead = (LEAD_ROLES as readonly string[]).includes(profile.role);
    const isPIC = job.assigned_to === profile.id;
    if (!isLead && !isPIC) {
      throw new Error('Only GA Lead, Admin, or assigned PIC can complete the checklist');
    }

    const checklist = job.checklist_responses as PMJobChecklist | null;
    if (!checklist) {
      throw new Error('This PM job has no checklist');
    }

    // Validate all items have non-null values (all items are required)
    const incompleteItems = checklist.items.filter((r) => r.value === null || r.value === undefined);
    if (incompleteItems.length > 0) {
      const labels = incompleteItems.map((r) => `"${r.label}"`).join(', ');
      throw new Error(
        `Cannot complete checklist — ${incompleteItems.length} item(s) still incomplete: ${labels}`
      );
    }

    // Set checklist_completed_at in JSONB metadata (does NOT change job status)
    const updatedChecklist: PMJobChecklist = {
      ...checklist,
      checklist_completed_at: new Date().toISOString(),
    } as PMJobChecklist & { checklist_completed_at: string };

    const { error } = await supabase
      .from('jobs')
      .update({ checklist_responses: updatedChecklist })
      .eq('id', parsedInput.jobId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/jobs/${parsedInput.jobId}`);
    return { success: true, completedCount: checklist.items.length };
  });

// ============================================================================
// advanceFloatingScheduleCore — plain async function for internal use.
// Called from job-actions.ts updateJobStatus on PM job completion.
// Advances next_due_at ONLY for floating schedules (fixed schedule next_due_at
// is advanced by the cron at job generation time, per RESEARCH.md Pitfall 2).
// ============================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function advanceFloatingScheduleCore(supabaseClient: SupabaseClient<any>, jobId: string): Promise<AdvanceScheduleResponse> {
  // Fetch job with schedule relation
  const { data: job } = await supabaseClient
    .from('jobs')
    .select('id, job_type, maintenance_schedule_id, status')
    .eq('id', jobId)
    .is('deleted_at', null)
    .single();

  if (!job) {
    return { success: true, advanced: false };
  }

  if (job.job_type !== 'preventive_maintenance') {
    return { success: true, advanced: false };
  }

  if (!job.maintenance_schedule_id) {
    return { success: true, advanced: false };
  }

  // Fetch the linked schedule
  const { data: schedule } = await supabaseClient
    .from('maintenance_schedules')
    .select('id, interval_type, interval_days, next_due_at')
    .eq('id', job.maintenance_schedule_id)
    .is('deleted_at', null)
    .single();

  if (!schedule) {
    return { success: true, advanced: false };
  }

  const now = new Date();

  if (schedule.interval_type === 'floating') {
    const nextDueAt = new Date(now.getTime() + schedule.interval_days * 86400000).toISOString();

    const { error } = await supabaseClient
      .from('maintenance_schedules')
      .update({
        next_due_at: nextDueAt,
        last_completed_at: now.toISOString(),
      })
      .eq('id', schedule.id);

    if (error) {
      throw new Error(`Failed to advance floating schedule: ${error.message}`);
    }

    return { success: true, advanced: true, nextDueAt };
  }

  if (schedule.interval_type === 'fixed') {
    const { error } = await supabaseClient
      .from('maintenance_schedules')
      .update({ last_completed_at: now.toISOString() })
      .eq('id', schedule.id);

    if (error) {
      throw new Error(`Failed to update fixed schedule last_completed_at: ${error.message}`);
    }

    return { success: true, advanced: false };
  }

  return { success: true, advanced: false };
}

// ============================================================================
// advanceFloatingSchedule — thin authActionClient wrapper around core function.
// Kept for standalone use (e.g., manual trigger from UI).
// ============================================================================
export const advanceFloatingSchedule = authActionClient
  .schema(z.object({ jobId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<AdvanceScheduleResponse> => {
    return advanceFloatingScheduleCore(ctx.supabase, parsedInput.jobId);
  });
