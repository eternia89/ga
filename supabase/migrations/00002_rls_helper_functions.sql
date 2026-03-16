-- Migration 00002: RLS Helper Functions and Enable RLS
-- Part A: JWT claim extraction helper functions
-- Part B: Enable RLS on all public tables

-- ============================================================================
-- Part A: RLS Helper Functions (in public schema)
-- ============================================================================
-- NOTE: Supabase managed instances don't allow creating functions in auth schema.
-- These helpers are placed in public schema and reference auth.jwt() for claims.

-- Extract company_id from JWT app_metadata
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid,
    '00000000-0000-4000-a000-000000000000'::uuid
  );
$$;

-- Extract division_id from JWT app_metadata
CREATE OR REPLACE FUNCTION public.current_user_division_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'division_id')::uuid;
$$;

-- Extract user role from JWT app_metadata
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'general_user'
  );
$$;

-- ============================================================================
-- Part B: Enable RLS on all public tables
-- ============================================================================

-- Enable RLS on all domain tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs (writes via SECURITY DEFINER trigger, reads via RLS policy)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
