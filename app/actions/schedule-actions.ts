'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient, gaLeadActionClient } from '@/lib/safe-action';
import { scheduleCreateSchema, scheduleEditSchema } from '@/lib/validations/schedule-schema';
import { getScheduleDisplayStatus } from '@/lib/constants/schedule-status';
import type { ChecklistItem } from '@/lib/types/maintenance';
import { z } from 'zod';

// ============================================================================
// createSchedule — ga_lead or admin only
// Validates template-asset category match (Pitfall 7 prevention).
// Calculates initial next_due_at from start_date or now() + interval_days.
// ============================================================================

export const createSchedule = gaLeadActionClient
  .schema(scheduleCreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase, profile } = ctx;

    // Fetch template — must be active (templates are global)
    const { data: template } = await adminSupabase
      .from('maintenance_templates')
      .select('id, category_id, is_active')
      .eq('id', parsedInput.template_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (!template) {
      throw new Error('Template not found or inactive');
    }

    // Determine company_id and validate asset (if provided)
    let companyId: string;

    if (parsedInput.item_id) {
      // Asset-linked schedule: fetch asset, validate status + category match
      const { data: asset } = await adminSupabase
        .from('inventory_items')
        .select('id, category_id, status, company_id')
        .eq('id', parsedInput.item_id)
        .is('deleted_at', null)
        .single();

      if (!asset) {
        throw new Error('Asset not found');
      }

      if (asset.status === 'sold_disposed') {
        throw new Error('Cannot create a schedule for a sold/disposed asset');
      }

      // Category matching validation (Pitfall 7): template category must match asset category
      // General templates (null category_id) can pair with any asset
      if (template.category_id && template.category_id !== asset.category_id) {
        throw new Error(
          'Template and asset must have the same category. Select a template that matches the asset category.'
        );
      }

      companyId = asset.company_id;
    } else {
      // No asset: use company_id from form (multi-company user) or fall back to profile
      companyId = parsedInput.company_id ?? profile.company_id;

      // Validate company access when a different company was selected
      if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
        const { data: access, error: accessError } = await adminSupabase
          .from('user_company_access')
          .select('id')
          .eq('user_id', profile.id)
          .eq('company_id', parsedInput.company_id)
          .maybeSingle();
        if (accessError) throw new Error('Failed to verify company access');
        if (!access) {
          throw new Error('You do not have access to the selected company.');
        }
      }
    }

    // Calculate initial next_due_at
    const now = new Date();
    let nextDueAt: Date;
    if (parsedInput.start_date) {
      nextDueAt = new Date(parsedInput.start_date);
    } else {
      nextDueAt = new Date(now.getTime() + parsedInput.interval_days * 86400000);
    }

    const { data, error } = await adminSupabase
      .from('maintenance_schedules')
      .insert({
        company_id:    companyId,
        item_id:       parsedInput.item_id ?? null,
        template_id:   parsedInput.template_id,
        interval_days: parsedInput.interval_days,
        interval_type: parsedInput.interval_type,
        auto_create_days_before: parsedInput.auto_create_days_before ?? 0,
        next_due_at:   nextDueAt.toISOString(),
        is_active:     true,
        is_paused:     false,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance');
    if (parsedInput.item_id) {
      revalidatePath(`/inventory/${parsedInput.item_id}`);
    }
    return { success: true, scheduleId: data.id };
  });

// ============================================================================
// updateSchedule — ga_lead or admin only
// Updates interval_days and interval_type. Recalculates next_due_at when
// interval changes (fresh calculation: now + new interval_days).
// ============================================================================

