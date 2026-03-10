-- Seed data: dummy company, divisions, locations, categories, and users (one per role)
-- Password for all users: asdf1234
--
-- UUID convention (predictable, RFC 4122 v4 compliant):
--   Version nibble = 4 (pos 13), Variant nibble = a (pos 17)
--   Company:    00000000-0000-4000-a000-00000000000X
--   Division:   00000000-0000-4000-a001-00000000000X
--   Location:   00000000-0000-4000-a002-00000000000X
--   Category:   00000000-0000-4000-a003-00000000000X
--   User:       00000000-0000-4000-a004-00000000000X

-- ============================================================
-- 1. Company
-- ============================================================
INSERT INTO public.companies (id, name, code, address)
VALUES ('00000000-0000-4000-a000-000000000001', 'Acme Corporation', 'AC', 'Jl. Sudirman No. 1, Jakarta');

-- ============================================================
-- 2. Divisions
-- ============================================================
INSERT INTO public.divisions (id, company_id, name, code) VALUES
  ('00000000-0000-4000-a001-000000000001', '00000000-0000-4000-a000-000000000001', 'Engineering', 'ENG'),
  ('00000000-0000-4000-a001-000000000002', '00000000-0000-4000-a000-000000000001', 'Finance', 'FIN'),
  ('00000000-0000-4000-a001-000000000003', '00000000-0000-4000-a000-000000000001', 'Operations', 'OPS');

-- ============================================================
-- 3. Locations
-- ============================================================
INSERT INTO public.locations (id, company_id, name, address) VALUES
  ('00000000-0000-4000-a002-000000000001', '00000000-0000-4000-a000-000000000001', 'HQ Jakarta', 'Jl. Sudirman No. 1, Jakarta'),
  ('00000000-0000-4000-a002-000000000002', '00000000-0000-4000-a000-000000000001', 'Branch Surabaya', 'Jl. Basuki Rahmat No. 10, Surabaya'),
  ('00000000-0000-4000-a002-000000000003', '00000000-0000-4000-a000-000000000001', 'Branch Bandung', 'Jl. Asia Afrika No. 5, Bandung');

-- ============================================================
-- 4. Categories
-- ============================================================
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000001', '00000000-0000-4000-a000-000000000001', 'Electrical', 'request'),
  ('00000000-0000-4000-a003-000000000002', '00000000-0000-4000-a000-000000000001', 'Plumbing', 'request'),
  ('00000000-0000-4000-a003-000000000003', '00000000-0000-4000-a000-000000000001', 'HVAC', 'request'),
  ('00000000-0000-4000-a003-000000000004', '00000000-0000-4000-a000-000000000001', 'Furniture', 'asset'),
  ('00000000-0000-4000-a003-000000000005', '00000000-0000-4000-a000-000000000001', 'IT Equipment', 'asset'),
  ('00000000-0000-4000-a003-000000000006', '00000000-0000-4000-a000-000000000001', 'Vehicle', 'asset');

-- ============================================================
-- 5. Auth users (password: asdf1234 for all)
-- Uses a DO block so the column list is defined once (DRY).
-- If GoTrue adds new NOT-NULL columns, fix ONLY the INSERT below.
-- Each user carries role, company_id, division_id in app_metadata so RLS works after login.
-- ============================================================
DO $$
DECLARE
  _company_id text := '00000000-0000-4000-a000-000000000001';
  _users jsonb := '[
    {"id": "00000000-0000-4000-a004-000000000001", "email": "admin@acme.com",       "name": "Admin User",       "role": "admin",            "division_id": "00000000-0000-4000-a001-000000000003", "providers": ["email"]},
    {"id": "00000000-0000-4000-a004-000000000002", "email": "galead@acme.com",      "name": "GA Lead User",     "role": "ga_lead",          "division_id": "00000000-0000-4000-a001-000000000003", "providers": ["email"]},
    {"id": "00000000-0000-4000-a004-000000000003", "email": "gastaff@acme.com",     "name": "GA Staff User",    "role": "ga_staff",         "division_id": "00000000-0000-4000-a001-000000000003", "providers": ["email"]},
    {"id": "00000000-0000-4000-a004-000000000004", "email": "finance@acme.com",     "name": "Finance Approver", "role": "finance_approver", "division_id": "00000000-0000-4000-a001-000000000002", "providers": ["email"]},
    {"id": "00000000-0000-4000-a004-000000000005", "email": "user@acme.com",        "name": "General User",     "role": "general_user",     "division_id": "00000000-0000-4000-a001-000000000001", "providers": ["email"]},
    {"id": "00000000-0000-4000-a004-000000000006", "email": "hi@samuelekanata.com", "name": "Samuel Ekanata",   "role": "admin",            "division_id": "00000000-0000-4000-a001-000000000001", "providers": ["email", "google"]}
  ]';
  _u jsonb;
  _uid uuid;
  _email text;
  _name text;
  _provs jsonb;
  _role text;
  _division_id text;
BEGIN
  FOR _u IN SELECT * FROM jsonb_array_elements(_users)
  LOOP
    _uid         := (_u->>'id')::uuid;
    _email       := _u->>'email';
    _name        := _u->>'name';
    _provs       := _u->'providers';
    _role        := _u->>'role';
    _division_id := _u->>'division_id';

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      aud, role, created_at, updated_at,
      confirmation_token, email_change, phone_change,
      recovery_token, email_change_token_new, email_change_token_current,
      reauthentication_token, is_sso_user, is_anonymous
    ) VALUES (
      _uid,
      '00000000-0000-0000-0000-000000000000',
      _email,
      crypt('asdf1234', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', _provs,
        'role', _role,
        'company_id', _company_id,
        'division_id', _division_id
      ),
      jsonb_build_object('full_name', _name),
      'authenticated', 'authenticated', now(), now(),
      '', '', '',
      '', '', '',
      '', false, false
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      _uid,
      jsonb_build_object('sub', _uid, 'email', _email),
      'email', _uid::text,
      now(), now(), now()
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 6. User profiles
-- ============================================================
INSERT INTO public.user_profiles (id, company_id, division_id, location_id, email, full_name, role) VALUES
  ('00000000-0000-4000-a004-000000000001', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000003', '00000000-0000-4000-a002-000000000001', 'admin@acme.com',       'Admin User',       'admin'),
  ('00000000-0000-4000-a004-000000000002', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000003', '00000000-0000-4000-a002-000000000001', 'galead@acme.com',      'GA Lead User',     'ga_lead'),
  ('00000000-0000-4000-a004-000000000003', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000003', '00000000-0000-4000-a002-000000000002', 'gastaff@acme.com',     'GA Staff User',    'ga_staff'),
  ('00000000-0000-4000-a004-000000000004', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000002', '00000000-0000-4000-a002-000000000001', 'finance@acme.com',     'Finance Approver', 'finance_approver'),
  ('00000000-0000-4000-a004-000000000005', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000001', '00000000-0000-4000-a002-000000000003', 'user@acme.com',        'General User',     'general_user'),
  ('00000000-0000-4000-a004-000000000006', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000001', '00000000-0000-4000-a002-000000000001', 'hi@samuelekanata.com', 'Samuel Ekanata',   'admin');

-- ============================================================
-- 7. Company settings
-- ============================================================
INSERT INTO public.company_settings (company_id, key, value)
VALUES ('00000000-0000-4000-a000-000000000001', 'budget_approval_threshold', '5000000');
