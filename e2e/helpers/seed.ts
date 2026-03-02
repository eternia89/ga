import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TestData {
  companyId: string;
  divisions: { engineering: string; operations: string };
  locations: { headOffice: string; branchA: string; branchB: string };
  categories: {
    electrical: string;
    plumbing: string;
    furniture: string;
    electronics: string;
  };
  users: {
    admin: { id: string; email: string; password: string };
    gaLead: { id: string; email: string; password: string };
    gaStaff: { id: string; email: string; password: string };
    financeApprover: { id: string; email: string; password: string };
    generalUser: { id: string; email: string; password: string };
  };
}

const TEST_EMAIL_DOMAIN = 'e2e-test.local';
const TEST_PASSWORD = 'E2eTest!2026';
const E2E_COMPANY_NAME = 'E2E Test Corp';

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing Supabase URL or service role key');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Find existing row or insert a new one. Returns the row id. */
async function findOrInsert(
  supabase: SupabaseClient,
  table: string,
  match: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Promise<string> {
  // Try to find existing
  let query = supabase.from(table).select('id');
  for (const [k, v] of Object.entries(match)) {
    if (v === null) {
      query = query.is(k, null);
    } else {
      query = query.eq(k, v as string);
    }
  }
  const { data: existing } = await query.is('deleted_at', null).single();
  if (existing) return existing.id;

  // Insert new
  const { data, error } = await supabase
    .from(table)
    .insert({ ...match, ...extra })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to insert into ${table}: ${error.message}`);
  return data.id;
}

async function upsertUser(
  supabase: SupabaseClient,
  email: string,
  fullName: string,
  role: string,
  companyId: string,
  divisionId: string | null
): Promise<string> {
  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;
  if (existing) {
    userId = existing.id;
    // Update password in case it changed
    await supabase.auth.admin.updateUserById(userId, { password: TEST_PASSWORD });
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`Failed to create user ${email}: ${error.message}`);
    userId = data.user.id;
  }

  // Upsert user profile
  await supabase.from('user_profiles').upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role,
      company_id: companyId,
      division_id: divisionId,
      is_active: true,
      deleted_at: null,
    },
    { onConflict: 'id' }
  );

  return userId;
}

export async function seedTestData(): Promise<TestData> {
  const supabase = createAdminClient();

  // 1. Find or create company (no unique constraint on name — cannot upsert)
  const companyId = await findOrInsert(supabase, 'companies', { name: E2E_COMPANY_NAME });

  // 2. Find or create divisions (unique on company_id + name)
  const divisionNames = ['Engineering', 'Operations'];
  const divisionIds: Record<string, string> = {};
  for (const name of divisionNames) {
    divisionIds[name.toLowerCase()] = await findOrInsert(
      supabase, 'divisions',
      { name, company_id: companyId }
    );
  }

  // 3. Find or create locations (unique on company_id + name)
  const locationNames = ['Head Office', 'Branch A', 'Branch B'];
  const locationIds: Record<string, string> = {};
  for (const name of locationNames) {
    locationIds[name.toLowerCase().replace(/\s+/g, '')] = await findOrInsert(
      supabase, 'locations',
      { name, company_id: companyId },
      { address: `${name} Address` }
    );
  }

  // 4. Find or create categories (unique on company_id + name + type)
  const categoryDefs = [
    { name: 'Electrical', type: 'request' },
    { name: 'Plumbing', type: 'request' },
    { name: 'Furniture', type: 'asset' },
    { name: 'Electronics', type: 'asset' },
  ];
  const categoryIds: Record<string, string> = {};
  for (const cat of categoryDefs) {
    categoryIds[cat.name.toLowerCase()] = await findOrInsert(
      supabase, 'categories',
      { name: cat.name, type: cat.type, company_id: companyId }
    );
  }

  // 5. Create test users
  const userDefs = [
    { key: 'admin', email: `admin@${TEST_EMAIL_DOMAIN}`, name: 'E2E Admin', role: 'admin', divKey: 'engineering' },
    { key: 'gaLead', email: `ga-lead@${TEST_EMAIL_DOMAIN}`, name: 'E2E GA Lead', role: 'ga_lead', divKey: 'engineering' },
    { key: 'gaStaff', email: `ga-staff@${TEST_EMAIL_DOMAIN}`, name: 'E2E GA Staff', role: 'ga_staff', divKey: 'operations' },
    { key: 'financeApprover', email: `finance@${TEST_EMAIL_DOMAIN}`, name: 'E2E Finance', role: 'finance_approver', divKey: 'engineering' },
    { key: 'generalUser', email: `user@${TEST_EMAIL_DOMAIN}`, name: 'E2E User', role: 'general_user', divKey: 'operations' },
  ];

  const users: Record<string, { id: string; email: string; password: string }> = {};
  for (const def of userDefs) {
    const id = await upsertUser(
      supabase,
      def.email,
      def.name,
      def.role,
      companyId,
      divisionIds[def.divKey] || null
    );
    users[def.key] = { id, email: def.email, password: TEST_PASSWORD };
  }

  // 6. Ensure company_settings has a budget threshold (key-value table, unique on company_id + key)
  await supabase.from('company_settings').upsert(
    {
      company_id: companyId,
      key: 'budget_approval_threshold',
      value: '5000000',
    },
    { onConflict: 'company_id,key' }
  );

  const testData: TestData = {
    companyId,
    divisions: {
      engineering: divisionIds['engineering'],
      operations: divisionIds['operations'],
    },
    locations: {
      headOffice: locationIds['headoffice'],
      branchA: locationIds['brancha'],
      branchB: locationIds['branchb'],
    },
    categories: {
      electrical: categoryIds['electrical'],
      plumbing: categoryIds['plumbing'],
      furniture: categoryIds['furniture'],
      electronics: categoryIds['electronics'],
    },
    users: users as TestData['users'],
  };

  return testData;
}

export async function cleanupTestData(): Promise<void> {
  const supabase = createAdminClient();

  // Find E2E company
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('name', E2E_COMPANY_NAME)
    .single();

  if (!company) return;

  const companyId = company.id;

  // Delete all E2E test users
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('company_id', companyId)
    .like('email', `%@${TEST_EMAIL_DOMAIN}`);

  if (profiles) {
    for (const p of profiles) {
      await supabase.auth.admin.deleteUser(p.id);
    }
  }

  // Delete company data (cascading via FK)
  await supabase.from('company_settings').delete().eq('company_id', companyId);
  await supabase.from('categories').delete().eq('company_id', companyId);
  await supabase.from('locations').delete().eq('company_id', companyId);
  await supabase.from('divisions').delete().eq('company_id', companyId);
  await supabase.from('companies').delete().eq('id', companyId);
}
