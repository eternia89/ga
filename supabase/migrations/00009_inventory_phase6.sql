-- Phase 6: Inventory - DB migration
-- Created: 2026-02-25
-- Purpose: Add brand/model/serial_number/acquisition_date to inventory_items,
--          add receiver_id/rejection fields to inventory_movements, update status CHECK
--          constraints to match CONTEXT.md, create generate_asset_display_id function,
--          asset-photos and asset-invoices storage buckets with RLS, refine RLS policies,
--          and add unique partial index for concurrent transfer guard.

-- ============================================================================
-- 1. ALTER inventory_items — add new columns
-- ============================================================================

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS serial_number text,
  ADD COLUMN IF NOT EXISTS acquisition_date date;

-- ============================================================================
-- 2. ALTER inventory_items — drop old status CHECK constraint, recreate with
--    single terminal state 'sold_disposed' (merges old 'sold' and 'disposed')
-- ============================================================================

ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_status_check;
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_status_check
  CHECK (status IN ('active', 'under_repair', 'broken', 'sold_disposed'));

-- Update existing rows that may have 'sold' or 'disposed' to 'sold_disposed'
UPDATE public.inventory_items
  SET status = 'sold_disposed'
  WHERE status IN ('sold', 'disposed');

-- ============================================================================
-- 3. ALTER inventory_movements — add new columns
-- ============================================================================

ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- ============================================================================
-- 4. ALTER inventory_movements — drop old status CHECK constraint, recreate
--    with: ('pending', 'accepted', 'rejected', 'cancelled')
-- ============================================================================

ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_status_check;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));

-- Update existing rows that had 'in_transit' or 'received' to new statuses
UPDATE public.inventory_movements
  SET status = 'accepted'
  WHERE status = 'received';

UPDATE public.inventory_movements
  SET status = 'pending'
  WHERE status = 'in_transit';

-- ============================================================================
-- 5. Unique partial index — concurrent transfer guard (one pending per asset)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_movement
  ON public.inventory_movements (item_id)
  WHERE status = 'pending' AND deleted_at IS NULL;

-- ============================================================================
-- 6. Create generate_asset_display_id function (SECURITY DEFINER, same pattern
--    as generate_request_display_id — uses AST- prefix + 2-digit year)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_asset_display_id(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value bigint;
  v_year_key text;
BEGIN
  v_year_key := TO_CHAR(NOW(), 'YY');

  UPDATE public.id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = 'asset_' || v_year_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO public.id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, 'asset_' || v_year_key, 'AST', 1, 'yearly')
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN 'AST-' || v_year_key || '-' || LPAD(v_next_value::text, 4, '0');
END;
$$;

-- ============================================================================
-- 7. Create asset-photos storage bucket (private, 5MB limit, image types)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-photos',
  'asset-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. Create asset-invoices storage bucket (private, 10MB limit, image + PDF)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-invoices',
  'asset-invoices',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. Storage RLS policies for asset-photos bucket
-- ============================================================================

-- Authenticated users can upload to asset-photos bucket
CREATE POLICY "auth_users_upload_asset_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-photos');

-- Authenticated users can read asset photos (signed URLs handle authorization)
CREATE POLICY "auth_users_read_asset_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'asset-photos');

-- ============================================================================
-- 10. Storage RLS policies for asset-invoices bucket
-- ============================================================================

-- Authenticated users can upload to asset-invoices bucket
CREATE POLICY "auth_users_upload_asset_invoices" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-invoices');

-- Authenticated users can read asset invoices (signed URLs handle authorization)
CREATE POLICY "auth_users_read_asset_invoices" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'asset-invoices');

-- ============================================================================
-- 11. Enable RLS on inventory_items (if not already enabled)
-- ============================================================================

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. RLS policies on inventory_items — company-scoped SELECT (all roles),
--     INSERT/UPDATE restricted to ga_staff, ga_lead, admin
-- ============================================================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "inventory_items_select_own_company" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert_ga_staff_lead_admin" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_update_ga_staff_lead_admin" ON public.inventory_items;

-- Company-scoped SELECT for all authenticated users
CREATE POLICY "inventory_items_select_own_company" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (company_id = current_user_company_id());

-- INSERT restricted to ga_staff, ga_lead, admin
CREATE POLICY "inventory_items_insert_ga_staff_lead_admin" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = current_user_company_id()
    AND current_user_role() IN ('ga_staff', 'ga_lead', 'admin')
  );

-- UPDATE restricted to ga_staff, ga_lead, admin
CREATE POLICY "inventory_items_update_ga_staff_lead_admin" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (
    company_id = current_user_company_id()
    AND current_user_role() IN ('ga_staff', 'ga_lead', 'admin')
  );

-- ============================================================================
-- 13. Enable RLS on inventory_movements (if not already enabled)
-- ============================================================================

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. RLS policies on inventory_movements — company-scoped SELECT (all roles),
--     INSERT restricted to ga_staff, ga_lead, admin,
--     UPDATE allowed for initiator (cancel), receiver (accept/reject), or ga_lead/admin
-- ============================================================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "inventory_movements_select_own_company" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_insert_ga_staff_lead_admin" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_update_initiator_receiver_lead_admin" ON public.inventory_movements;

-- Company-scoped SELECT for all authenticated users
CREATE POLICY "inventory_movements_select_own_company" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (company_id = current_user_company_id());

-- INSERT restricted to ga_staff, ga_lead, admin
CREATE POLICY "inventory_movements_insert_ga_staff_lead_admin" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = current_user_company_id()
    AND current_user_role() IN ('ga_staff', 'ga_lead', 'admin')
  );

-- UPDATE allowed for: initiator (cancel), receiver (accept/reject), or ga_lead/admin
CREATE POLICY "inventory_movements_update_initiator_receiver_lead_admin" ON public.inventory_movements
  FOR UPDATE TO authenticated
  USING (
    company_id = current_user_company_id()
    AND (
      initiated_by = auth.uid()
      OR receiver_id = auth.uid()
      OR current_user_role() IN ('ga_lead', 'admin')
    )
  );
