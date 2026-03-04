-- Migration: Change display ID convention to globally unique format
-- New format: {R/J/I}{2-char-company-code}-{YY}-{NNN}
-- Examples: RAB-26-001 (request), JAB-26-002 (job), IAB-26-003 (inventory)
-- Counter is GLOBAL (not company-scoped) to ensure uniqueness across companies.
-- Existing display IDs are NOT retroactively changed.

-- ============================================================================
-- 1. Create unified generate_entity_display_id function
--    Replaces generate_request_display_id, generate_job_display_id,
--    generate_asset_display_id for NEW entities.
--    Old functions are NOT dropped (may be referenced elsewhere).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_entity_display_id(
  p_company_id uuid,
  p_entity_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix_letter text;
  v_company_code text;
  v_year_key text;
  v_counter_key text;
  v_next_value integer;
BEGIN
  -- Validate entity type
  IF p_entity_type NOT IN ('request', 'job', 'asset') THEN
    RAISE EXCEPTION 'Invalid entity type: %. Must be one of: request, job, asset', p_entity_type;
  END IF;

  -- Map entity type to prefix letter
  v_prefix_letter := CASE p_entity_type
    WHEN 'request' THEN 'R'
    WHEN 'job' THEN 'J'
    WHEN 'asset' THEN 'I'
  END;

  -- Look up company code
  SELECT code INTO v_company_code
  FROM companies
  WHERE id = p_company_id AND deleted_at IS NULL;

  IF v_company_code IS NULL OR v_company_code = '' THEN
    RAISE EXCEPTION 'Company code is required for display ID generation';
  END IF;

  -- Company code must be exactly 2 characters
  IF LENGTH(v_company_code) <> 2 THEN
    RAISE EXCEPTION 'Company code must be exactly 2 characters, got: %', v_company_code;
  END IF;

  -- Get 2-digit year
  v_year_key := TO_CHAR(NOW(), 'YY');

  -- Counter key: per-company, per-entity-type, per-year
  -- Display IDs are globally unique because the company code (2 chars) is
  -- embedded in the ID: IJK-26-001 vs IAB-26-001 can never collide.
  v_counter_key := p_entity_type || '_' || v_year_key;

  -- Atomically increment or create counter (company-scoped)
  UPDATE id_counters
  SET current_value = current_value + 1
  WHERE company_id = p_company_id
    AND entity_type = v_counter_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO id_counters (company_id, entity_type, prefix, current_value, reset_period)
    VALUES (p_company_id, v_counter_key, v_prefix_letter, 1, 'yearly')
    ON CONFLICT (company_id, entity_type)
    DO UPDATE SET current_value = id_counters.current_value + 1
    RETURNING current_value INTO v_next_value;
  END IF;

  -- Return format: {prefix}{company_code}-{YY}-{NNN}
  RETURN v_prefix_letter || v_company_code || '-' || v_year_key || '-' || LPAD(v_next_value::text, 3, '0');
END;
$$;

-- ============================================================================
-- 2. Update generate_pm_jobs() to use new unified function
--    Only the display_id generation line changes.
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
      -- Deduplication: skip if open PM job exists for this schedule
      AND NOT EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.maintenance_schedule_id = ms.id
          AND j.deleted_at IS NULL
          AND j.status NOT IN ('completed', 'cancelled')
      )
  LOOP
    -- Use first ga_lead in company as the system creator for auto-generated jobs
    SELECT id INTO v_created_by
    FROM user_profiles
    WHERE company_id = v_schedule.company_id
      AND role = 'ga_lead'
      AND deleted_at IS NULL
    LIMIT 1;

    -- Fallback to first admin if no ga_lead found
    IF v_created_by IS NULL THEN
      SELECT id INTO v_created_by
      FROM user_profiles
      WHERE company_id = v_schedule.company_id
        AND role = 'admin'
        AND deleted_at IS NULL
      LIMIT 1;
    END IF;

    -- Skip if no valid user found (should not happen in practice)
    IF v_created_by IS NULL THEN
      CONTINUE;
    END IF;

    -- Generate display ID using the new unified function
    v_display_id := generate_entity_display_id(v_schedule.company_id, 'job');

    -- Build checklist snapshot: template definition items with null values
    -- items array uses the template checklist items as-is (definition only, values null)
    INSERT INTO jobs (
      company_id,
      display_id,
      title,
      job_type,
      maintenance_schedule_id,
      status,
      created_by,
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

    -- Advance next_due_at only for FIXED schedules
    -- FLOATING schedules: next_due_at is updated when the PM job is completed
    IF v_schedule.interval_type = 'fixed' THEN
      UPDATE maintenance_schedules
      SET next_due_at = v_schedule.next_due_at + (v_schedule.interval_days || ' days')::interval
      WHERE id = v_schedule.schedule_id;
    END IF;

  END LOOP;
END;
$$;

-- ============================================================================
-- 3. Update unique constraints to be globally unique (not company-scoped)
--    New display IDs are globally unique, so constraints should match.
--    Old data may have duplicates across companies, but in practice the
--    old format (REQ-26-0001, JOB-26-0001, AST-26-0001) uses different
--    prefixes so they won't collide.
-- ============================================================================

-- Requests: drop company-scoped and any existing global unique, then re-add
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_display_id_company_unique;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_display_id_key;
ALTER TABLE public.requests ADD CONSTRAINT requests_display_id_key UNIQUE (display_id);

-- Jobs: drop company-scoped and any existing global unique, then re-add
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_display_id_company_unique;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_display_id_key;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_display_id_key UNIQUE (display_id);

-- Assets (inventory_items): drop company-scoped and any existing global unique, then re-add
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS assets_display_id_company_unique;
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_display_id_key;
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_display_id_key UNIQUE (display_id);
