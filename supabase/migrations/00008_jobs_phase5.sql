-- Phase 5: Jobs & Approvals - DB migration
-- Created: 2026-02-24
-- Purpose: Add pending_approval/pending_acceptance statuses, job approval columns,
--          request feedback columns, job_requests join table, company_settings table,
--          generate_job_display_id function, auto_accept_completed_requests cron function,
--          job-photos storage bucket, and all related RLS policies.

-- ============================================================================
-- 1. Alter jobs status CHECK constraint — add 'pending_approval'
-- ============================================================================

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('created', 'assigned', 'in_progress', 'pending_approval', 'completed', 'cancelled'));

-- ============================================================================
-- 2. Alter requests status CHECK constraint — add 'pending_acceptance'
-- ============================================================================

ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check
  CHECK (status IN ('submitted', 'triaged', 'in_progress', 'pending_approval', 'approved',
                    'rejected', 'completed', 'pending_acceptance', 'accepted', 'closed', 'cancelled'));

-- ============================================================================
-- 3. Add approval columns to jobs
-- ============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS approval_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS approval_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_rejected_by uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS approval_rejection_reason text;

-- ============================================================================
-- 4. Add feedback and acceptance columns to requests
-- ============================================================================

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS feedback_rating smallint,
  ADD COLUMN IF NOT EXISTS feedback_comment text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS acceptance_rejected_reason text;

-- ============================================================================
-- 5. Create job_requests join table — multi-request linking per job
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  request_id uuid NOT NULL REFERENCES public.requests(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  linked_at timestamptz DEFAULT now(),
  linked_by uuid REFERENCES public.user_profiles(id),
  UNIQUE (job_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_job_requests_job ON public.job_requests (job_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_request ON public.job_requests (request_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_company ON public.job_requests (company_id);

-- Enable RLS on job_requests
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

-- Company-scoped SELECT for all authenticated users
DROP POLICY IF EXISTS "job_requests_select_own_company" ON public.job_requests;
CREATE POLICY "job_requests_select_own_company" ON public.job_requests
  FOR SELECT TO authenticated
  USING (company_id = current_user_company_id());

-- INSERT restricted to ga_lead and admin roles
DROP POLICY IF EXISTS "job_requests_insert_lead_admin" ON public.job_requests;
CREATE POLICY "job_requests_insert_lead_admin" ON public.job_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = current_user_company_id()
    AND current_user_role() IN ('ga_lead', 'admin')
  );

-- DELETE restricted to ga_lead and admin roles
DROP POLICY IF EXISTS "job_requests_delete_lead_admin" ON public.job_requests;
CREATE POLICY "job_requests_delete_lead_admin" ON public.job_requests
  FOR DELETE TO authenticated
  USING (
    company_id = current_user_company_id()
    AND current_user_role() IN ('ga_lead', 'admin')
  );

-- ============================================================================
-- 6. Create company_settings table — extensible key-value settings per company
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  key text NOT NULL,
  value text NOT NULL,
  updated_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, key)
);

CREATE INDEX IF NOT EXISTS idx_company_settings_company ON public.company_settings (company_id);

-- Enable RLS on company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Company-scoped SELECT for all authenticated users
DROP POLICY IF EXISTS "company_settings_select_own_company" ON public.company_settings;
CREATE POLICY "company_settings_select_own_company" ON public.company_settings
  FOR SELECT TO authenticated
  USING (company_id = current_user_company_id());

-- INSERT restricted to admin role only
DROP POLICY IF EXISTS "company_settings_insert_admin" ON public.company_settings;
CREATE POLICY "company_settings_insert_admin" ON public.company_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = current_user_company_id()
    AND current_user_role() = 'admin'
  );

-- UPDATE restricted to admin role only
DROP POLICY IF EXISTS "company_settings_update_admin" ON public.company_settings;
CREATE POLICY "company_settings_update_admin" ON public.company_settings
  FOR UPDATE TO authenticated
  USING (
    company_id = current_user_company_id()
    AND current_user_role() = 'admin'
  );

