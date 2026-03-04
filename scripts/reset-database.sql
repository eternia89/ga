-- ============================================================================
-- DATABASE RESET: Wipe all data and seed with dummy accounts
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Delete all data (reverse FK order)
TRUNCATE public.media_attachments CASCADE;
TRUNCATE public.audit_logs CASCADE;
TRUNCATE public.notifications CASCADE;
TRUNCATE public.maintenance_schedules CASCADE;
TRUNCATE public.maintenance_templates CASCADE;
TRUNCATE public.inventory_movements CASCADE;
TRUNCATE public.inventory_items CASCADE;
TRUNCATE public.job_comments CASCADE;
TRUNCATE public.jobs CASCADE;
TRUNCATE public.requests CASCADE;
TRUNCATE public.id_counters CASCADE;
TRUNCATE public.company_settings CASCADE;
TRUNCATE public.user_profiles CASCADE;
TRUNCATE public.categories CASCADE;
TRUNCATE public.locations CASCADE;
TRUNCATE public.divisions CASCADE;
TRUNCATE public.companies CASCADE;

-- 2. Delete all auth users
DELETE FROM auth.users;

-- 3. Seed company (code MUST be exactly 2 chars)
INSERT INTO public.companies (id, name, code, address, phone, email)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Jaknot Group',
  'JK',
  'Jl. Sudirman No. 1, Jakarta',
  '+62 21 1234567',
  'admin@jaknot.com'
);

-- 4. Seed divisions
INSERT INTO public.divisions (id, company_id, name, code) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Head Office', 'HO'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Operations', 'OP'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Finance', 'FN');

-- 5. Seed locations
INSERT INTO public.locations (id, company_id, name, code, address) VALUES
  ('l0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Jakarta HQ', 'JKT', 'Jl. Sudirman No. 1'),
  ('l0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Surabaya Office', 'SBY', 'Jl. Basuki Rahmat No. 10'),
  ('l0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Bandung Warehouse', 'BDG', 'Jl. Asia Afrika No. 5');

-- 6. Seed categories (request type + asset type)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Electrical', 'request'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Plumbing', 'request'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'IT Equipment', 'request'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Furniture', 'asset'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Vehicle', 'asset'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Electronics', 'asset');

-- 7. Create auth users (password: Password123!)
-- Admin
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  'u0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@jaknot.com',
  crypt('Password123!', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'u0000000-0000-0000-0000-000000000001',
  'u0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'u0000000-0000-0000-0000-000000000001', 'email', 'admin@jaknot.com'),
  'email', 'u0000000-0000-0000-0000-000000000001', now(), now(), now()
);

-- GA Lead
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  'u0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'galead@jaknot.com',
  crypt('Password123!', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"GA Lead User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'u0000000-0000-0000-0000-000000000002',
  'u0000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', 'u0000000-0000-0000-0000-000000000002', 'email', 'galead@jaknot.com'),
  'email', 'u0000000-0000-0000-0000-000000000002', now(), now(), now()
);

-- GA Staff
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  'u0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'gastaff@jaknot.com',
  crypt('Password123!', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"GA Staff User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'u0000000-0000-0000-0000-000000000003',
  'u0000000-0000-0000-0000-000000000003',
  jsonb_build_object('sub', 'u0000000-0000-0000-0000-000000000003', 'email', 'gastaff@jaknot.com'),
  'email', 'u0000000-0000-0000-0000-000000000003', now(), now(), now()
);

-- Finance Approver
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  'u0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'finance@jaknot.com',
  crypt('Password123!', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Finance Approver"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'u0000000-0000-0000-0000-000000000004',
  'u0000000-0000-0000-0000-000000000004',
  jsonb_build_object('sub', 'u0000000-0000-0000-0000-000000000004', 'email', 'finance@jaknot.com'),
  'email', 'u0000000-0000-0000-0000-000000000004', now(), now(), now()
);

-- General User
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  'u0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'user@jaknot.com',
  crypt('Password123!', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"General User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  'u0000000-0000-0000-0000-000000000005',
  'u0000000-0000-0000-0000-000000000005',
  jsonb_build_object('sub', 'u0000000-0000-0000-0000-000000000005', 'email', 'user@jaknot.com'),
  'email', 'u0000000-0000-0000-0000-000000000005', now(), now(), now()
);

-- 8. Seed user_profiles (linked to auth users)
INSERT INTO public.user_profiles (id, company_id, division_id, full_name, email, role) VALUES
  ('u0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Admin User',       'admin@jaknot.com',   'admin'),
  ('u0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'GA Lead User',      'galead@jaknot.com',  'ga_lead'),
  ('u0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'GA Staff User',     'gastaff@jaknot.com', 'ga_staff'),
  ('u0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Finance Approver',  'finance@jaknot.com', 'finance_approver'),
  ('u0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'General User',      'user@jaknot.com',    'general_user');

-- Done! All accounts use password: Password123!
--
-- | Email               | Role             |
-- |---------------------|------------------|
-- | admin@jaknot.com    | admin            |
-- | galead@jaknot.com   | ga_lead          |
-- | gastaff@jaknot.com  | ga_staff         |
-- | finance@jaknot.com  | finance_approver |
-- | user@jaknot.com     | general_user     |