export const updateSchedule = gaLeadActionClient
  .schema(z.object({ id: z.string().uuid(), data: scheduleEditSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase, profile } = ctx;

    // Verify schedule exists
    const { data: existing } = await adminSupabase
      .from('maintenance_schedules')
      .select('id, interval_days, interval_type, auto_create_days_before, company_id, item_id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Verify user has access to this schedule's company
    const hasUpdateAccess = existing.company_id === profile.company_id;
    if (!hasUpdateAccess) {
      const { data: accessRow, error: accessError } = await adminSupabase
        .from('user_company_access')
        .select('id')
        .eq('user_id', profile.id)
        .eq('company_id', existing.company_id)
        .maybeSingle();
      if (accessError) throw new Error('Failed to verify company access');
      if (!accessRow) {
        throw new Error('Schedule not found');
      }
    }

    // Recalculate next_due_at if interval changes
    const intervalChanged =
      existing.interval_days !== parsedInput.data.interval_days ||
      existing.interval_type !== parsedInput.data.interval_type;

    const updatePayload: Record<string, unknown> = {
      interval_days: parsedInput.data.interval_days,
      interval_type: parsedInput.data.interval_type,
      auto_create_days_before: parsedInput.data.auto_create_days_before,
    };

    if (intervalChanged) {
      updatePayload.next_due_at = new Date(
        Date.now() + parsedInput.data.interval_days * 86400000
      ).toISOString();
    }

    const { error } = await adminSupabase
      .from('maintenance_schedules')
      .update(updatePayload)
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance');
    if (existing.item_id) {
      revalidatePath(`/inventory/${existing.item_id}`);
    }
    return { success: true };
  });

// ============================================================================
// deactivateSchedule — ga_lead or admin only
// Sets is_active = false. Also cancels open PM jobs linked to this schedule.
// Per CONTEXT.md: "GA Lead can manually activate/deactivate schedules"
// ============================================================================

export const deactivateSchedule = gaLeadActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase, profile } = ctx;

    // Verify schedule exists
    const { data: existing } = await adminSupabase
      .from('maintenance_schedules')
      .select('id, is_active, company_id, item_id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Verify user has access to this schedule's company
    const hasDeactivateAccess = existing.company_id === profile.company_id;
    if (!hasDeactivateAccess) {
      const { data: accessRow, error: accessError } = await adminSupabase
        .from('user_company_access')
        .select('id')
        .eq('user_id', profile.id)
        .eq('company_id', existing.company_id)
        .maybeSingle();
      if (accessError) throw new Error('Failed to verify company access');
      if (!accessRow) {
        throw new Error('Schedule not found');
      }
    }

    if (!existing.is_active) {
      throw new Error('Schedule is already deactivated');
    }

    // Deactivate the schedule
    const { error } = await adminSupabase
      .from('maintenance_schedules')
      .update({ is_active: false })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    // Cancel open PM jobs linked to this schedule (created, assigned, in_progress)
    await adminSupabase
      .from('jobs')
      .update({ status: 'cancelled' })
      .eq('maintenance_schedule_id', parsedInput.id)
      .in('status', ['created', 'assigned', 'in_progress'])
      .is('deleted_at', null);

    revalidatePath('/maintenance');
    if (existing.item_id) {
      revalidatePath(`/inventory/${existing.item_id}`);
    }
    return { success: true };
  });

// ============================================================================
// activateSchedule — ga_lead or admin only
// Sets is_active = true, recalculates next_due_at = now() + interval_days.
// ============================================================================

