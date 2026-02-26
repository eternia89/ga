-- ============================================================================
-- Migration 00012: Add category_id column to jobs table
-- ============================================================================
-- The jobs table was missing a category_id FK column that the application code
-- references. This adds the column and creates an index for efficient lookups.
-- ============================================================================

ALTER TABLE public.jobs
ADD COLUMN category_id uuid REFERENCES public.categories(id);

CREATE INDEX idx_jobs_company_category ON public.jobs (company_id, category_id) WHERE deleted_at IS NULL;
