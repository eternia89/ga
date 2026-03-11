import { z } from 'zod';

// Submit form schema — minimal fields per CONTEXT.md decision
export const requestSubmitSchema = z.object({
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be under 1000 characters'),
  location_id: z.string().uuid({ message: 'Location is required' }),
  company_id: z.string().uuid().optional(),
});

export type RequestSubmitFormData = z.infer<typeof requestSubmitSchema>;

// Edit schema — same as submit (description + location editable while New)
export const requestEditSchema = requestSubmitSchema;
export type RequestEditFormData = z.infer<typeof requestEditSchema>;

// Triage schema — all three required to move New -> Triaged
export const triageSchema = z.object({
  category_id: z.string().uuid({ message: 'Category is required' }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Priority is required' }),
  assigned_to: z.string().uuid({ message: 'PIC is required' }),
});

export type TriageFormData = z.infer<typeof triageSchema>;

// Reject schema — reason required
export const rejectSchema = z.object({
  reason: z.string()
    .min(1, 'Reason is required')
    .max(1000, 'Reason must be under 1000 characters'),
});

export type RejectFormData = z.infer<typeof rejectSchema>;
