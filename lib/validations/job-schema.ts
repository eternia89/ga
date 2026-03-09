import { z } from 'zod';

// ============================================================================
// createJobSchema — all required fields; linked_request_ids defaults to []
// ============================================================================
export const createJobSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(150, 'Title must be under 150 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be under 1000 characters'),
  location_id: z.string().uuid({ message: 'Location is required' }),
  category_id: z.string().uuid({ message: 'Category is required' }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Priority is required' }),
  estimated_cost: z.number().min(0, 'Cost cannot be negative').optional(),
  linked_request_ids: z.array(z.string().uuid()).default([]),
});

export type CreateJobFormData = z.infer<typeof createJobSchema>;

// ============================================================================
// updateJobSchema — all fields optional except id
// ============================================================================
export const updateJobSchema = z.object({
  id: z.string().uuid(),
  title: z.string()
    .min(1, 'Title is required')
    .max(150, 'Title must be under 150 characters')
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be under 1000 characters')
    .optional(),
  location_id: z.string().uuid({ message: 'Location must be a valid ID' }).optional(),
  category_id: z.string().uuid({ message: 'Category must be a valid ID' }).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid({ message: 'PIC must be a valid user' }).optional(),
  estimated_cost: z.number().min(0, 'Cost cannot be negative').optional(),
  linked_request_ids: z.array(z.string().uuid()).optional(),
});

export type UpdateJobFormData = z.infer<typeof updateJobSchema>;

// ============================================================================
// jobCommentSchema — job_id + content; photo handled via upload API
// ============================================================================
export const jobCommentSchema = z.object({
  job_id: z.string().uuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be under 1000 characters'),
});

export type JobCommentFormData = z.infer<typeof jobCommentSchema>;

// ============================================================================
// approvalDecisionSchema — approve or reject with required reason on rejection
// ============================================================================
export const approvalDecisionSchema = z.object({
  job_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(1000, 'Reason must be under 1000 characters').optional(),
}).refine(
  (data) => data.decision === 'approved' || (data.reason && data.reason.length > 0),
  {
    message: 'Rejection reason is required',
    path: ['reason'],
  }
);

export type ApprovalDecisionFormData = z.infer<typeof approvalDecisionSchema>;

// ============================================================================
// acceptanceDecisionSchema — accept or reject completed work
// ============================================================================
export const acceptanceDecisionSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(['accepted', 'rejected']),
  reason: z.string().max(1000, 'Reason must be under 1000 characters').optional(),
}).refine(
  (data) => data.decision === 'accepted' || (data.reason && data.reason.length > 0),
  {
    message: 'Rejection reason is required',
    path: ['reason'],
  }
);

export type AcceptanceDecisionFormData = z.infer<typeof acceptanceDecisionSchema>;

// ============================================================================
// feedbackSchema — optional 1-5 star rating + optional comment after acceptance
// ============================================================================
export const feedbackSchema = z.object({
  request_id: z.string().uuid(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(200, 'Comment must be under 200 characters').optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

// ============================================================================
// companySettingsSchema — budget threshold for CEO approval gate
// ============================================================================
export const companySettingsSchema = z.object({
  budget_threshold: z.number()
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative')
    .max(999_999_999_999, 'Threshold exceeds maximum allowed value'),
});

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;
