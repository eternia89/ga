-- Migration: replace case-sensitive partial unique index on categories
-- with a case-insensitive one using lower(name) to close the TOCTOU race
-- condition in createCategory / updateCategory / restoreCategory.

-- Drop the old case-sensitive partial index created in 00001_initial_schema.sql.
-- The DEFERRABLE full index (categories_company_name_type_unique) remains for
-- FK deferral purposes and is unaffected.
DROP INDEX IF EXISTS public.categories_company_name_type_unique_active;

-- Create case-insensitive partial unique index.
-- Enforces: no two active categories in the same company can share
-- the same name (case-insensitively) and type.
CREATE UNIQUE INDEX categories_company_lower_name_type_unique_active
  ON public.categories (company_id, lower(name), type)
  WHERE deleted_at IS NULL;
