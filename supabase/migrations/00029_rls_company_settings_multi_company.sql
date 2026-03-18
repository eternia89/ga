-- Migration 00029: Expand company_settings RLS for multi-company access
-- Purpose: Allow users with entries in user_company_access to SELECT, INSERT,
--          and UPDATE company_settings for their granted companies.
--
-- Without this migration, budget threshold lookups fail silently for secondary
-- company jobs (createJob uses effectiveCompanyId which may differ from primary).

-- ============================================================================
-- 1. company_settings SELECT — expand for multi-company
-- ============================================================================

DROP POLICY IF EXISTS "company_settings_select_own_company" ON public.company_settings;

CREATE POLICY "company_settings_select_multi_company" ON public.company_settings
  FOR SELECT TO authenticated
  USING (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = company_settings.company_id
    )
  );

-- ============================================================================
-- 2. company_settings INSERT — expand for multi-company (admin only)
-- ============================================================================

DROP POLICY IF EXISTS "company_settings_insert_admin" ON public.company_settings;

CREATE POLICY "company_settings_insert_multi_company" ON public.company_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = company_settings.company_id
      )
    )
    AND public.current_user_role() = 'admin'
  );

-- ============================================================================
-- 3. company_settings UPDATE — expand for multi-company (admin only)
-- ============================================================================

DROP POLICY IF EXISTS "company_settings_update_admin" ON public.company_settings;

CREATE POLICY "company_settings_update_multi_company" ON public.company_settings
  FOR UPDATE TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = company_settings.company_id
      )
    )
    AND public.current_user_role() = 'admin'
  );
