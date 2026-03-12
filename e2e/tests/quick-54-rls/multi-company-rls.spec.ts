/**
 * quick-54 — Multi-Company RLS Isolation
 *
 * API-level Playwright tests that verify:
 * 1. A Company A user cannot SELECT rows belonging to Company B (requests, jobs, inventory_items)
 * 2. A Company A user CAN query their own company's rows without error
 * 3. A Company A user cannot INSERT rows with Company B's company_id
 *
 * These tests use the Supabase JS client directly (no browser UI).
 * The admin (service-role) client seeds Company B test data and cleans up after.
 */
import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '../../fixtures/supabase-admin';
import { getTestData } from '../../fixtures/test-data';

// ─── State shared across tests ─────────────────────────────────────────────

let companyBId: string;
let companyBCreatedByUs = false;
let companyBRequestId: string;
let companyBJobId: string;
let companyBAssetId: string;
let userBId: string;
let companyAUserClient: SupabaseClient;

const COMPANY_B_NAME = 'E2E RLS Test Company B';
const USER_B_EMAIL = 'rls-user-b@gmail.com';

// ─── Setup ─────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  const admin = getAdminClient();
  const testData = getTestData();
  const companyAId = testData.companyId;

  // 1. Find or create Company B
  const { data: existingCompany } = await admin
    .from('companies')
    .select('id')
    .eq('name', COMPANY_B_NAME)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingCompany) {
    companyBId = existingCompany.id;
    companyBCreatedByUs = false;
  } else {
    const { data: newCompany, error: companyError } = await admin
      .from('companies')
      .insert({ name: COMPANY_B_NAME })
      .select('id')
      .single();
    if (companyError) throw new Error(`Failed to create Company B: ${companyError.message}`);
    companyBId = newCompany.id;
    companyBCreatedByUs = true;
  }

  // 2. Create Company B division (required for requests)
  let divisionBId: string;
  const { data: existingDiv } = await admin
    .from('divisions')
    .select('id')
    .eq('company_id', companyBId)
    .eq('name', 'General')
    .is('deleted_at', null)
    .maybeSingle();

  if (existingDiv) {
    divisionBId = existingDiv.id;
  } else {
    const { data: newDiv, error: divError } = await admin
      .from('divisions')
      .insert({ company_id: companyBId, name: 'General' })
      .select('id')
      .single();
    if (divError) throw new Error(`Failed to create division for Company B: ${divError.message}`);
    divisionBId = newDiv.id;
  }

  // 3. Create user B (general_user in Company B) — needed as requester_id for requests
  // Always delete stale user B first (handles orphaned users from interrupted runs),
  // then create fresh to avoid race conditions with parallel workers.
  const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingUserB = usersPage?.users?.find((u) => u.email === USER_B_EMAIL);
  if (existingUserB) {
    await admin.from('user_profiles').delete().eq('id', existingUserB.id);
    await admin.auth.admin.deleteUser(existingUserB.id);
  }

  const { data: newUser, error: userError } = await admin.auth.admin.createUser({
    email: USER_B_EMAIL,
    password: 'asdf1234',
    email_confirm: true,
    app_metadata: {
      company_id: companyBId,
      role: 'general_user',
    },
  });
  if (userError) throw new Error(`Failed to create user B: ${userError.message}`);
  userBId = newUser.user.id;

  await admin.from('user_profiles').insert({
    id: userBId,
    email: USER_B_EMAIL,
    full_name: 'RLS Test User B',
    role: 'general_user',
    company_id: companyBId,
    is_active: true,
  });

  // 4. Insert one test row in requests belonging to Company B
  const { data: requestRow, error: requestError } = await admin
    .from('requests')
    .insert({
      company_id: companyBId,
      division_id: divisionBId,
      requester_id: userBId,
      display_id: `RLS-B-TST-REQ-001-${Date.now()}`,
      title: 'RLS Test Request for Company B',
      status: 'submitted',
    })
    .select('id')
    .single();
  if (requestError) throw new Error(`Failed to insert Company B request: ${requestError.message}`);
  companyBRequestId = requestRow.id;

  // 5. Insert one test row in jobs belonging to Company B
  const { data: jobRow, error: jobError } = await admin
    .from('jobs')
    .insert({
      company_id: companyBId,
      display_id: `RLS-B-TST-JOB-001-${Date.now()}`,
      title: 'RLS Test Job for Company B',
      created_by: userBId,
      status: 'created',
    })
    .select('id')
    .single();
  if (jobError) throw new Error(`Failed to insert Company B job: ${jobError.message}`);
  companyBJobId = jobRow.id;

  // 6. Insert one test row in inventory_items belonging to Company B
  const { data: assetRow, error: assetError } = await admin
    .from('inventory_items')
    .insert({
      company_id: companyBId,
      display_id: `RLS-B-TST-AST-001-${Date.now()}`,
      name: 'RLS Test Asset for Company B',
      status: 'active',
    })
    .select('id')
    .single();
  if (assetError) throw new Error(`Failed to insert Company B asset: ${assetError.message}`);
  companyBAssetId = assetRow.id;

  // 7. Create an anon-key Supabase client and sign in as Company A's ga_lead
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseAnonKey)
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

  companyAUserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const gaLead = testData.users.gaLead;
  const { error: signInError } = await companyAUserClient.auth.signInWithPassword({
    email: gaLead.email,
    password: gaLead.password,
  });
  if (signInError) throw new Error(`Failed to sign in as ga_lead: ${signInError.message}`);

  // Confirm companyAId is accessible to context
  void companyAId; // used in test 4 below
});

