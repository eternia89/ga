import { z } from 'zod';

// ============================================================================
// scheduleCreateSchema — maintenance schedule creation
// ============================================================================

export const scheduleCreateSchema = z.object({
  template_id:   z.string().uuid({ message: 'Template is required' }),
  item_id:       z.string().uuid().nullable().optional(),
  company_id:    z.string().uuid().optional(),
  interval_days: z.number().int().min(1, 'Minimum 1 day').max(365, 'Maximum 365 days'),
  interval_type: z.enum(['fixed', 'floating']).default('floating'),
  auto_create_days_before: z.number().int().min(0, 'Minimum 0').max(30, 'Maximum 30 days').default(0),
  // ISO date string; if omitted defaults to now() + interval_days
  start_date:    z.string().max(10).optional(),
});

// ============================================================================
// scheduleEditSchema — interval updates (template/asset cannot change after creation)
// ============================================================================

export const scheduleEditSchema = z.object({
  interval_days: z.number().int().min(1, 'Minimum 1 day').max(365, 'Maximum 365 days'),
  interval_type: z.enum(['fixed', 'floating']),
  auto_create_days_before: z.number().int().min(0, 'Minimum 0').max(30, 'Maximum 30 days'),
});

// ============================================================================
// Exported types
// ============================================================================

export type ScheduleCreateFormData = z.infer<typeof scheduleCreateSchema>;
export type ScheduleEditFormData = z.infer<typeof scheduleEditSchema>;