-- Add set_updated_at trigger on company_settings
DROP TRIGGER IF EXISTS set_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER set_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. Create generate_job_display_id function (SECURITY DEFINER, same pattern as
--    generate_request_display_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_job_display_id(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value bigint;
  v_year_key text;
BEGIN
  v_year_key := TO_CHAR(NOW(), 'YY');

  UPDATE public.id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = 'job_' || v_year_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO public.id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, 'job_' || v_year_key, 'JOB', 1, 'yearly')
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN 'JOB-' || v_year_key || '-' || LPAD(v_next_value::text, 4, '0');
END;
$$;

-- ============================================================================
-- 8. Create auto_accept_completed_requests function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_accept_completed_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.requests
  SET
    status = 'accepted',
    accepted_at = now(),
    auto_accepted = true,
    updated_at = now()
  WHERE
    status = 'pending_acceptance'
    AND completed_at IS NOT NULL
    AND completed_at < now() - INTERVAL '7 days'
    AND deleted_at IS NULL;
END;
$$;

-- ============================================================================
-- pg_cron schedule (MANUAL STEP — run in Supabase SQL Editor)
-- ============================================================================
--
-- pg_cron must be enabled as an extension before this can run.
-- To enable: Supabase Dashboard → Database → Extensions → search "pg_cron" → Enable
--
-- After enabling, run this in Supabase Dashboard → SQL Editor:
--
--   SELECT cron.schedule(
--     'auto-accept-completed-requests',
--     '0 1 * * *',
--     'SELECT public.auto_accept_completed_requests()'
--   );
--
-- This schedules the auto-accept check daily at 01:00 UTC.
-- To verify: SELECT * FROM cron.job;
-- To remove: SELECT cron.unschedule('auto-accept-completed-requests');
--
-- NOTE: This line is commented out because cron.schedule will fail in a migration
-- if the pg_cron extension is not yet enabled in the Supabase Dashboard.
-- Run it manually AFTER enabling the extension.

-- ============================================================================
-- 9. Create job-photos storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('job-photos', 'job-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. Storage RLS policies for job-photos bucket
-- ============================================================================

-- Authenticated users can upload to job-photos bucket
DROP POLICY IF EXISTS "auth_users_upload_job_photos" ON storage.objects;
CREATE POLICY "auth_users_upload_job_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-photos');

-- Authenticated users can read job photos (signed URLs handle authorization)
DROP POLICY IF EXISTS "auth_users_read_job_photos" ON storage.objects;
CREATE POLICY "auth_users_read_job_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'job-photos');

-- ============================================================================
-- 11. RLS policies for job_comments (if table exists and policies are missing)
-- ============================================================================

-- Enable RLS on job_comments if not already enabled
ALTER TABLE public.job_comments ENABLE ROW LEVEL SECURITY;

-- Company-scoped SELECT for all authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'job_comments' AND policyname = 'job_comments_select_own_company'
  ) THEN
    CREATE POLICY "job_comments_select_own_company" ON public.job_comments
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.jobs
          WHERE jobs.id = job_comments.job_id
            AND jobs.company_id = current_user_company_id()
            AND jobs.deleted_at IS NULL
        )
      );
  END IF;
END;
$$;

-- INSERT restricted to ga_lead/admin OR the assigned PIC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'job_comments' AND policyname = 'job_comments_insert_lead_admin_pic'
  ) THEN
    CREATE POLICY "job_comments_insert_lead_admin_pic" ON public.job_comments
      FOR INSERT TO authenticated
      WITH CHECK (
        current_user_role() IN ('ga_lead', 'admin')
        OR auth.uid() = (
          SELECT assigned_to FROM public.jobs
          WHERE id = job_comments.job_id
            AND deleted_at IS NULL
        )
      );
  END IF;
END;
$$;
