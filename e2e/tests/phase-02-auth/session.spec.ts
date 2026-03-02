/**
 * Phase 02 — Test 6: Session persistence
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 02 — Session Persistence', () => {
  test('Test 6: Authenticated session persists across page loads', async ({ adminPage }) => {
    // Go to dashboard
    await adminPage.goto('/');
    await adminPage.waitForLoadState('networkidle');
    await expect(adminPage.locator('aside')).toBeVisible();

    // Reload page
    await adminPage.reload();
    await adminPage.waitForLoadState('networkidle');

    // Should still be on dashboard (not redirected to login)
    expect(adminPage.url()).not.toContain('/login');
    await expect(adminPage.locator('aside')).toBeVisible();
  });
});
