-- Seed data: Jaknot group — companies, divisions, locations, categories, users
-- Password for all users: asdf1234
--
-- UUID convention (predictable, RFC 4122 v4 compliant):
--   Version nibble = 4 (pos 13), Variant nibble = a (pos 17)
--   Company:    00000000-0000-4000-a000-00000000000X
--   Division:   00000000-0000-4000-a001-000000000XXX
--   Location:   00000000-0000-4000-a002-000000000XXX
--   Category:   00000000-0000-4000-a003-000000000XXX
--   User:       00000000-0000-4000-a004-000000000XXX

-- ============================================================
-- 1. Companies (4)
-- ============================================================
INSERT INTO public.companies (id, name, code, address, phone, email) VALUES
  ('00000000-0000-4000-a000-000000000001', 'Jaknot',          'JN', 'Jl. Kedoya Raya No. 1, Jakarta Barat',             '+62-21-5830000', 'ga@jaknot.com'),
  ('00000000-0000-4000-a000-000000000002', 'Jakmall',         'JM', 'Jl. Kedoya Raya No. 10, Jakarta Barat',            '+62-21-5831000', 'ga@jakmall.com'),
  ('00000000-0000-4000-a000-000000000003', 'Jaknot Bandung',  'JB', 'Jl. Supratman No. 55, Bandung',                    '+62-22-7201000', 'ga@jaknot-bdg.com'),
  ('00000000-0000-4000-a000-000000000004', 'Jaknot CP',       'JC', 'Jl. Cempaka Putih Raya No. 22, Jakarta Pusat',     '+62-21-4265000', 'ga@jaknot-cp.com');

-- ============================================================
-- 2. Divisions (15 total across 4 companies)
-- ============================================================

-- Jaknot (6 divisions)
INSERT INTO public.divisions (id, company_id, name, code) VALUES
  ('00000000-0000-4000-a001-000000000001', '00000000-0000-4000-a000-000000000001', 'General Affairs',       'GA'),
  ('00000000-0000-4000-a001-000000000002', '00000000-0000-4000-a000-000000000001', 'Keuangan',              'FIN'),
  ('00000000-0000-4000-a001-000000000003', '00000000-0000-4000-a000-000000000001', 'Teknologi Informasi',   'IT'),
  ('00000000-0000-4000-a001-000000000004', '00000000-0000-4000-a000-000000000001', 'Operasional',           'OPS'),
  ('00000000-0000-4000-a001-000000000005', '00000000-0000-4000-a000-000000000001', 'Marketing',             'MKT'),
  ('00000000-0000-4000-a001-000000000006', '00000000-0000-4000-a000-000000000001', 'HR & SDM',              'HR');

-- Jakmall (5 divisions)
INSERT INTO public.divisions (id, company_id, name, code) VALUES
  ('00000000-0000-4000-a001-000000000007', '00000000-0000-4000-a000-000000000002', 'General Affairs',       'GA'),
  ('00000000-0000-4000-a001-000000000008', '00000000-0000-4000-a000-000000000002', 'Keuangan',              'FIN'),
  ('00000000-0000-4000-a001-000000000009', '00000000-0000-4000-a000-000000000002', 'Teknologi Informasi',   'IT'),
  ('00000000-0000-4000-a001-000000000010', '00000000-0000-4000-a000-000000000002', 'Operasional',           'OPS'),
  ('00000000-0000-4000-a001-000000000011', '00000000-0000-4000-a000-000000000002', 'Marketing',             'MKT');

-- Jaknot Bandung (2 divisions)
INSERT INTO public.divisions (id, company_id, name, code) VALUES
  ('00000000-0000-4000-a001-000000000012', '00000000-0000-4000-a000-000000000003', 'General Affairs',       'GA'),
  ('00000000-0000-4000-a001-000000000013', '00000000-0000-4000-a000-000000000003', 'Operasional',           'OPS');

-- Jaknot CP (2 divisions)
INSERT INTO public.divisions (id, company_id, name, code) VALUES
  ('00000000-0000-4000-a001-000000000014', '00000000-0000-4000-a000-000000000004', 'General Affairs',       'GA'),
  ('00000000-0000-4000-a001-000000000015', '00000000-0000-4000-a000-000000000004', 'Operasional',           'OPS');

-- ============================================================
-- 3. Locations (7 total across 4 companies)
-- ============================================================

