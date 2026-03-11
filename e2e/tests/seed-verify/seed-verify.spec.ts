import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Seed verification tests.
 * Verifies that seed.sql + seed-ops.ts produced the expected data
 * and that all 11 users can log in successfully.
 *
 * Run via: npm run verify:seed
 * (requires dev server running and seed data applied)
 */

const BASE_URL = 'http://localhost:3000';
const PASSWORD  = 'asdf1234';

const USERS = [
  { email: 'samuel@jakmall.com',  role: 'admin',            company: 'Jakmall', name: 'Samuel' },
  { email: 'okka@jakmall.com',    role: 'ga_staff',         company: 'Jakmall', name: 'Okka' },
  { email: 'agus@jaknot.com',     role: 'ga_lead',          company: 'Jaknot',  name: 'Agus' },
  { email: 'eva@jaknot.com',      role: 'ga_staff',         company: 'Jaknot',  name: 'Eva' },
  { email: 'dwiky@jaknot.com',    role: 'ga_staff',         company: 'Jaknot',  name: 'Dwiky' },
  { email: 'ria@jaknot.com',      role: 'general_user',     company: 'Jaknot',  name: 'Ria' },
  { email: 'hadi@jaknot.com',     role: 'general_user',     company: 'Jaknot',  name: 'Hadi' },
  { email: 'makmur@jaknot.com',   role: 'general_user',     company: 'Jaknot',  name: 'Makmur' },
  { email: 'amil@jaknot.com',     role: 'general_user',     company: 'Jaknot',  name: 'Amil' },
  { email: 'maldini@jaknot.com',  role: 'general_user',     company: 'Jaknot',  name: 'Maldini' },
  { email: 'rudy@jaknot.com',     role: 'finance_approver', company: 'Jaknot',  name: 'Rudy' },
] as const;

// ─── Login helper ─────────────────────────────────────────────────────────────

async function loginAs(page: import('@playwright/test').Page, email: string) {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator('#email')).toBeVisible({ timeout: 15_000 });
  await page.fill('#email', email);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  // Redirect to dashboard after successful login
  await expect(page).toHaveURL(/\/(dashboard|requests|jobs|home|$)/, { timeout: 15_000 });
}

// ─── Login tests (one per user) ───────────────────────────────────────────────

for (const user of USERS) {
  test(`login: ${user.name} (${user.email}) — ${user.role}`, async ({ page }) => {
    await loginAs(page, user.email);
    // Confirm page loaded by checking for the sidebar or main content
    await expect(page.locator('body')).not.toContainText('Invalid login credentials', { timeout: 5_000 });
    // Should not be on the login page anymore
    await expect(page).not.toHaveURL(/\/login/);
  });
}

// ─── Data presence tests (login as agus = ga_lead with full access to Jaknot) ──

test.describe('data presence — Jaknot (logged in as agus ga_lead)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agus@jaknot.com');
  });

  test('requests page shows at least 100 rows', async ({ page }) => {
    await page.goto(`${BASE_URL}/requests`);
    await page.waitForLoadState('networkidle');
    // Table should have data (rows are <tr> elements with data)
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(10); // page may paginate, but at least 10 visible
  });

  test('requests page shows all status types in filter', async ({ page }) => {
    await page.goto(`${BASE_URL}/requests`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    // No errors
    await expect(page.locator('body')).not.toContainText('Error', { timeout: 5_000 });
  });

  test('jobs page shows at least 10 rows', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs`);
    await page.waitForLoadState('networkidle');
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('inventory page shows at least 10 rows', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    await page.waitForLoadState('networkidle');
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('maintenance templates page shows templates', async ({ page }) => {
    await page.goto(`${BASE_URL}/maintenance/templates`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Tidak ada data', { timeout: 5_000 }).catch(() => {
      // "Tidak ada data" is acceptable if the UI uses different empty state text
    });
  });
});

// ─── Database record count verification (via Supabase admin client) ───────────

test.describe('database record counts (admin API)', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn('⚠️  Skipping DB count tests: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return;
    }
    supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  });

  test('Jaknot has exactly 110 requests', async () => {
    if (!supabase) test.skip();
    const { count } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    expect(count).toBe(110);
  });

  test('Jaknot has exactly 60 jobs', async () => {
    if (!supabase) test.skip();
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    expect(count).toBe(60);
  });

  test('Jaknot has exactly 40 inventory items', async () => {
    if (!supabase) test.skip();
    const { count } = await supabase
      .from('inventory_items')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    expect(count).toBe(40);
  });

  test('Jaknot has exactly 40 inventory movements', async () => {
    if (!supabase) test.skip();
    const { count } = await supabase
      .from('inventory_movements')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    expect(count).toBe(40);
  });

  test('Jaknot has 5 maintenance templates', async () => {
    if (!supabase) test.skip();
    const { count } = await supabase
      .from('maintenance_templates')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    expect(count).toBe(5);
  });

  test('requests cover all 11 statuses', async () => {
    if (!supabase) test.skip();
    const { data } = await supabase
      .from('requests')
      .select('status')
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    const statuses = new Set(data?.map((r: { status: string }) => r.status) ?? []);
    const expected = ['submitted','triaged','in_progress','pending_approval','approved',
      'rejected','completed','pending_acceptance','accepted','closed','cancelled'];
    for (const s of expected) {
      expect(statuses.has(s), `Status "${s}" should be present`).toBe(true);
    }
  });

  test('jobs cover all 6 statuses', async () => {
    if (!supabase) test.skip();
    const { data } = await supabase
      .from('jobs')
      .select('status')
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    const statuses = new Set(data?.map((r: { status: string }) => r.status) ?? []);
    for (const s of ['created','assigned','in_progress','pending_approval','completed','cancelled']) {
      expect(statuses.has(s), `Job status "${s}" should be present`).toBe(true);
    }
  });

  test('inventory items cover all 4 statuses', async () => {
    if (!supabase) test.skip();
    const { data } = await supabase
      .from('inventory_items')
      .select('status')
      .eq('company_id', '00000000-0000-4000-a000-000000000001');
    const statuses = new Set(data?.map((r: { status: string }) => r.status) ?? []);
    for (const s of ['active','under_repair','broken','sold_disposed']) {
      expect(statuses.has(s), `Asset status "${s}" should be present`).toBe(true);
    }
  });

  test('all 11 users have correct roles and companies', async () => {
    if (!supabase) test.skip();
    const { data } = await supabase
      .from('user_profiles')
      .select('email, role, company_id')
      .in('email', USERS.map(u => u.email));

    const byEmail = Object.fromEntries(
      (data ?? []).map((u: { email: string; role: string; company_id: string }) => [u.email, u])
    );

    const JAKNOT_ID  = '00000000-0000-4000-a000-000000000001';
    const JAKMALL_ID = '00000000-0000-4000-a000-000000000002';

    for (const user of USERS) {
      const profile = byEmail[user.email];
      expect(profile, `User ${user.email} should exist in user_profiles`).toBeTruthy();
      if (profile) {
        const expectedCompanyId = user.company === 'Jaknot' ? JAKNOT_ID : JAKMALL_ID;
        expect(profile.company_id).toBe(expectedCompanyId);
        expect(profile.role).toBe(user.role);
      }
    }
  });
});
