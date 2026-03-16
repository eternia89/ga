-- Migration 00026: Expand RLS SELECT policies for multi-company access (supporting tables)
-- Purpose: Allow users with entries in user_company_access to read data from
--          their granted companies in supporting/reference tables.
--
-- Migrations 00020 and 00021 expanded SELECT policies on the main data tables
-- (requests, jobs, inventory_items, maintenance_templates, maintenance_schedules)
-- but the supporting tables that these reference via FK joins were not updated.
-- This caused cross-company FK joins (e.g., schedule → company, job → location)
-- to return NULL because RLS blocked the joined rows.
--
-- Only SELECT policies are modified. INSERT and UPDATE policies remain
-- company_id = current_user_company_id() — multi-company access is read-only.
--
-- Tables updated: companies, divisions, locations, categories, user_profiles,
--                 media_attachments, audit_logs, job_comments, inventory_movements

-- ============================================================================
-- 1. companies (uses `id` not `company_id`)
-- ============================================================================

DROP POLICY IF EXISTS "companies_select" ON public.companies;

CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT TO authenticated
  USING (
    (
      id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = companies.id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 2. divisions
-- ============================================================================

DROP POLICY IF EXISTS "divisions_select" ON public.divisions;

CREATE POLICY "divisions_select_policy" ON public.divisions
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = divisions.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 3. locations
-- ============================================================================

DROP POLICY IF EXISTS "locations_select" ON public.locations;

CREATE POLICY "locations_select_policy" ON public.locations
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = locations.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 4. categories
-- ============================================================================

DROP POLICY IF EXISTS "categories_select" ON public.categories;

CREATE POLICY "categories_select_policy" ON public.categories
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = categories.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 5. user_profiles
-- ============================================================================
-- Note: "user_profiles_select_self" (00006) remains — it allows users to see
-- their own profile even when deactivated. RLS OR-combines both policies.

DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;

CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = user_profiles.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 6. media_attachments
-- ============================================================================

DROP POLICY IF EXISTS "media_attachments_select" ON public.media_attachments;

CREATE POLICY "media_attachments_select_policy" ON public.media_attachments
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = media_attachments.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 7. audit_logs (no deleted_at column — immutable table)
-- ============================================================================

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;

CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = audit_logs.company_id
    )
  );

-- ============================================================================
-- 8. job_comments
-- ============================================================================

DROP POLICY IF EXISTS "job_comments_select" ON public.job_comments;

CREATE POLICY "job_comments_select_policy" ON public.job_comments
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = job_comments.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 9. inventory_movements
-- ============================================================================

DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;

CREATE POLICY "inventory_movements_select_policy" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = inventory_movements.company_id
      )
    )
    AND deleted_at IS NULL
  );
