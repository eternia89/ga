-- Phase 9: Polish & Integration - GPS Job Status Changes
-- Created: 2026-02-25
-- Purpose: Create job_status_changes table for GPS-tracked job status transitions (REQ-JOB-010)

-- ============================================================================
-- 1. Create job_status_changes table
--    Records every job status transition with GPS coordinates for accountability.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_status_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  from_status text NOT NULL,
  to_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES public.user_profiles(id),
  latitude double precision,
  longitude double precision,
  gps_accuracy double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. Indexes for efficient querying
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_job_status_changes_job_id
  ON public.job_status_changes (job_id);

CREATE INDEX IF NOT EXISTS idx_job_status_changes_company
  ON public.job_status_changes (company_id);

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.job_status_changes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS Policies
--    SELECT: authenticated users can read their company's status changes
--    INSERT: authenticated users can insert for their company
--    No UPDATE/DELETE — status changes are immutable audit records
-- ============================================================================

DROP POLICY IF EXISTS "job_status_changes_select" ON public.job_status_changes;
CREATE POLICY "job_status_changes_select"
  ON public.job_status_changes
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "job_status_changes_insert" ON public.job_status_changes;
CREATE POLICY "job_status_changes_insert"
  ON public.job_status_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());
