/**
 * Phase 02 — Test 8: Deactivated user rejected on login
 */
import { test, expect } from '@playwright/test';
import { getAdminClient } from '../../fixtures/supabase-admin';
import { getTestData } from '../../fixtures/test-data';
import { LoginPage } from '../../pages/login.page';

test.describe('Phase 02 — Deactivated User', () => {
  test('Test 8: Deactivated user cannot log in', async ({ page }) => {
    const supabase = getAdminClient();
    const data = getTestData();

    // Create a temporary user for this test
    const tempEmail = `deactivated-test-${Date.now()}@e2e-test.local`;
    const tempPassword = 'E2eTest!2026';

    const { data: authUser } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (!authUser.user) {
      test.skip();
      return;
    }

    // Create profile and then soft-delete it
    await supabase.from('user_profiles').insert({
      id: authUser.user.id,
      email: tempEmail,
      full_name: 'Deactivated Test User',
      role: 'general_user',
      company_id: data.companyId,
      is_active: true,
      deleted_at: new Date().toISOString(), // Soft-deleted
    });

    // Try to log in
    const login = new LoginPage(page);
    await login.goto();
    await login.login(tempEmail, tempPassword);

    // Should show deactivation error
    await login.expectError(/deactivated/i);

    // Cleanup
    await supabase.auth.admin.deleteUser(authUser.user.id);
  });
});
