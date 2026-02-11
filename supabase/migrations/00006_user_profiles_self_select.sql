-- Migration 00006: Allow users to see their own profile even if deactivated
-- Fixes: deactivation check returns "no account" instead of "deactivated"
-- because the baseline SELECT policy filters deleted_at IS NULL,
-- hiding the deactivated profile from the auth callback/middleware check.

CREATE POLICY "user_profiles_select_self" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
