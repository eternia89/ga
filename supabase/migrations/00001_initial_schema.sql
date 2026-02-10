-- Initial schema migration: All 16 domain tables for GA Operations
-- Created: 2026-02-10
-- Purpose: Establish complete database schema for multi-tenant GA operations system

-- ============================================================================
-- DOMAIN TABLES (in dependency order)
-- ============================================================================

-- 1. COMPANIES (root entity, no FKs)
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  address text,
  phone text,
  email text,
  logo_url text,
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. DIVISIONS (FK to companies)
CREATE TABLE public.divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  code text,
  description text,
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT divisions_company_name_unique UNIQUE (company_id, name)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX divisions_company_name_unique_active
  ON public.divisions (company_id, name)
  WHERE deleted_at IS NULL;

-- 3. LOCATIONS (FK to companies)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT locations_company_name_unique UNIQUE (company_id, name)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX locations_company_name_unique_active
  ON public.locations (company_id, name)
  WHERE deleted_at IS NULL;

-- 4. CATEGORIES (FK to companies)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('request', 'asset')),
  description text,
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT categories_company_name_type_unique UNIQUE (company_id, name, type)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX categories_company_name_type_unique_active
  ON public.categories (company_id, name, type)
  WHERE deleted_at IS NULL;

-- 5. USER_PROFILES (FK to auth.users, companies, divisions)
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  division_id uuid REFERENCES public.divisions(id),
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  role text NOT NULL CHECK (role IN ('general_user', 'ga_staff', 'ga_lead', 'finance_approver', 'admin')) DEFAULT 'general_user',
  is_active boolean DEFAULT true,
  notification_preferences jsonb DEFAULT '{}',
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. ID_COUNTERS (FK to companies)
CREATE TABLE public.id_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  entity_type text NOT NULL,
  prefix text NOT NULL,
  current_value bigint NOT NULL DEFAULT 0,
  reset_period text CHECK (reset_period IN ('never', 'yearly', 'monthly')),
  last_reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, entity_type)
);

-- 7. REQUESTS (FK to companies, divisions, locations, categories, user_profiles)
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  division_id uuid NOT NULL REFERENCES public.divisions(id),
  location_id uuid REFERENCES public.locations(id),
  category_id uuid REFERENCES public.categories(id),
  requester_id uuid NOT NULL REFERENCES public.user_profiles(id),
  assigned_to uuid REFERENCES public.user_profiles(id),
  display_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL CHECK (status IN ('submitted', 'triaged', 'in_progress', 'pending_approval', 'approved', 'rejected', 'completed', 'accepted', 'closed')) DEFAULT 'submitted',
  estimated_cost bigint,
  actual_cost bigint,
  requires_approval boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES public.user_profiles(id),
  rejected_at timestamptz,
  rejected_by uuid REFERENCES public.user_profiles(id),
  rejection_reason text,
  completed_at timestamptz,
  accepted_at timestamptz,
  auto_accepted boolean DEFAULT false,
  feedback_rating integer CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. JOBS (FK to companies, locations, user_profiles, requests)
-- Note: maintenance_schedule_id FK will be added after maintenance_schedules table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  location_id uuid REFERENCES public.locations(id),
  display_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('created', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'created',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  job_type text CHECK (job_type IN ('request_linked', 'standalone', 'preventive_maintenance')) DEFAULT 'standalone',
  assigned_to uuid REFERENCES public.user_profiles(id),
  created_by uuid NOT NULL REFERENCES public.user_profiles(id),
  request_id uuid REFERENCES public.requests(id),
  maintenance_schedule_id uuid,
  estimated_cost bigint,
  actual_cost bigint,
  started_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. JOB_COMMENTS (FK to jobs, user_profiles, companies)
CREATE TABLE public.job_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  content text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. INVENTORY_ITEMS (FK to companies, locations, categories)
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  location_id uuid REFERENCES public.locations(id),
  category_id uuid REFERENCES public.categories(id),
  display_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('active', 'under_repair', 'broken', 'sold', 'disposed')) DEFAULT 'active',
  condition text CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  purchase_date date,
  purchase_price bigint,
  warranty_expiry date,
  invoice_url text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. INVENTORY_MOVEMENTS (FK to inventory_items, locations, user_profiles, companies)
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  from_location_id uuid REFERENCES public.locations(id),
  to_location_id uuid NOT NULL REFERENCES public.locations(id),
  initiated_by uuid NOT NULL REFERENCES public.user_profiles(id),
  received_by uuid REFERENCES public.user_profiles(id),
  status text NOT NULL CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')) DEFAULT 'pending',
  notes text,
  received_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 12. MAINTENANCE_TEMPLATES (FK to companies, categories)
CREATE TABLE public.maintenance_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  category_id uuid REFERENCES public.categories(id),
  name text NOT NULL,
  description text,
  checklist jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 13. MAINTENANCE_SCHEDULES (FK to companies, inventory_items, maintenance_templates, user_profiles)
