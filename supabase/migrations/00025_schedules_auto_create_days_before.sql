-- Quick 70: Add auto_create_days_before field to maintenance schedules
-- Purpose: Allow each schedule to specify how many days before the due date
--          a PM job should be automatically created (advance job creation).
--          Default 0 = create on due date (backward compatible).

-- ============================================================================
-- 1. ALTER maintenance_schedules — add auto_create_days_before column
-- ============================================================================

ALTER TABLE public.maintenance_schedules
  ADD COLUMN auto_create_days_before integer NOT NULL DEFAULT 0;

-- ============================================================================
-- 2. Recreate generate_pm_jobs() to use auto_create_days_before
--    - WHERE clause: next_due_at <= now() + (auto_create_days_before * interval '1 day')
--    - When auto_create_days_before = 0: behaves exactly as before (create on due date)
--    - When auto_create_days_before > 0: creates job X days early
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
      ms.auto_create_days_before,
      mt.name        AS template_name,
      mt.checklist   AS template_checklist,
      ii.name        AS asset_name
    FROM maintenance_schedules ms
    JOIN maintenance_templates mt ON mt.id = ms.template_id
    LEFT JOIN inventory_items ii ON ii.id = ms.item_id
    WHERE ms.deleted_at IS NULL
      AND ms.is_paused = false
      AND ms.is_active = true
      AND mt.is_active = true
      AND ms.next_due_at <= now() + (COALESCE(ms.auto_create_days_before, 0) * interval '1 day')
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

    -- Generate display ID using the existing counter-based function
    v_display_id := generate_display_id(v_schedule.company_id, 'job', 'JOB');

    -- Build checklist snapshot: template definition items with null values
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
      v_schedule.template_name || COALESCE(' - ' || v_schedule.asset_name, ''),
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
