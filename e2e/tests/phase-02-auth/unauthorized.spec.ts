/**
 * Phase 02 — Test 15: Unauthorized page
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 02 — Unauthorized', () => {
  test('Test 15: /unauthorized shows access denied', async ({ generalUserPage }) => {
    await generalUserPage.goto('/unauthorized');
    await generalUserPage.waitForLoadState('networkidle');

    await expect(
      generalUserPage.locator('text=/access denied|unauthorized|not authorized/i')
    ).toBeVisible();
  });
});
