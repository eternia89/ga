-- Migration 00020: Expand RLS SELECT policies for multi-company access
-- Purpose: Allow users with entries in user_company_access to read data from
--          their granted companies in addition to their primary company.
--
-- Only SELECT policies are modified. INSERT and UPDATE policies remain
-- company_id = current_user_company_id() — multi-company access is read-only.
--
-- Tables updated: requests, jobs, inventory_items
--
-- Pattern: primary company check OR EXISTS in user_company_access, plus
--          soft-delete filter (deleted_at IS NULL).

-- ============================================================================
-- 1. requests
-- ============================================================================

DROP POLICY IF EXISTS "requests_select" ON public.requests;

CREATE POLICY "requests_select_policy" ON public.requests
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = requests.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 2. jobs
-- ============================================================================

DROP POLICY IF EXISTS "jobs_select" ON public.jobs;

CREATE POLICY "jobs_select_policy" ON public.jobs
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = jobs.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 3. inventory_items
-- ============================================================================

DROP POLICY IF EXISTS "inventory_items_select_own_company" ON public.inventory_items;

CREATE POLICY "inventory_items_select_policy" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = inventory_items.company_id
      )
    )
    AND deleted_at IS NULL
  );