export const activateSchedule = gaLeadActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase, profile } = ctx;

    // Verify schedule exists
    const { data: existing } = await adminSupabase
      .from('maintenance_schedules')
      .select('id, is_active, interval_days, company_id, item_id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Verify user has access to this schedule's company
    const hasActivateAccess = existing.company_id === profile.company_id;
    if (!hasActivateAccess) {
      const { data: accessRow, error: accessError } = await adminSupabase
        .from('user_company_access')
        .select('id')
        .eq('user_id', profile.id)
        .eq('company_id', existing.company_id)
        .maybeSingle();
      if (accessError) throw new Error('Failed to verify company access');
      if (!accessRow) {
        throw new Error('Schedule not found');
      }
    }

    if (existing.is_active) {
      throw new Error('Schedule is already active');
    }

    const { error } = await adminSupabase
      .from('maintenance_schedules')
      .update({
        is_active:   true,
        next_due_at: new Date(Date.now() + existing.interval_days * 86400000).toISOString(),
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance');
    if (existing.item_id) {
      revalidatePath(`/inventory/${existing.item_id}`);
    }
    return { success: true };
  });

// ============================================================================
// deleteSchedule — ga_lead or admin only
// Soft-delete (set deleted_at). Historical PM jobs from this schedule remain.
// ============================================================================

export const deleteSchedule = gaLeadActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { adminSupabase, profile } = ctx;

    // Verify schedule exists
    const { data: existing } = await adminSupabase
      .from('maintenance_schedules')
      .select('id, company_id, item_id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Verify user has access to this schedule's company
    const hasDeleteAccess = existing.company_id === profile.company_id;
    if (!hasDeleteAccess) {
      const { data: accessRow, error: accessError } = await adminSupabase
        .from('user_company_access')
        .select('id')
        .eq('user_id', profile.id)
        .eq('company_id', existing.company_id)
        .maybeSingle();
      if (accessError) throw new Error('Failed to verify company access');
      if (!accessRow) {
        throw new Error('Schedule not found');
      }
    }

    const { error } = await adminSupabase
      .from('maintenance_schedules')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance');
    if (existing.item_id) {
      revalidatePath(`/inventory/${existing.item_id}`);
    }
    return { success: true };
  });

// ============================================================================
// getSchedules — all schedules for company, with template and asset joins
// ============================================================================

export const getSchedules = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch user's extra company access
    const { data: companyAccessRows } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', profile.id);
    const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
    const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select(`
        id,
        company_id,
        item_id,
        template_id,
        assigned_to,
        interval_days,
        interval_type,
        auto_create_days_before,
        last_completed_at,
        next_due_at,
        is_paused,
        paused_at,
        paused_reason,
        is_active,
        deleted_at,
        created_at,
        updated_at,
        template:maintenance_templates(name, checklist),
        asset:inventory_items(name, display_id),
        category:inventory_items(category:categories(name))
      `)
      .in('company_id', allAccessibleCompanyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const schedules = (data ?? []).map((s) => {
      const templateRaw = Array.isArray(s.template) ? s.template[0] : s.template;
      const assetRaw = Array.isArray(s.asset) ? s.asset[0] : s.asset;

      return {
        ...s,
        template: templateRaw
          ? { name: templateRaw.name, checklist: (templateRaw.checklist ?? []) as ChecklistItem[] }
          : null,
        asset: assetRaw ? { name: assetRaw.name, display_id: assetRaw.display_id } : null,
        display_status: getScheduleDisplayStatus({
          is_active:    s.is_active ?? true,
          is_paused:    s.is_paused ?? false,
          paused_reason: s.paused_reason ?? null,
        }),
      };
    });

    return { success: true, schedules };
  });

// ============================================================================
// getSchedulesByAssetId — schedules for a specific asset
// Used on asset detail page "Maintenance Schedules" section
// ============================================================================

