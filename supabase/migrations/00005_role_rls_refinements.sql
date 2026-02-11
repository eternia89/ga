-- Migration 00005: Role-Specific RLS Policy Refinements
-- Phase 2: Add division-scoping for general_user writes

-- ============================================================================
-- requests: general_user can only INSERT for own division
-- ============================================================================

-- Drop existing permissive insert policy
DROP POLICY IF EXISTS "requests_insert" ON public.requests;

-- General users: can only create requests for their own division
CREATE POLICY "requests_insert_general_user" ON public.requests
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND (
      public.current_user_role() != 'general_user'
      OR division_id = public.current_user_division_id()
    )
  );

-- ============================================================================
-- requests: general_user can only UPDATE own requests (by requester_id)
-- ============================================================================

DROP POLICY IF EXISTS "requests_update" ON public.requests;

-- General users: can only update their own requests
-- Elevated roles: can update any request in their company
CREATE POLICY "requests_update_role_aware" ON public.requests
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND (
      public.current_user_role() != 'general_user'
      OR requester_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id = public.current_user_company_id()
  );

-- ============================================================================
-- job_comments: all authenticated company users can comment
-- (No role restriction needed -- anyone can comment on jobs they can see)
-- Existing policy is fine, no changes needed.
-- ============================================================================

-- ============================================================================
-- user_profiles: Only admins can INSERT/UPDATE other users' profiles
-- Users can UPDATE their own profile (name, avatar, phone, notification prefs)
-- ============================================================================

DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;

-- Only admins can create new user profiles
CREATE POLICY "user_profiles_insert_admin" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  );

-- Users can update their own profile; admins can update any profile in company
CREATE POLICY "user_profiles_update_role_aware" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND (
      id = auth.uid()
      OR public.current_user_role() = 'admin'
    )
  )
  WITH CHECK (
    company_id = public.current_user_company_id()
  );

-- ============================================================================
-- Admin-only tables: companies, divisions, locations, categories
-- Only admin role can INSERT/UPDATE these configuration tables
-- ============================================================================

-- Companies
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;

CREATE POLICY "companies_insert_admin" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (
    id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  );

CREATE POLICY "companies_update_admin" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (id = public.current_user_company_id());

-- Divisions
DROP POLICY IF EXISTS "divisions_insert" ON public.divisions;
DROP POLICY IF EXISTS "divisions_update" ON public.divisions;

CREATE POLICY "divisions_insert_admin" ON public.divisions
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  );

CREATE POLICY "divisions_update_admin" ON public.divisions
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (company_id = public.current_user_company_id());

-- Locations
DROP POLICY IF EXISTS "locations_insert" ON public.locations;
DROP POLICY IF EXISTS "locations_update" ON public.locations;

CREATE POLICY "locations_insert_admin" ON public.locations
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  );

CREATE POLICY "locations_update_admin" ON public.locations
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (company_id = public.current_user_company_id());

-- Categories
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;

CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  );

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (company_id = public.current_user_company_id());