CREATE TABLE public.maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  template_id uuid NOT NULL REFERENCES public.maintenance_templates(id),
  assigned_to uuid REFERENCES public.user_profiles(id),
  interval_days integer NOT NULL,
  interval_type text NOT NULL CHECK (interval_type IN ('fixed', 'floating')) DEFAULT 'floating',
  last_completed_at timestamptz,
  next_due_at timestamptz,
  is_paused boolean DEFAULT false,
  paused_at timestamptz,
  paused_reason text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 14. Add FK from jobs.maintenance_schedule_id -> maintenance_schedules(id)
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_maintenance_schedule_id_fkey
  FOREIGN KEY (maintenance_schedule_id) REFERENCES public.maintenance_schedules(id);

-- 15. NOTIFICATIONS (FK to user_profiles, companies)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id),
  title text NOT NULL,
  body text,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 16. AUDIT_LOGS (standalone, immutable - NO deleted_at, NO updated_at)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRANSITION')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  user_id uuid,
  user_email text,
  ip_address text,
  performed_at timestamptz DEFAULT now()
);

-- 17. MEDIA_ATTACHMENTS (polymorphic - entity_type + entity_id)
CREATE TABLE public.media_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  alt_text text,
  description text,
  sort_order integer DEFAULT 0,
  uploaded_by uuid REFERENCES public.user_profiles(id),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES (composite with company_id as leading column for multi-tenant queries)
-- ============================================================================

-- Companies
CREATE INDEX idx_companies_is_active ON public.companies (is_active) WHERE deleted_at IS NULL;

-- Divisions
CREATE INDEX idx_divisions_company ON public.divisions (company_id) WHERE deleted_at IS NULL;

-- Locations
CREATE INDEX idx_locations_company ON public.locations (company_id) WHERE deleted_at IS NULL;

-- Categories
CREATE INDEX idx_categories_company_type ON public.categories (company_id, type) WHERE deleted_at IS NULL;

-- User profiles
CREATE INDEX idx_user_profiles_company ON public.user_profiles (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_profiles_company_role ON public.user_profiles (company_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_profiles_company_division ON public.user_profiles (company_id, division_id) WHERE deleted_at IS NULL;

-- Requests
CREATE INDEX idx_requests_company_status ON public.requests (company_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_requests_company_priority ON public.requests (company_id, priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_requests_requester ON public.requests (requester_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_requests_assigned ON public.requests (assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_requests_division ON public.requests (company_id, division_id) WHERE deleted_at IS NULL;

-- Jobs
CREATE INDEX idx_jobs_company_status ON public.jobs (company_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_assigned ON public.jobs (assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_request ON public.jobs (request_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_schedule ON public.jobs (maintenance_schedule_id) WHERE deleted_at IS NULL;

-- Job comments
CREATE INDEX idx_job_comments_job ON public.job_comments (job_id) WHERE deleted_at IS NULL;

-- Inventory items
CREATE INDEX idx_inventory_company_status ON public.inventory_items (company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_company_location ON public.inventory_items (company_id, location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_company_category ON public.inventory_items (company_id, category_id) WHERE deleted_at IS NULL;

-- Inventory movements
CREATE INDEX idx_movements_item ON public.inventory_movements (item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_movements_company ON public.inventory_movements (company_id, status) WHERE deleted_at IS NULL;

-- Maintenance schedules
CREATE INDEX idx_schedules_company ON public.maintenance_schedules (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_item ON public.maintenance_schedules (item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_due ON public.maintenance_schedules (next_due_at) WHERE deleted_at IS NULL AND is_paused = false;

-- Notifications
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_company ON public.notifications (company_id) WHERE deleted_at IS NULL;

-- Audit logs (no soft delete on audit)
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_company ON public.audit_logs (company_id, performed_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs (user_id, performed_at DESC);

-- Media attachments
CREATE INDEX idx_media_entity ON public.media_attachments (entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_company ON public.media_attachments (company_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGER FUNCTION: Automatic updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach updated_at trigger to all tables with updated_at column
CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_divisions
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_locations
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_id_counters
  BEFORE UPDATE ON public.id_counters
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_requests
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_jobs
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_job_comments
  BEFORE UPDATE ON public.job_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_inventory_items
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_inventory_movements
  BEFORE UPDATE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_maintenance_templates
  BEFORE UPDATE ON public.maintenance_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_maintenance_schedules
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- FUNCTION: Generate display IDs with counter-based sequences
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_display_id(
  p_company_id uuid,
  p_entity_type text,
  p_prefix text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_value bigint;
BEGIN
  UPDATE public.id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = p_entity_type
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO public.id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, p_entity_type, p_prefix, 1, 'never')
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN p_prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_next_value::text, 4, '0');
END;
$$;
