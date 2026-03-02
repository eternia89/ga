/**
 * Phase 02 — Tests 13-14: User menu dropdown and sign out
 */
import { test, expect } from '../../fixtures';
import { UserMenuPage } from '../../pages/user-menu.page';

test.describe('Phase 02 — User Menu', () => {
  test('Test 13: User menu dropdown opens with options', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    const menu = new UserMenuPage(adminPage);
    await menu.expectUserName('E2E Admin');
    await menu.open();
    await menu.expectDropdownVisible();
    await menu.expectProfileOption();
    await menu.expectSignOutOption();
    // Admin should see Settings link
    await menu.expectSettingsOption();
  });

  test('Test 13b: Non-admin user menu has no Settings option', async ({ generalUserPage }) => {
    await generalUserPage.goto('/');
    await generalUserPage.waitForLoadState('networkidle');

    const menu = new UserMenuPage(generalUserPage);
    await menu.open();
    await menu.expectDropdownVisible();
    await menu.expectProfileOption();
    await menu.expectSignOutOption();
    await menu.expectNoSettingsOption();
  });

  test('Test 14: Sign out redirects to login', async ({ browser }) => {
    // Use a fresh context so we don't invalidate other sessions
    const context = await browser.newContext();
    const page = await context.newPage();
    const { getTestData } = await import('../../fixtures/test-data');
    const data = getTestData();

    // Login first
    await page.goto('/login');
    await page.fill('#email', data.users.admin.email);
    await page.fill('#password', data.users.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15_000 });

    // Open menu and sign out
    const menu = new UserMenuPage(page);
    await menu.open();
    await menu.clickSignOut();

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    await context.close();
  });
});