-- Jaknot (3 locations)
INSERT INTO public.locations (id, company_id, name, address) VALUES
  ('00000000-0000-4000-a002-000000000001', '00000000-0000-4000-a000-000000000001', 'kedoya',           'Jl. Kedoya Raya No. 1, Jakarta Barat'),
  ('00000000-0000-4000-a002-000000000002', '00000000-0000-4000-a000-000000000001', 'GV',               'Jl. Green Ville Blok BH No. 5, Jakarta Barat'),
  ('00000000-0000-4000-a002-000000000003', '00000000-0000-4000-a000-000000000001', 'gudang 3',         'Jl. Kedoya Baru No. 30, Jakarta Barat');

-- Jakmall (1 location)
INSERT INTO public.locations (id, company_id, name, address) VALUES
  ('00000000-0000-4000-a002-000000000004', '00000000-0000-4000-a000-000000000002', 'kedoya',           'Jl. Kedoya Raya No. 10, Jakarta Barat');

-- Jaknot Bandung (2 locations)
INSERT INTO public.locations (id, company_id, name, address) VALUES
  ('00000000-0000-4000-a002-000000000005', '00000000-0000-4000-a000-000000000003', 'bandung supratman','Jl. Supratman No. 55, Bandung'),
  ('00000000-0000-4000-a002-000000000006', '00000000-0000-4000-a000-000000000003', 'bandung gateway',  'Jl. Soekarno-Hatta No. 788, Bandung');

-- Jaknot CP (1 location)
INSERT INTO public.locations (id, company_id, name, address) VALUES
  ('00000000-0000-4000-a002-000000000007', '00000000-0000-4000-a000-000000000004', 'CP',               'Jl. Cempaka Putih Raya No. 22, Jakarta Pusat');

-- ============================================================
-- 4. Categories (20 total: request + asset per company)
-- ============================================================

-- Jaknot — request categories (6)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000001', '00000000-0000-4000-a000-000000000001', 'Kelistrikan',         'request'),
  ('00000000-0000-4000-a003-000000000002', '00000000-0000-4000-a000-000000000001', 'Plumbing & Air',      'request'),
  ('00000000-0000-4000-a003-000000000003', '00000000-0000-4000-a000-000000000001', 'AC & Ventilasi',      'request'),
  ('00000000-0000-4000-a003-000000000004', '00000000-0000-4000-a000-000000000001', 'Kebersihan',          'request'),
  ('00000000-0000-4000-a003-000000000005', '00000000-0000-4000-a000-000000000001', 'Keamanan & Akses',    'request'),
  ('00000000-0000-4000-a003-000000000006', '00000000-0000-4000-a000-000000000001', 'Furniture & Interior','request');

-- Jaknot — asset categories (4)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000007', '00000000-0000-4000-a000-000000000001', 'Elektronik & IT',    'asset'),
  ('00000000-0000-4000-a003-000000000008', '00000000-0000-4000-a000-000000000001', 'Furniture',          'asset'),
  ('00000000-0000-4000-a003-000000000009', '00000000-0000-4000-a000-000000000001', 'Kendaraan',          'asset'),
  ('00000000-0000-4000-a003-000000000010', '00000000-0000-4000-a000-000000000001', 'Peralatan Kantor',   'asset');

-- Jakmall — request categories (4)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000011', '00000000-0000-4000-a000-000000000002', 'Kelistrikan',         'request'),
  ('00000000-0000-4000-a003-000000000012', '00000000-0000-4000-a000-000000000002', 'Plumbing & Air',      'request'),
  ('00000000-0000-4000-a003-000000000013', '00000000-0000-4000-a000-000000000002', 'AC & Ventilasi',      'request'),
  ('00000000-0000-4000-a003-000000000014', '00000000-0000-4000-a000-000000000002', 'Furniture & Interior','request');

-- Jakmall — asset categories (3)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000015', '00000000-0000-4000-a000-000000000002', 'Elektronik & IT',    'asset'),
  ('00000000-0000-4000-a003-000000000016', '00000000-0000-4000-a000-000000000002', 'Furniture',          'asset'),
  ('00000000-0000-4000-a003-000000000017', '00000000-0000-4000-a000-000000000002', 'Kendaraan',          'asset');

