-- Migration: Change display ID counter from numeric to alphanumeric (base-36)
-- Old: RJK-26-001 ... RJK-26-999 (max 999)
-- New: RJK-26-001 ... RJK-26-ZZZ (max 46,656)
-- Uses 0-9, A-Z charset for the 3-character suffix.

-- ============================================================================
-- 1. Helper: convert integer to base-36 string with zero-padding
-- ============================================================================

CREATE OR REPLACE FUNCTION public.to_base36(p_value bigint, p_width int DEFAULT 3)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  v_result text := '';
  v_remainder bigint;
  v_val bigint := p_value;
BEGIN
  IF v_val = 0 THEN
    v_result := '0';
  ELSE
    WHILE v_val > 0 LOOP
      v_remainder := v_val % 36;
      v_result := SUBSTR(v_chars, v_remainder::int + 1, 1) || v_result;
      v_val := v_val / 36;
    END LOOP;
  END IF;
  RETURN LPAD(v_result, p_width, '0');
END;
$$;

-- ============================================================================
-- 2. Update generate_request_display_id — use base-36 suffix
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
  v_counter_key text;
BEGIN
  v_year_key := TO_CHAR(NOW(), 'YY');

  SELECT code INTO v_company_code
  FROM companies
  WHERE id = p_company_id AND deleted_at IS NULL;

  IF v_company_code IS NULL OR v_company_code = '' THEN
    RAISE EXCEPTION 'Company code is required for display ID generation. Set a 2-character code in Admin > Companies.';
  END IF;
  IF LENGTH(v_company_code) <> 2 THEN
    RAISE EXCEPTION 'Company code must be exactly 2 characters, got: %', v_company_code;
  END IF;

  v_counter_key := 'request_' || v_year_key;

  UPDATE id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = v_counter_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, v_counter_key, 'R', 1, 'yearly')
    ON CONFLICT (company_id, entity_type)
    DO UPDATE SET current_value = id_counters.current_value + 1
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN 'R' || v_company_code || '-' || v_year_key || '-' || to_base36(v_next_value, 3);
END;
$$;

-- ============================================================================
-- 3. Update generate_job_display_id — use base-36 suffix
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_job_display_id(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value bigint;
  v_year_key text;
  v_company_code text;
  v_counter_key text;
BEGIN
  v_year_key := TO_CHAR(NOW(), 'YY');

  SELECT code INTO v_company_code
  FROM companies
  WHERE id = p_company_id AND deleted_at IS NULL;

  IF v_company_code IS NULL OR v_company_code = '' THEN
    RAISE EXCEPTION 'Company code is required for display ID generation. Set a 2-character code in Admin > Companies.';
  END IF;
  IF LENGTH(v_company_code) <> 2 THEN
    RAISE EXCEPTION 'Company code must be exactly 2 characters, got: %', v_company_code;
  END IF;

  v_counter_key := 'job_' || v_year_key;

  UPDATE id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = v_counter_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, v_counter_key, 'J', 1, 'yearly')
    ON CONFLICT (company_id, entity_type)
    DO UPDATE SET current_value = id_counters.current_value + 1
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN 'J' || v_company_code || '-' || v_year_key || '-' || to_base36(v_next_value, 3);
END;
$$;

-- ============================================================================
-- 4. Update generate_asset_display_id — use base-36 suffix
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
  v_company_code text;
  v_counter_key text;
BEGIN
  v_year_key := TO_CHAR(NOW(), 'YY');

  SELECT code INTO v_company_code
  FROM companies
  WHERE id = p_company_id AND deleted_at IS NULL;

  IF v_company_code IS NULL OR v_company_code = '' THEN
    RAISE EXCEPTION 'Company code is required for display ID generation. Set a 2-character code in Admin > Companies.';
  END IF;
  IF LENGTH(v_company_code) <> 2 THEN
    RAISE EXCEPTION 'Company code must be exactly 2 characters, got: %', v_company_code;
  END IF;

  v_counter_key := 'asset_' || v_year_key;

  UPDATE id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = v_counter_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, v_counter_key, 'I', 1, 'yearly')
    ON CONFLICT (company_id, entity_type)
    DO UPDATE SET current_value = id_counters.current_value + 1
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN 'I' || v_company_code || '-' || v_year_key || '-' || to_base36(v_next_value, 3);
END;
$$;
