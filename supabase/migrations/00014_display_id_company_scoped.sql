-- Migration: Make display_id unique per company, not globally
-- The id_counters are company-scoped, so display_ids can collide across companies.

-- Jobs: drop global unique, add company-scoped unique
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_display_id_key;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_display_id_company_unique UNIQUE (company_id, display_id);

-- Requests: same fix (uses same counter pattern)
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_display_id_key;
ALTER TABLE public.requests ADD CONSTRAINT requests_display_id_company_unique UNIQUE (company_id, display_id);

-- Assets: handled in 00009_inventory_phase6.sql if constraint exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assets') THEN
    EXECUTE 'ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_display_id_key';
    EXECUTE 'ALTER TABLE public.assets ADD CONSTRAINT assets_display_id_company_unique UNIQUE (company_id, display_id)';
  END IF;
END $$;
