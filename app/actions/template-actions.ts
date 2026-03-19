'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/lib/safe-action';
import { templateCreateSchema, templateEditSchema } from '@/lib/validations/template-schema';
import { LEAD_ROLES } from '@/lib/constants/roles';
import { z } from 'zod';
import type { ActionOk, ActionResponse } from '@/lib/types/action-responses';
import type { ChecklistItem } from '@/lib/types/maintenance';

/** Shape returned by getTemplates/getTemplateById after joining and transforming DB rows */
interface TemplateListItem {
  id: string;
  company_id: string | null;
  category_id: string | null;
  name: string;
  description: string | null;
  checklist: ChecklistItem[];
  is_active: boolean | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string; type: string } | null;
  item_count: number;
}

// ============================================================================
// createTemplate — ga_lead or admin only
// Inserts a new maintenance template with checklist JSONB
// ============================================================================

export const createTemplate = authActionClient
  .schema(templateCreateSchema)
  .action(async ({ parsedInput, ctx }): Promise<ActionResponse<{ templateId: string }>> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('Only GA Lead or Admin can create maintenance templates');
    }

    // Validate that category_id references an 'asset' type category
    // (maintenance templates are for assets, not requests)
    // Skip validation when category_id is null (general template)
    if (parsedInput.category_id) {
      const { data: category } = await supabase
        .from('categories')
        .select('id, type')
        .eq('id', parsedInput.category_id)
        .is('deleted_at', null)
        .single();

      if (!category) {
        throw new Error('Category not found');
      }

      if (category.type !== 'asset') {
        throw new Error('Maintenance templates can only be linked to asset categories');
      }
    }

    const { data, error } = await supabase
      .from('maintenance_templates')
      .insert({
        category_id: parsedInput.category_id ?? null,
        name:        parsedInput.name,
        description: parsedInput.description ?? null,
        checklist:   parsedInput.checklist,
        is_active:   true,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance/templates');
    return { success: true, templateId: data.id };
  });

// ============================================================================
// updateTemplate — ga_lead or admin only
// Templates can be freely edited per CONTEXT.md:
//   "future auto-generated PM jobs use the latest version;
//    completed jobs keep their original checklist"
// ============================================================================

export const updateTemplate = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: templateEditSchema }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('Only GA Lead or Admin can update maintenance templates');
    }

    // Verify template exists
    const { data: existing } = await supabase
      .from('maintenance_templates')
      .select('id')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Template not found');
    }

    // Validate that new category_id references an 'asset' type category
    // Skip validation when category_id is null (general template)
    if (parsedInput.data.category_id) {
      const { data: category } = await supabase
        .from('categories')
        .select('id, type')
        .eq('id', parsedInput.data.category_id)
        .is('deleted_at', null)
        .single();

      if (!category) {
        throw new Error('Category not found');
      }

      if (category.type !== 'asset') {
        throw new Error('Maintenance templates can only be linked to asset categories');
      }
    }

    const { error } = await supabase
      .from('maintenance_templates')
      .update({
        name:        parsedInput.data.name,
        description: parsedInput.data.description ?? null,
        category_id: parsedInput.data.category_id ?? null,
        checklist:   parsedInput.data.checklist,
      })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance/templates');
    revalidatePath(`/maintenance/templates/${parsedInput.id}`);
    return { success: true };
  });

// ============================================================================
// deactivateTemplate — ga_lead or admin only
// Sets is_active = false. Per CONTEXT.md: "Templates can be deactivated but not
// deleted; prevents orphaned schedules."
// Guard: cannot deactivate if active (non-deleted, is_active=true) schedules exist.
// ============================================================================

export const deactivateTemplate = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('Only GA Lead or Admin can deactivate maintenance templates');
    }

    // Verify template exists
    const { data: existing } = await supabase
      .from('maintenance_templates')
      .select('id, is_active')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Template not found');
    }

    if (!existing.is_active) {
      throw new Error('Template is already deactivated');
    }

    // Check for active schedules referencing this template
    const { count: activeScheduleCount } = await supabase
      .from('maintenance_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', parsedInput.id)
      .eq('is_active', true)
      .is('deleted_at', null);

    if ((activeScheduleCount ?? 0) > 0) {
      throw new Error(
        `Cannot deactivate — ${activeScheduleCount} active schedule(s) reference this template. Deactivate or delete those schedules first.`
      );
    }

    const { error } = await supabase
      .from('maintenance_templates')
      .update({ is_active: false })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance/templates');
    return { success: true };
  });

// ============================================================================
// reactivateTemplate — ga_lead or admin only
// Sets is_active = true
// ============================================================================

export const reactivateTemplate = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionOk> => {
    const { supabase, profile } = ctx;

    // Role check
    if (!(LEAD_ROLES as readonly string[]).includes(profile.role)) {
      throw new Error('Only GA Lead or Admin can reactivate maintenance templates');
    }

    // Verify template exists
    const { data: existing } = await supabase
      .from('maintenance_templates')
      .select('id, is_active')
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      throw new Error('Template not found');
    }

    if (existing.is_active) {
      throw new Error('Template is already active');
    }

    const { error } = await supabase
      .from('maintenance_templates')
      .update({ is_active: true })
      .eq('id', parsedInput.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/maintenance/templates');
    return { success: true };
  });

// ============================================================================
// getTemplates — all global templates (shared across companies)
// Sorted by name. Includes category name and computed item_count.
// ============================================================================

export const getTemplates = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }): Promise<ActionResponse<{ templates: TemplateListItem[] }>> => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from('maintenance_templates')
      .select(`
        id,
        company_id,
        category_id,
        name,
        description,
        checklist,
        is_active,
        deleted_at,
        created_at,
        updated_at,
        category:categories(name, type)
      `)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    // Compute item_count from JSONB checklist array length
    const templates = (data ?? []).map((t) => ({
      ...t,
      checklist: (t.checklist ?? []) as import('@/lib/types/maintenance').ChecklistItem[],
      item_count: Array.isArray(t.checklist) ? t.checklist.length : 0,
      category: Array.isArray(t.category) ? t.category[0] ?? null : t.category ?? null,
    }));

    return { success: true, templates };
  });

// ============================================================================
// getTemplateById — single template with category join
// ============================================================================

export const getTemplateById = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }): Promise<ActionResponse<{ template: TemplateListItem }>> => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from('maintenance_templates')
      .select(`
        id,
        company_id,
        category_id,
        name,
        description,
        checklist,
        is_active,
        deleted_at,
        created_at,
        updated_at,
        category:categories(name, type)
      `)
      .eq('id', parsedInput.id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new Error('Template not found');
    }

    const template = {
      ...data,
      checklist: (data.checklist ?? []) as import('@/lib/types/maintenance').ChecklistItem[],
      item_count: Array.isArray(data.checklist) ? data.checklist.length : 0,
      category: Array.isArray(data.category) ? data.category[0] ?? null : data.category ?? null,
    };

    return { success: true, template };
  });
