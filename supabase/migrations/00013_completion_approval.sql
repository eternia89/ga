-- Migration: Add completion approval flow to jobs
-- Phase 5-10: Dual approval types (budget approval + completion approval)

-- 1. Update the jobs status CHECK constraint to include 'pending_completion_approval'
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'created',
    'assigned',
    'in_progress',
    'pending_approval',
    'pending_completion_approval',
    'completed',
    'cancelled'
  ));

-- 2. Add completion approval tracking columns to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS completion_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_approved_by uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS completion_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_rejected_by uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS completion_rejection_reason text;
