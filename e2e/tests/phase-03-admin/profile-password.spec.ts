/**
 * Phase 03 — Tests 19-21: Profile modal and password change
 */
import { test, expect } from '../../fixtures';
import { UserMenuPage } from '../../pages/user-menu.page';
import { ProfileDialogPage } from '../../pages/profile-dialog.page';

test.describe('Phase 03 — Profile & Password', () => {
  test('Test 19: Profile modal opens from user menu', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    const menu = new UserMenuPage(adminPage);
    const profile = new ProfileDialogPage(adminPage);

    await menu.open();
    await menu.clickProfile();

    await profile.expectOpen();
    await profile.expectUserInfo(/E2E Admin/);
  });

  test('Test 20: Password change — wrong current password shows error', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    const menu = new UserMenuPage(adminPage);
    const profile = new ProfileDialogPage(adminPage);

    await menu.open();
    await menu.clickProfile();
    await profile.expectOpen();

    await profile.fillPasswordChange('wrongpassword', 'NewPass!123', 'NewPass!123');
    await profile.submitPasswordChange();

    await profile.expectError(/incorrect|invalid|wrong/i);
  });

  test('Test 21: Password change — success', async ({ browser }) => {
    // Use a fresh context to avoid affecting other tests
    const context = await browser.newContext();
    const page = await context.newPage();
    const { getTestData } = await import('../../fixtures/test-data');
    const { getAdminClient } = await import('../../fixtures/supabase-admin');
    const data = getTestData();

    // Create a temp user for password change test
    const supabase = getAdminClient();
    const tempEmail = `pwd-test-${Date.now()}@gmail.com`;
    const tempPassword = 'asdf1234';
    const newPassword = 'NewE2ePass!2026';

    const { data: authUser } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (!authUser.user) {
      test.skip();
      await context.close();
      return;
    }

    await supabase.from('user_profiles').insert({
      id: authUser.user.id,
      email: tempEmail,
      full_name: 'Password Test User',
      role: 'general_user',
      company_id: data.companyId,
      is_active: true,
    });

    // Login
    await page.goto('/login');
    await page.fill('#email', tempEmail);
    await page.fill('#password', tempPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15_000 });

    // Open profile
    const menu = new UserMenuPage(page);
    const profile = new ProfileDialogPage(page);

    await menu.open();
    await menu.clickProfile();
    await profile.expectOpen();

    await profile.fillPasswordChange(tempPassword, newPassword, newPassword);
    await profile.submitPasswordChange();

    await profile.expectSuccess(/changed|updated|success/i);

    // Cleanup
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await context.close();
  });
});
