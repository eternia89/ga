-- Phase 7: Preventive Maintenance - DB migration
-- Created: 2026-02-25
-- Purpose: Add checklist_responses to jobs, is_active to maintenance_schedules,
--          unique partial index for PM job deduplication, generate_pm_jobs cron function,
--          pg_cron daily schedule, and refined RLS policies for templates/schedules.

-- ============================================================================
-- 1. ALTER jobs — add checklist_responses JSONB column
--    Stores full checklist snapshot (template definition + responses) for PM jobs
--    so completed jobs are immune to template edits.
-- ============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS checklist_responses jsonb DEFAULT NULL;

-- ============================================================================
-- 2. ALTER maintenance_schedules — add is_active boolean
--    Tracks manual deactivation independently from auto-pause (is_paused) and
--    soft-delete (deleted_at). GA Lead can manually activate/deactivate schedules
--    independent of asset status auto-pause.
-- ============================================================================

ALTER TABLE public.maintenance_schedules
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- ============================================================================
-- 3. Unique partial index — prevents duplicate open PM jobs per schedule
--    Pitfall 3 mitigation: deduplication check + INSERT are both in same function
--    transaction, but this index provides an additional hard DB-level guarantee.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_schedule_open_unique
  ON public.jobs (maintenance_schedule_id)
  WHERE deleted_at IS NULL
    AND status NOT IN ('completed', 'cancelled')
    AND maintenance_schedule_id IS NOT NULL;

-- ============================================================================
-- 4. Index for overdue PM job queries
--    Optimizes queries that filter on job_type='preventive_maintenance' and status
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_jobs_pm_type
  ON public.jobs (job_type, status)
  WHERE deleted_at IS NULL AND job_type = 'preventive_maintenance';

-- ============================================================================
-- 5. generate_pm_jobs() SECURITY DEFINER function
--    Called daily by pg_cron at 00:05 UTC.
--    - Queries due schedules (deleted_at IS NULL, is_paused=false, is_active=true)
--    - Deduplication: skips if open PM job exists for same schedule_id
--    - Inserts PM job with checklist snapshot
--    - For FIXED: advances next_due_at by interval_days
--    - For FLOATING: does NOT update next_due_at (updated on job completion)
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

    -- Generate display ID using the existing counter-based function
    v_display_id := generate_display_id(v_schedule.company_id, 'job', 'JOB');

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
-- 6. Schedule generate_pm_jobs with pg_cron (daily at 00:05 UTC)
--    NOTE: pg_cron extension must be enabled in Supabase Dashboard before
--    this line can run. If extension is not enabled, comment out this line
--    and run it manually after enabling in Dashboard > Database > Extensions.
-- ============================================================================

-- SELECT cron.schedule('generate-pm-jobs', '5 0 * * *', 'SELECT generate_pm_jobs()');

-- ============================================================================
-- 7. RLS policy refinements for maintenance_templates
--    Only ga_lead and admin can INSERT/UPDATE templates
-- ============================================================================

DROP POLICY IF EXISTS "maintenance_templates_insert" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_insert_ga_lead" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update_ga_lead" ON public.maintenance_templates;

CREATE POLICY "maintenance_templates_insert_ga_lead" ON public.maintenance_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  );

CREATE POLICY "maintenance_templates_update_ga_lead" ON public.maintenance_templates
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  )
  WITH CHECK (company_id = public.current_user_company_id());

-- ============================================================================
-- 8. RLS policy refinements for maintenance_schedules
--    Only ga_lead and admin can INSERT/UPDATE schedules
-- ============================================================================

DROP POLICY IF EXISTS "maintenance_schedules_insert" ON public.maintenance_schedules;
DROP POLICY IF EXISTS "maintenance_schedules_update" ON public.maintenance_schedules;
DROP POLICY IF EXISTS "maintenance_schedules_insert_ga_lead" ON public.maintenance_schedules;
DROP POLICY IF EXISTS "maintenance_schedules_update_ga_lead" ON public.maintenance_schedules;

CREATE POLICY "maintenance_schedules_insert_ga_lead" ON public.maintenance_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  );

CREATE POLICY "maintenance_schedules_update_ga_lead" ON public.maintenance_schedules
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  )
  WITH CHECK (company_id = public.current_user_company_id());