export const getSchedulesByAssetId = authActionClient
  .schema(z.object({ assetId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Fetch user's extra company access
    const { data: companyAccessRows } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', profile.id);
    const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
    const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];

    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select(`
        id,
        company_id,
        item_id,
        template_id,
        assigned_to,
        interval_days,
        interval_type,
        auto_create_days_before,
        last_completed_at,
        next_due_at,
        is_paused,
        paused_at,
        paused_reason,
        is_active,
        deleted_at,
        created_at,
        updated_at,
        template:maintenance_templates(name, checklist)
      `)
      .eq('item_id', parsedInput.assetId)
      .in('company_id', allAccessibleCompanyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const schedules = (data ?? []).map((s) => {
      const templateRaw = Array.isArray(s.template) ? s.template[0] : s.template;

      return {
        ...s,
        template: templateRaw
          ? { name: templateRaw.name, checklist: (templateRaw.checklist ?? []) as ChecklistItem[] }
          : null,
        display_status: getScheduleDisplayStatus({
          is_active:    s.is_active ?? true,
          is_paused:    s.is_paused ?? false,
          paused_reason: s.paused_reason ?? null,
        }),
      };
    });

    return { success: true, schedules };
  });

// ============================================================================
// pauseSchedulesForAsset — auto-pause helper
// Called from asset status change action when asset becomes broken or under_repair.
// Pauses all active (non-paused) schedules, cancels open PM jobs.
// Uses 'auto:asset_{status}' prefix convention for paused_reason.
// ============================================================================

export async function pauseSchedulesForAsset(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  assetId: string,
  newStatus: string
): Promise<{ pausedCount: number }> {
  // Pause all active, non-paused schedules for this asset
  const { data: pausedSchedules, error: pauseError } = await supabase
    .from('maintenance_schedules')
    .update({
      is_paused:    true,
      paused_at:    new Date().toISOString(),
      paused_reason: `auto:asset_${newStatus}`,
    })
    .eq('item_id', assetId)
    .eq('is_paused', false)
    .eq('is_active', true)
    .is('deleted_at', null)
    .select('id');

  if (pauseError) {
    console.error('Failed to pause maintenance schedules:', pauseError.message);
    return { pausedCount: 0 };
  }

  const pausedCount = pausedSchedules?.length ?? 0;

  // Cancel open PM jobs for paused schedules (Pitfall 4 mitigation)
  if (pausedCount > 0) {
    const scheduleIds = pausedSchedules!.map((s) => s.id);
    await supabase
      .from('jobs')
      .update({ status: 'cancelled' })
      .in('maintenance_schedule_id', scheduleIds)
      .in('status', ['created', 'assigned', 'in_progress'])
      .is('deleted_at', null);
  }

  return { pausedCount };
}

// ============================================================================
// resumeSchedulesForAsset — auto-resume helper
// Called from asset status change action when asset returns to 'active'.
// Only resumes schedules where paused_reason starts with 'auto:' (not manual pauses).
// Recalculates next_due_at = now() + interval_days (fresh start, per CONTEXT.md:
//   "time during pause does not count").
// ============================================================================

export async function resumeSchedulesForAsset(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  assetId: string
): Promise<{ resumedCount: number }> {
  // Fetch auto-paused schedules to recalculate next_due_at per schedule's interval
  const { data: schedulesToResume, error: fetchError } = await supabase
    .from('maintenance_schedules')
    .select('id, interval_days')
    .eq('item_id', assetId)
    .eq('is_paused', true)
    .eq('is_active', true)
    .like('paused_reason', 'auto:%')
    .is('deleted_at', null);

  if (fetchError || !schedulesToResume || schedulesToResume.length === 0) {
    return { resumedCount: 0 };
  }

  // Update each schedule individually to set correct next_due_at per its interval
  const now = Date.now();
  let resumedCount = 0;

  for (const schedule of schedulesToResume) {
    const nextDueAt = new Date(now + schedule.interval_days * 86400000).toISOString();

    const { error } = await supabase
      .from('maintenance_schedules')
      .update({
        is_paused:    false,
        paused_at:    null,
        paused_reason: null,
        next_due_at:  nextDueAt,
      })
      .eq('id', schedule.id);

    if (!error) {
      resumedCount++;
    }
  }

  return { resumedCount };
}

// ============================================================================
// deactivateSchedulesForAsset — permanent deactivation helper
// Called when asset reaches terminal status (sold_disposed).
// Soft-deletes all schedules; historical PM jobs remain.
// Per CONTEXT.md: "Sold/Disposed (terminal): schedules are permanently deactivated"
// ============================================================================

export async function deactivateSchedulesForAsset(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  assetId: string
): Promise<{ deactivatedCount: number }> {
  const { data: deactivated, error } = await supabase
    .from('maintenance_schedules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('item_id', assetId)
    .is('deleted_at', null)
    .select('id');

  if (error) {
    console.error('Failed to deactivate maintenance schedules:', error.message);
    return { deactivatedCount: 0 };
  }

  return { deactivatedCount: deactivated?.length ?? 0 };
}