-- Jaknot Bandung — request categories (2)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000018', '00000000-0000-4000-a000-000000000003', 'Kelistrikan',         'request'),
  ('00000000-0000-4000-a003-000000000019', '00000000-0000-4000-a000-000000000003', 'AC & Ventilasi',      'request');

-- Jaknot CP — request categories (1)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000020', '00000000-0000-4000-a000-000000000004', 'Kelistrikan',         'request');

-- Jaknot — maintenance equipment asset categories (4)
INSERT INTO public.categories (id, company_id, name, type) VALUES
  ('00000000-0000-4000-a003-000000000021', '00000000-0000-4000-a000-000000000001', 'APAR & Fire Safety',    'asset'),
  ('00000000-0000-4000-a003-000000000022', '00000000-0000-4000-a000-000000000001', 'AC Split',              'asset'),
  ('00000000-0000-4000-a003-000000000023', '00000000-0000-4000-a000-000000000001', 'Genset',                'asset'),
  ('00000000-0000-4000-a003-000000000024', '00000000-0000-4000-a000-000000000001', 'Filter Air FRP',        'asset');

-- ============================================================
-- 5. Auth users (password: asdf1234 for all)
-- ============================================================
DO $$
DECLARE
  _users jsonb := '[
    {
      "id": "00000000-0000-4000-a004-000000000001",
      "email": "samuel@jakmall.com",
      "name": "Samuel",
      "role": "admin",
      "company_id": "00000000-0000-4000-a000-000000000002",
      "division_id": "00000000-0000-4000-a001-000000000007"
    },
    {
      "id": "00000000-0000-4000-a004-000000000002",
      "email": "okka@jakmall.com",
      "name": "Okka",
      "role": "ga_staff",
      "company_id": "00000000-0000-4000-a000-000000000002",
      "division_id": "00000000-0000-4000-a001-000000000007"
    },
    {
      "id": "00000000-0000-4000-a004-000000000003",
      "email": "agus@jaknot.com",
      "name": "Agus",
      "role": "ga_lead",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000001"
    },
    {
      "id": "00000000-0000-4000-a004-000000000004",
      "email": "eva@jaknot.com",
      "name": "Eva",
      "role": "ga_staff",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000001"
    },
    {
      "id": "00000000-0000-4000-a004-000000000005",
      "email": "dwiky@jaknot.com",
      "name": "Dwiky",
      "role": "ga_staff",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000001"
    },
    {
      "id": "00000000-0000-4000-a004-000000000006",
      "email": "ria@jaknot.com",
      "name": "Ria",
      "role": "general_user",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000005"
    },
    {
      "id": "00000000-0000-4000-a004-000000000007",
      "email": "hadi@jaknot.com",
      "name": "Hadi",
      "role": "general_user",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000004"
    },
    {
      "id": "00000000-0000-4000-a004-000000000008",
      "email": "makmur@jaknot.com",
      "name": "Makmur",
      "role": "general_user",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000002"
    },
    {
      "id": "00000000-0000-4000-a004-000000000009",
      "email": "amil@jaknot.com",
      "name": "Amil",
      "role": "general_user",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000006"
    },
    {
      "id": "00000000-0000-4000-a004-000000000010",
      "email": "maldini@jaknot.com",
      "name": "Maldini",
      "role": "general_user",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000003"
    },
    {
      "id": "00000000-0000-4000-a004-000000000011",
      "email": "rudy@jaknot.com",
      "name": "Rudy",
      "role": "finance_approver",
      "company_id": "00000000-0000-4000-a000-000000000001",
      "division_id": "00000000-0000-4000-a001-000000000002"
    }
  ]';
  _u jsonb;
  _uid uuid;
  _email text;
  _name text;
  _role text;
  _company_id text;
  _division_id text;
