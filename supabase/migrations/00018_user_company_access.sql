-- Migration 00018: User multi-company access
-- Grants users access to additional companies beyond their primary company_id.
-- Admin-only write path; users can SELECT their own access rows.

CREATE TABLE IF NOT EXISTS public.user_company_access (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.user_profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own access rows (needed for create dialog company selector)
CREATE POLICY "user_company_access_select_own" ON public.user_company_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all access rows (needed for user settings modal)
CREATE POLICY "user_company_access_select_admin" ON public.user_company_access
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'admin');

-- Only service role (adminActionClient) can INSERT/UPDATE/DELETE
-- No INSERT/UPDATE/DELETE policies — all writes go through service role client
