-- Migration 00004: Audit Trigger Function and Attachments
-- Generic audit trigger function to capture all state changes
-- Attached to all 14 domain tables (excludes audit_logs and id_counters)

-- ============================================================================
-- Part A: Generic Audit Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS to write to audit_logs
SET search_path = public
AS $$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_changed_fields text[];
  v_record_id uuid;
  v_company_id uuid;
BEGIN
  -- Determine record ID and build JSONB
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_record_id := OLD.id;
    v_company_id := OLD.company_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
    -- Compute changed fields
    SELECT ARRAY_AGG(key) INTO v_changed_fields
    FROM jsonb_each(v_old_data) AS o(key, value)
    WHERE v_old_data->key IS DISTINCT FROM v_new_data->key;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
  END IF;

  -- Insert audit record
  INSERT INTO public.audit_logs (
    id,
    company_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email,
    performed_at
  ) VALUES (
    gen_random_uuid(),
    v_company_id,
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_old_data,
    v_new_data,
    v_changed_fields,
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'system'),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Part B: Special Audit Trigger for Companies Table
-- ============================================================================
-- Companies table has no company_id column — it IS the company

CREATE OR REPLACE FUNCTION public.audit_trigger_companies()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_changed_fields text[];
  v_record_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
    SELECT ARRAY_AGG(key) INTO v_changed_fields
    FROM jsonb_each(v_old_data) AS o(key, value)
    WHERE v_old_data->key IS DISTINCT FROM v_new_data->key;
  ELSIF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
  END IF;

  INSERT INTO public.audit_logs (
    id, company_id, table_name, record_id, operation,
    old_data, new_data, changed_fields, user_id, user_email, performed_at
  ) VALUES (
    gen_random_uuid(),
    COALESCE(NEW.id, OLD.id),  -- company IS the record
    TG_TABLE_NAME, v_record_id, TG_OP,
    v_old_data, v_new_data, v_changed_fields,
    auth.uid(), COALESCE(auth.jwt() ->> 'email', 'system'), now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Part C: Attach Triggers to Domain Tables
-- ============================================================================
-- Do NOT attach to: audit_logs (infinite recursion), id_counters (utility table)

-- Companies (uses special trigger)
CREATE TRIGGER companies_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_companies();

-- All other tables use the standard trigger
CREATE TRIGGER divisions_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER locations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER categories_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER user_profiles_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER requests_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER jobs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER job_comments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.job_comments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER inventory_items_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER inventory_movements_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER maintenance_templates_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER maintenance_schedules_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER notifications_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER media_attachments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.media_attachments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================================================
-- NOTES:
-- - SECURITY DEFINER allows trigger to bypass RLS on audit_logs table
-- - SET search_path = public prevents search_path hijacking attacks
-- - Captures: table_name, record_id, operation, old/new data, changed fields, user context
-- - 14 domain tables have triggers (all except audit_logs and id_counters)
-- ============================================================================
