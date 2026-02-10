-- Migration 00003: Baseline RLS Policies for Multi-Tenant Isolation
-- These policies enforce company-scoped access and soft-delete filtering.
-- Role-specific refinements (e.g., GA Lead sees all divisions) will be added in Phase 2.

-- ============================================================================
-- 1. companies
-- ============================================================================
-- Companies use id = current_user_company_id() (not company_id)

CREATE POLICY "companies_select" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (id = public.current_user_company_id());

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.current_user_company_id())
  WITH CHECK (id = public.current_user_company_id());

-- ============================================================================
-- 2. divisions
-- ============================================================================

CREATE POLICY "divisions_select" ON public.divisions
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "divisions_insert" ON public.divisions
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "divisions_update" ON public.divisions
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 3. locations
-- ============================================================================

CREATE POLICY "locations_select" ON public.locations
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "locations_insert" ON public.locations
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "locations_update" ON public.locations
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 4. categories
-- ============================================================================

CREATE POLICY "categories_select" ON public.categories
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 5. user_profiles
-- ============================================================================

CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 6. id_counters
-- ============================================================================
-- SELECT and UPDATE only (no direct INSERT/DELETE from client)

CREATE POLICY "id_counters_select" ON public.id_counters
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "id_counters_update" ON public.id_counters
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 7. requests
-- ============================================================================

CREATE POLICY "requests_select" ON public.requests
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "requests_insert" ON public.requests
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "requests_update" ON public.requests
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 8. jobs
-- ============================================================================

CREATE POLICY "jobs_select" ON public.jobs
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "jobs_insert" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "jobs_update" ON public.jobs
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 9. job_comments
-- ============================================================================

CREATE POLICY "job_comments_select" ON public.job_comments
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "job_comments_insert" ON public.job_comments
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "job_comments_update" ON public.job_comments
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 10. inventory_items
-- ============================================================================

CREATE POLICY "inventory_items_select" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "inventory_items_insert" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "inventory_items_update" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 11. inventory_movements
-- ============================================================================

CREATE POLICY "inventory_movements_select" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "inventory_movements_insert" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "inventory_movements_update" ON public.inventory_movements
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 12. maintenance_templates
-- ============================================================================

CREATE POLICY "maintenance_templates_select" ON public.maintenance_templates
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "maintenance_templates_insert" ON public.maintenance_templates
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "maintenance_templates_update" ON public.maintenance_templates
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 13. maintenance_schedules
-- ============================================================================

CREATE POLICY "maintenance_schedules_select" ON public.maintenance_schedules
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "maintenance_schedules_insert" ON public.maintenance_schedules
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "maintenance_schedules_update" ON public.maintenance_schedules
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 14. notifications
-- ============================================================================
-- User-scoped: user can only see/update their own notifications
-- INSERT via service_role (server-side triggers)

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: Notifications INSERT will be done via service_role (server-side triggers)
-- No INSERT policy needed for authenticated users

-- ============================================================================
-- 15. media_attachments
-- ============================================================================

CREATE POLICY "media_attachments_select" ON public.media_attachments
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "media_attachments_insert" ON public.media_attachments
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());

CREATE POLICY "media_attachments_update" ON public.media_attachments
  FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id())
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 16. audit_logs
-- ============================================================================
-- Read-only for authenticated users (admin viewer comes in Phase 9)
-- Writes happen via SECURITY DEFINER trigger (bypasses RLS)
-- NOTE: audit_logs has NO deleted_at column (immutable table)

CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

-- ============================================================================
-- NOTES:
-- - No DELETE policies = hard deletes blocked at RLS level (soft delete only)
-- - UPDATE policies omit deleted_at check to allow soft-delete operations
-- - SELECT policies include deleted_at IS NULL (except audit_logs and id_counters)
-- - service_role key bypasses RLS for server-side admin operations
-- ============================================================================
