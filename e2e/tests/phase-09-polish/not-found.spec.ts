/**
 * Phase 09 — 404 Not Found page
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 09 — 404 Page', () => {
  test('Invalid route shows 404 page with Go to Dashboard CTA', async ({ adminPage }) => {
    await adminPage.goto('/this-page-does-not-exist-at-all');
    await adminPage.waitForLoadState('networkidle');

    // Should show 404 content
    await expect(adminPage.getByText(/not found|404/i)).toBeVisible();

    // Should have a CTA to go back to dashboard
    const ctaLink = adminPage.getByRole('link', { name: /dashboard/i });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/');
  });
});
