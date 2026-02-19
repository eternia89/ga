-- Phase 4: Requests - DB migration
-- Created: 2026-02-19
-- Purpose: Add cancelled status, generate_request_display_id function, and request-photos storage bucket

-- ============================================================================
-- 1. Add 'cancelled' to requests status CHECK constraint
-- ============================================================================

ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check
  CHECK (status IN ('submitted', 'triaged', 'in_progress', 'pending_approval', 'approved', 'rejected', 'completed', 'accepted', 'closed', 'cancelled'));

-- ============================================================================
-- 2. Create generate_request_display_id function (2-digit year, company-scoped)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_request_display_id(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value bigint;
  v_year_key text;
  v_company_code text;
BEGIN
  v_year_key := TO_CHAR(NOW(), 'YY');

  SELECT code INTO v_company_code
  FROM public.companies
  WHERE id = p_company_id AND deleted_at IS NULL;

  UPDATE public.id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = 'request_' || v_year_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO public.id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, 'request_' || v_year_key, COALESCE(v_company_code, 'REQ'), 1, 'yearly')
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN COALESCE(v_company_code, 'REQ') || '-' || v_year_key || '-' || LPAD(v_next_value::text, 4, '0');
END;
$$;

-- ============================================================================
-- 3. Create request-photos storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-photos',
  'request-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Storage RLS policies for request-photos bucket
-- ============================================================================

-- Authenticated users can upload to request-photos bucket
CREATE POLICY "auth_users_upload_request_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'request-photos');

-- Authenticated users can read request photos (signed URLs handle authorization)
CREATE POLICY "auth_users_read_request_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'request-photos');
