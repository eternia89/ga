-- Migration 00021: Expand RLS SELECT policies for multi-company access (maintenance)
-- Purpose: Allow users with entries in user_company_access to read data from
--          their granted companies in addition to their primary company.
--
-- Only SELECT policies are modified. INSERT and UPDATE policies remain
-- company_id = current_user_company_id() — multi-company access is read-only.
--
-- Tables updated: maintenance_templates, maintenance_schedules
--
-- Pattern: primary company check OR EXISTS in user_company_access, plus
--          soft-delete filter (deleted_at IS NULL).

-- ============================================================================
-- 1. maintenance_templates
-- ============================================================================

DROP POLICY IF EXISTS "maintenance_templates_select" ON public.maintenance_templates;

CREATE POLICY "maintenance_templates_select_policy" ON public.maintenance_templates
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = maintenance_templates.company_id
      )
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- 2. maintenance_schedules
-- ============================================================================

DROP POLICY IF EXISTS "maintenance_schedules_select" ON public.maintenance_schedules;

CREATE POLICY "maintenance_schedules_select_policy" ON public.maintenance_schedules
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = maintenance_schedules.company_id
      )
    )
    AND deleted_at IS NULL
  );