BEGIN
  FOR _u IN SELECT * FROM jsonb_array_elements(_users)
  LOOP
    _uid         := (_u->>'id')::uuid;
    _email       := _u->>'email';
    _name        := _u->>'name';
    _role        := _u->>'role';
    _company_id  := _u->>'company_id';
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
        'provider',    'email',
        'providers',   jsonb_build_array('email'),
        'role',        _role,
        'company_id',  _company_id,
        'division_id', _division_id
      ),
      jsonb_build_object('full_name', _name),
      'authenticated', 'authenticated', now(), now(),
      '', '', '', '', '', '', '', false, false
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
  -- Jakmall users
  ('00000000-0000-4000-a004-000000000001', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a001-000000000007', '00000000-0000-4000-a002-000000000004', 'samuel@jakmall.com', 'Samuel',  'admin'),
  ('00000000-0000-4000-a004-000000000002', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a001-000000000007', '00000000-0000-4000-a002-000000000004', 'okka@jakmall.com',   'Okka',    'ga_staff'),
  -- Jaknot users
  ('00000000-0000-4000-a004-000000000003', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000001', '00000000-0000-4000-a002-000000000001', 'agus@jaknot.com',    'Agus',    'ga_lead'),
  ('00000000-0000-4000-a004-000000000004', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000001', '00000000-0000-4000-a002-000000000002', 'eva@jaknot.com',     'Eva',     'ga_staff'),
  ('00000000-0000-4000-a004-000000000005', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000001', '00000000-0000-4000-a002-000000000002', 'dwiky@jaknot.com',   'Dwiky',   'ga_staff'),
  ('00000000-0000-4000-a004-000000000006', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000005', '00000000-0000-4000-a002-000000000001', 'ria@jaknot.com',     'Ria',     'general_user'),
  ('00000000-0000-4000-a004-000000000007', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000004', '00000000-0000-4000-a002-000000000002', 'hadi@jaknot.com',    'Hadi',    'general_user'),
  ('00000000-0000-4000-a004-000000000008', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000002', '00000000-0000-4000-a002-000000000001', 'makmur@jaknot.com',  'Makmur',  'general_user'),
  ('00000000-0000-4000-a004-000000000009', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000006', '00000000-0000-4000-a002-000000000002', 'amil@jaknot.com',    'Amil',    'general_user'),
  ('00000000-0000-4000-a004-000000000010', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000003', '00000000-0000-4000-a002-000000000001', 'maldini@jaknot.com', 'Maldini', 'general_user'),
  ('00000000-0000-4000-a004-000000000011', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a001-000000000002', '00000000-0000-4000-a002-000000000001', 'rudy@jaknot.com',    'Rudy',    'finance_approver');

-- ============================================================
-- 7. Company settings (budget approval threshold per company)
-- ============================================================
INSERT INTO public.company_settings (company_id, key, value) VALUES
  ('00000000-0000-4000-a000-000000000001', 'budget_approval_threshold', '10000000'),
  ('00000000-0000-4000-a000-000000000002', 'budget_approval_threshold', '5000000'),
  ('00000000-0000-4000-a000-000000000003', 'budget_approval_threshold', '5000000'),
  ('00000000-0000-4000-a000-000000000004', 'budget_approval_threshold', '5000000');

-- ============================================================
-- 8. User company access (multi-company test scenarios)
-- ============================================================
-- Eva (eva@jaknot.com, ga_staff at Jaknot) gets read access to Jakmall.
-- Test: login as eva@jaknot.com → should see both Jaknot AND Jakmall
-- requests, jobs, and assets.
--
-- Samuel (samuel@jakmall.com, admin at Jakmall) gets read access to all companies.
-- Test: login as samuel@jakmall.com → should see data from all companies.
INSERT INTO public.user_company_access (id, user_id, company_id, granted_by) VALUES
  ('00000000-0000-4000-a005-000000000001',
   '00000000-0000-4000-a004-000000000004',  -- Eva (ga_staff, Jaknot)
   '00000000-0000-4000-a000-000000000002',  -- Jakmall
   '00000000-0000-4000-a004-000000000001'), -- Granted by Samuel (admin, Jakmall)
  ('00000000-0000-4000-a005-000000000002',
   '00000000-0000-4000-a004-000000000001',  -- Samuel (admin, Jakmall)
   '00000000-0000-4000-a000-000000000001',  -- Jaknot
   '00000000-0000-4000-a004-000000000001'), -- Self-granted
  ('00000000-0000-4000-a005-000000000003',
   '00000000-0000-4000-a004-000000000001',  -- Samuel (admin, Jakmall)
   '00000000-0000-4000-a000-000000000003',  -- Jaknot Bandung
   '00000000-0000-4000-a004-000000000001'), -- Self-granted
  ('00000000-0000-4000-a005-000000000004',
   '00000000-0000-4000-a004-000000000001',  -- Samuel (admin, Jakmall)
   '00000000-0000-4000-a000-000000000004',  -- Jaknot CP
   '00000000-0000-4000-a004-000000000001'); -- Self-granted
