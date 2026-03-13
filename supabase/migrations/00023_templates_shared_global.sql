-- ============================================================================
-- Migration 00023: Make maintenance_templates a shared/global resource
-- Purpose: Templates are reusable checklists that should be visible across
--          all companies. Remove company scoping from RLS.
-- ============================================================================

-- 1. Make company_id nullable (templates are global, no company ownership)
ALTER TABLE public.maintenance_templates ALTER COLUMN company_id DROP NOT NULL;

-- 2. Drop ALL existing RLS policies on maintenance_templates
DROP POLICY IF EXISTS "maintenance_templates_select" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_select_policy" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_insert" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_insert_ga_lead" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update_ga_lead" ON public.maintenance_templates;

-- 3. Create new policies

-- SELECT: All authenticated users can read all non-deleted templates (global)
CREATE POLICY "maintenance_templates_select_global" ON public.maintenance_templates
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: Only ga_lead/admin roles, no company check
CREATE POLICY "maintenance_templates_insert_role" ON public.maintenance_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('ga_lead', 'admin')
  );

-- UPDATE: Only ga_lead/admin roles, no company check
CREATE POLICY "maintenance_templates_update_role" ON public.maintenance_templates
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('ga_lead', 'admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('ga_lead', 'admin')
  );

-- 4. Set existing templates' company_id to NULL (clean up legacy data)
UPDATE public.maintenance_templates SET company_id = NULL WHERE company_id IS NOT NULL;
