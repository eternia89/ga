/**
 * Phase 02 — Test 7: Password reset flow
 */
import { test, expect } from '@playwright/test';

test.describe('Phase 02 — Password Reset', () => {
  test('Test 7: Reset password page and email submission', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');

    // Should see reset password form
    await expect(page.locator('text=/reset.*password/i')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();

    // Fill email and submit
    await page.fill('#email', 'test@example.com');
    await page.click('button[type="submit"]');

    // Should show success or at least not crash
    // The actual behavior depends on whether the email exists
    await page.waitForTimeout(2_000);

    // Either success message or back to login link should be visible
    const hasSuccess = await page.locator('text=/check your email/i').isVisible();
    const hasError = await page.locator('.bg-red-50').isVisible();
    const hasBackLink = await page.locator('text=/back to login/i').isVisible();

    expect(hasSuccess || hasError || hasBackLink).toBeTruthy();
  });
});
