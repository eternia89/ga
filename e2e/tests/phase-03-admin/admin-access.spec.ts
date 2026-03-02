/**
 * Phase 03 — Tests 1-2: Admin settings access and non-admin blocked
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';

test.describe('Phase 03 — Admin Access', () => {
  test('Test 1: Admin can access settings page', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.expectTitle();
  });

  test('Test 2: Non-admin is blocked from settings', async ({ generalUserPage }) => {
    await generalUserPage.goto('/admin/settings');
    await generalUserPage.waitForLoadState('networkidle');

    // Should redirect to unauthorized or show access denied
    const url = generalUserPage.url();
    const hasUnauthorized = url.includes('unauthorized');
    const hasAccessDenied = await generalUserPage
      .locator('text=/access denied|unauthorized|not authorized|forbidden/i')
      .isVisible();
    const wasRedirected = !url.includes('/admin/settings');

    expect(hasUnauthorized || hasAccessDenied || wasRedirected).toBeTruthy();
  });
});
