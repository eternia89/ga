/**
 * Phase 02 — Test 10: Dashboard welcome and user info
 */
import { test, expect } from '../../fixtures';
import { DashboardPage } from '../../pages/dashboard.page';

test.describe('Phase 02 — Dashboard Welcome', () => {
  test('Test 10: Dashboard shows greeting with user name', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectGreeting(/E2E Admin/);
  });

  test('Test 10b: Role badge visible in sidebar', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');

    // Check user menu shows name and role
    const userArea = adminPage.locator('aside .border-t');
    await expect(userArea.locator('p.font-medium')).toContainText('E2E Admin');
    await expect(userArea.locator('p.text-xs')).toContainText(/admin/i);
  });

  test('Test 10c: GA Staff sees dashboard', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/');
    await gaStaffPage.waitForLoadState('networkidle');
    await expect(gaStaffPage.locator('aside')).toBeVisible();
  });
});
