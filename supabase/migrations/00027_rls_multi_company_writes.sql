-- Migration 00027: Expand RLS INSERT/UPDATE policies for multi-company writes
-- Purpose: Allow users with entries in user_company_access to INSERT and UPDATE
--          entities in their granted companies, not just their primary company.
--
-- Migration 00026 expanded SELECT policies on supporting tables so cross-company
-- FK joins work. This migration completes the picture by expanding INSERT and
-- UPDATE policies on main entity tables and missed supporting tables.
--
-- Tables updated (INSERT + UPDATE): requests, jobs, inventory_items,
--   inventory_movements, media_attachments, job_comments
-- Tables updated (SELECT + INSERT): job_requests, job_status_changes

-- ============================================================================
-- 1. requests INSERT — multi-company + division check for general_user
-- ============================================================================

DROP POLICY IF EXISTS "requests_insert_general_user" ON public.requests;

CREATE POLICY "requests_insert_multi_company" ON public.requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = requests.company_id
      )
    )
    AND (
      public.current_user_role() != 'general_user'
      OR division_id = public.current_user_division_id()
    )
  );

-- ============================================================================
-- 2. requests UPDATE — multi-company + role-aware (general_user own only)
-- ============================================================================

DROP POLICY IF EXISTS "requests_update_role_aware" ON public.requests;

CREATE POLICY "requests_update_multi_company" ON public.requests
  FOR UPDATE TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = requests.company_id
      )
    )
    AND (
      public.current_user_role() != 'general_user'
      OR requester_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = requests.company_id
    )
  );

-- ============================================================================
-- 3. jobs INSERT — multi-company (no role restriction on original)
-- ============================================================================

DROP POLICY IF EXISTS "jobs_insert" ON public.jobs;

CREATE POLICY "jobs_insert_multi_company" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = jobs.company_id
    )
  );

-- ============================================================================
-- 4. jobs UPDATE — multi-company in both USING and WITH CHECK
-- ============================================================================

DROP POLICY IF EXISTS "jobs_update" ON public.jobs;

CREATE POLICY "jobs_update_multi_company" ON public.jobs
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = jobs.company_id
    )
  )
  WITH CHECK (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = jobs.company_id
    )
  );

-- ============================================================================
-- 5. inventory_items INSERT — multi-company + role restriction preserved
-- ============================================================================

DROP POLICY IF EXISTS "inventory_items_insert_ga_staff_lead_admin" ON public.inventory_items;

CREATE POLICY "inventory_items_insert_multi_company" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = inventory_items.company_id
      )
    )
    AND public.current_user_role() IN ('ga_staff', 'ga_lead', 'admin')
  );

-- ============================================================================
-- 6. inventory_items UPDATE — multi-company + role restriction preserved
-- ============================================================================

DROP POLICY IF EXISTS "inventory_items_update_ga_staff_lead_admin" ON public.inventory_items;

CREATE POLICY "inventory_items_update_multi_company" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = inventory_items.company_id
      )
    )
    AND public.current_user_role() IN ('ga_staff', 'ga_lead', 'admin')
  );

-- ============================================================================
-- 7. inventory_movements INSERT — multi-company + role restriction preserved
-- ============================================================================

DROP POLICY IF EXISTS "inventory_movements_insert_ga_staff_lead_admin" ON public.inventory_movements;

CREATE POLICY "inventory_movements_insert_multi_company" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = inventory_movements.company_id
      )
    )
    AND public.current_user_role() IN ('ga_staff', 'ga_lead', 'admin')
  );

-- ============================================================================
-- 8. inventory_movements UPDATE — multi-company + initiator/receiver/lead/admin
-- ============================================================================

DROP POLICY IF EXISTS "inventory_movements_update_initiator_receiver_lead_admin" ON public.inventory_movements;

CREATE POLICY "inventory_movements_update_multi_company" ON public.inventory_movements
  FOR UPDATE TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = inventory_movements.company_id
      )
    )
    AND (
      initiated_by = auth.uid()
      OR receiver_id = auth.uid()
      OR public.current_user_role() IN ('ga_lead', 'admin')
    )
  );

-- ============================================================================
-- 9. media_attachments INSERT — multi-company
-- ============================================================================

DROP POLICY IF EXISTS "media_attachments_insert" ON public.media_attachments;

CREATE POLICY "media_attachments_insert_multi_company" ON public.media_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = media_attachments.company_id
    )
  );

-- ============================================================================
-- 10. media_attachments UPDATE — multi-company in both USING and WITH CHECK
-- ============================================================================

DROP POLICY IF EXISTS "media_attachments_update" ON public.media_attachments;

CREATE POLICY "media_attachments_update_multi_company" ON public.media_attachments
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = media_attachments.company_id
    )
  )
  WITH CHECK (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = media_attachments.company_id
    )
  );

-- ============================================================================
-- 11. job_comments INSERT — multi-company (consolidate two policies into one)
--     Drops both: job_comments_insert (00003) and job_comments_insert_lead_admin_pic (00008)
--     Any authenticated user in the company can comment (per 00005 decision).
-- ============================================================================

DROP POLICY IF EXISTS "job_comments_insert" ON public.job_comments;
DROP POLICY IF EXISTS "job_comments_insert_lead_admin_pic" ON public.job_comments;

CREATE POLICY "job_comments_insert_multi_company" ON public.job_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = job_comments.company_id
    )
  );

-- ============================================================================
-- 12. job_requests SELECT — multi-company
-- ============================================================================

DROP POLICY IF EXISTS "job_requests_select_own_company" ON public.job_requests;

CREATE POLICY "job_requests_select_multi_company" ON public.job_requests
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = job_requests.company_id
    )
  );

-- ============================================================================
-- 13. job_requests INSERT — multi-company + role restriction preserved
-- ============================================================================

DROP POLICY IF EXISTS "job_requests_insert_lead_admin_staff" ON public.job_requests;
DROP POLICY IF EXISTS "job_requests_insert_lead_admin" ON public.job_requests;

CREATE POLICY "job_requests_insert_multi_company" ON public.job_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = job_requests.company_id
      )
    )
    AND public.current_user_role() IN ('ga_lead', 'admin', 'ga_staff')
  );

-- ============================================================================
-- 14. job_status_changes SELECT — multi-company
-- ============================================================================

DROP POLICY IF EXISTS "job_status_changes_select" ON public.job_status_changes;

CREATE POLICY "job_status_changes_select_multi_company" ON public.job_status_changes
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = job_status_changes.company_id
    )
  );

-- ============================================================================
-- 15. job_status_changes INSERT — multi-company
-- ============================================================================

DROP POLICY IF EXISTS "job_status_changes_insert" ON public.job_status_changes;

CREATE POLICY "job_status_changes_insert_multi_company" ON public.job_status_changes
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = job_status_changes.company_id
    )
  );
