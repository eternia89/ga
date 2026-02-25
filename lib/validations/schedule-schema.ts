import { z } from 'zod';

// ============================================================================
// scheduleCreateSchema — maintenance schedule creation
// ============================================================================

export const scheduleCreateSchema = z.object({
  template_id:   z.string().uuid({ message: 'Template is required' }),
  item_id:       z.string().uuid({ message: 'Asset is required' }),
  interval_days: z.number().int().min(1, 'Minimum 1 day').max(365, 'Maximum 365 days'),
  interval_type: z.enum(['fixed', 'floating']).default('floating'),
  // ISO date string; if omitted defaults to now() + interval_days
  start_date:    z.string().optional(),
});

// ============================================================================
// scheduleEditSchema — interval updates (template/asset cannot change after creation)
// ============================================================================

export const scheduleEditSchema = z.object({
  interval_days: z.number().int().min(1, 'Minimum 1 day').max(365, 'Maximum 365 days'),
  interval_type: z.enum(['fixed', 'floating']),
});

// ============================================================================
// Exported types
// ============================================================================

export type ScheduleCreateFormData = z.infer<typeof scheduleCreateSchema>;
export type ScheduleEditFormData = z.infer<typeof scheduleEditSchema>;
