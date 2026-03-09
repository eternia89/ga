-- Seed data: dummy company, divisions, locations, categories, and users (one per role)
-- Password for all users: asdf1234

-- 1. Company
INSERT INTO public.companies (id, name, code, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Corporation', 'AC', 'Jl. Sudirman No. 1, Jakarta');

-- 2. Divisions
INSERT INTO public.divisions (id, company_id, name, code) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Engineering', 'ENG'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Finance', 'FIN'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Operations', 'OPS');

-- 3. Locations
INSERT INTO public.locations (id, company_id, name, address) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'HQ Jakarta', 'Jl. Sudirman No. 1, Jakarta'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Branch Surabaya', 'Jl. Basuki Rahmat No. 10, Surabaya'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Branch Bandung', 'Jl. Asia Afrika No. 5, Bandung');

-- 4. Categories
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', 'Electrical', 'request'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001', 'Plumbing', 'request'),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001', 'HVAC', 'request'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001', 'Furniture', 'asset'),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001', 'IT Equipment', 'asset'),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000001', 'Vehicle', 'asset');

-- 5. Auth users (password: asdf1234 for all)
-- The encrypted password below is bcrypt hash of 'asdf1234'

-- Admin
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  '00000000-0000-0000-0004-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@acme.com',
  crypt('asdf1234', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0004-000000000001',
  jsonb_build_object('sub', '00000000-0000-0000-0004-000000000001', 'email', 'admin@acme.com'),
  'email', '00000000-0000-0000-0004-000000000001', now(), now(), now()
);

-- GA Lead
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  '00000000-0000-0000-0004-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'galead@acme.com',
  crypt('asdf1234', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "GA Lead User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0004-000000000002',
  jsonb_build_object('sub', '00000000-0000-0000-0004-000000000002', 'email', 'galead@acme.com'),
  'email', '00000000-0000-0000-0004-000000000002', now(), now(), now()
);

-- GA Staff
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  '00000000-0000-0000-0004-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'gastaff@acme.com',
  crypt('asdf1234', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "GA Staff User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0004-000000000003',
  jsonb_build_object('sub', '00000000-0000-0000-0004-000000000003', 'email', 'gastaff@acme.com'),
  'email', '00000000-0000-0000-0004-000000000003', now(), now(), now()
);

-- Finance Approver
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  '00000000-0000-0000-0004-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'finance@acme.com',
  crypt('asdf1234', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Finance Approver"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0004-000000000004',
  jsonb_build_object('sub', '00000000-0000-0000-0004-000000000004', 'email', 'finance@acme.com'),
  'email', '00000000-0000-0000-0004-000000000004', now(), now(), now()
);

-- General User
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  '00000000-0000-0000-0004-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'user@acme.com',
  crypt('asdf1234', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "General User"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0004-000000000005',
  jsonb_build_object('sub', '00000000-0000-0000-0004-000000000005', 'email', 'user@acme.com'),
  'email', '00000000-0000-0000-0004-000000000005', now(), now(), now()
);

-- Samuel (Google OAuth user — admin role for testing)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token)
VALUES (
  '00000000-0000-0000-0004-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'hi@samuelekanata.com',
  crypt('asdf1234', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email", "google"]}',
  '{"full_name": "Samuel Ekanata"}',
  'authenticated', 'authenticated', now(), now(), ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0004-000000000006',
  jsonb_build_object('sub', '00000000-0000-0000-0004-000000000006', 'email', 'hi@samuelekanata.com'),
  'email', '00000000-0000-0000-0004-000000000006', now(), now(), now()
);

-- 6. User profiles
INSERT INTO public.user_profiles (id, company_id, division_id, location_id, email, full_name, role) VALUES
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000001', 'admin@acme.com', 'Admin User', 'admin'),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000001', 'galead@acme.com', 'GA Lead User', 'ga_lead'),
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000002', 'gastaff@acme.com', 'GA Staff User', 'ga_staff'),
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000001', 'finance@acme.com', 'Finance Approver', 'finance_approver'),
  ('00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003', 'user@acme.com', 'General User', 'general_user'),
  ('00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'hi@samuelekanata.com', 'Samuel Ekanata', 'admin');

-- 7. Company settings (budget approval threshold)
INSERT INTO public.company_settings (company_id, key, value)
VALUES ('00000000-0000-0000-0000-000000000001', 'budget_approval_threshold', '5000000');