// ─── Cleanup ───────────────────────────────────────────────────────────────

test.afterAll(async () => {
  const admin = getAdminClient();

  // Delete test rows inserted in setup
  if (companyBRequestId) {
    await admin.from('requests').delete().eq('id', companyBRequestId);
  }
  if (companyBJobId) {
    await admin.from('jobs').delete().eq('id', companyBJobId);
  }
  if (companyBAssetId) {
    await admin.from('inventory_items').delete().eq('id', companyBAssetId);
  }

  // Delete user B
  if (userBId) {
    await admin.auth.admin.deleteUser(userBId);
    await admin.from('user_profiles').delete().eq('id', userBId);
  }

  // Delete Company B only if we created it (and it has no remaining data)
  if (companyBCreatedByUs && companyBId) {
    // Clean up divisions created for Company B
    await admin.from('divisions').delete().eq('company_id', companyBId);
    await admin.from('companies').delete().eq('id', companyBId);
  }
});

// ─── Tests ─────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.describe('quick-54 — Multi-Company RLS Isolation', () => {
  test('Test 1: Company A user cannot SELECT Company B requests', async () => {
    const { data, error } = await companyAUserClient
      .from('requests')
      .select('id')
      .eq('id', companyBRequestId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test('Test 2: Company A user cannot SELECT Company B jobs', async () => {
    const { data, error } = await companyAUserClient
      .from('jobs')
      .select('id')
      .eq('id', companyBJobId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test('Test 3: Company A user cannot SELECT Company B inventory_items', async () => {
    const { data, error } = await companyAUserClient
      .from('inventory_items')
      .select('id')
      .eq('id', companyBAssetId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test('Test 4: Company A user CAN SELECT their own company requests without error', async () => {
    const testData = getTestData();
    const { error } = await companyAUserClient
      .from('requests')
      .select('id')
      .eq('company_id', testData.companyId)
      .limit(5);

    // No RLS error — query succeeds even if result set is empty
    expect(error).toBeNull();
  });

  test('Test 5: Company A user cannot INSERT a request with Company B company_id', async () => {
    const testData = getTestData();
    const { error } = await companyAUserClient.from('requests').insert({
      company_id: companyBId,
      division_id: testData.divisions.engineering,
      requester_id: testData.users.gaLead.id,
      display_id: `RLS-CROSS-INSERT-${Date.now()}`,
      title: 'Cross-company insert attempt (should be blocked by RLS)',
      status: 'submitted',
    });

    // RLS WITH CHECK blocks cross-company inserts
    expect(error).not.toBeNull();
  });
});
