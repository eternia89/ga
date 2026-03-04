-- Migration: Change display ID convention to globally unique format
-- New format: {R/J/I}{2-char-company-code}-{YY}-{NNN}
-- Examples: RJK-26-001 (request), JJK-26-002 (job), IJK-26-003 (inventory)
-- Existing display IDs are NOT retroactively changed.
--
-- Strategy: UPDATE the 3 existing functions in-place (already in PostgREST
-- schema cache) rather than creating a new unified function.

-- ============================================================================
-- 1. Update generate_request_display_id — new format R{CC}-{YY}-{NNN}
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

  RETURN 'R' || v_company_code || '-' || v_year_key || '-' || LPAD(v_next_value::text, 3, '0');
END;
$$;

-- ============================================================================
-- 2. Update generate_job_display_id — new format J{CC}-{YY}-{NNN}
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

  RETURN 'J' || v_company_code || '-' || v_year_key || '-' || LPAD(v_next_value::text, 3, '0');
END;
$$;

-- ============================================================================
-- 3. Update generate_asset_display_id — new format I{CC}-{YY}-{NNN}
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

  RETURN 'I' || v_company_code || '-' || v_year_key || '-' || LPAD(v_next_value::text, 3, '0');
END;
$$;

-- ============================================================================
-- 4. Update generate_pm_jobs() to use updated generate_job_display_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_pm_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule RECORD;
  v_display_id text;
  v_created_by uuid;
BEGIN
  FOR v_schedule IN
    SELECT
      ms.id          AS schedule_id,
      ms.company_id,
      ms.item_id,
      ms.template_id,
      ms.interval_days,
      ms.interval_type,
      ms.next_due_at,
      mt.name        AS template_name,
      mt.checklist   AS template_checklist,
      ii.name        AS asset_name
    FROM maintenance_schedules ms
    JOIN maintenance_templates mt ON mt.id = ms.template_id
    JOIN inventory_items ii ON ii.id = ms.item_id
    WHERE ms.deleted_at IS NULL
      AND ms.is_paused = false
      AND ms.is_active = true
      AND mt.is_active = true
      AND ms.next_due_at <= now()
      AND NOT EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.maintenance_schedule_id = ms.id
          AND j.deleted_at IS NULL
          AND j.status NOT IN ('completed', 'cancelled')
      )
  LOOP
    SELECT id INTO v_created_by
    FROM user_profiles
    WHERE company_id = v_schedule.company_id
      AND role = 'ga_lead'
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_created_by IS NULL THEN
      SELECT id INTO v_created_by
      FROM user_profiles
      WHERE company_id = v_schedule.company_id
        AND role = 'admin'
        AND deleted_at IS NULL
      LIMIT 1;
    END IF;

    IF v_created_by IS NULL THEN
      CONTINUE;
    END IF;

    v_display_id := generate_job_display_id(v_schedule.company_id);

    INSERT INTO jobs (
      company_id, display_id, title, job_type,
      maintenance_schedule_id, status, created_by,
      checklist_responses
    ) VALUES (
      v_schedule.company_id,
      v_display_id,
      v_schedule.template_name || ' - ' || v_schedule.asset_name,
      'preventive_maintenance',
      v_schedule.schedule_id,
      'created',
      v_created_by,
      jsonb_build_object(
        'template_name', v_schedule.template_name,
        'template_id',   v_schedule.template_id::text,
        'items',         (
          SELECT jsonb_agg(
            jsonb_build_object(
              'item_id',      (item->>'id'),
              'type',         (item->>'type'),
              'label',        (item->>'label'),
              'value',        NULL::text,
              'completed_at', NULL::text
            )
          )
          FROM jsonb_array_elements(v_schedule.template_checklist) AS item
        )
      )
    );

    IF v_schedule.interval_type = 'fixed' THEN
      UPDATE maintenance_schedules
      SET next_due_at = v_schedule.next_due_at + (v_schedule.interval_days || ' days')::interval
      WHERE id = v_schedule.schedule_id;
    END IF;

  END LOOP;
END;
$$;

-- ============================================================================
-- 5. Update unique constraints to be globally unique (not company-scoped)
-- ============================================================================

ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_display_id_company_unique;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_display_id_key;
ALTER TABLE public.requests ADD CONSTRAINT requests_display_id_key UNIQUE (display_id);

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_display_id_company_unique;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_display_id_key;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_display_id_key UNIQUE (display_id);

ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS assets_display_id_company_unique;
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_display_id_key;
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_display_id_key UNIQUE (display_id);
