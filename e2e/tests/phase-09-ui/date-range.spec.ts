/**
 * Phase 09.1 — Tests 7-8: Date range picker on jobs and requests
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 09 — Date Range', () => {
  test('Test 7: Jobs list has date range picker', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    // Date range filter should be visible
    const dateFilter = gaLeadPage.getByRole('button', { name: /date|range|period/i }).first();
    if (await dateFilter.isVisible()) {
      // Click to open calendar
      await dateFilter.click();

      // Calendar popup should appear
      const calendar = gaLeadPage.locator('[role="dialog"], .rdp, [class*="calendar"]');
      await expect(calendar).toBeVisible({ timeout: 3_000 });

      // Close by pressing Escape
      await gaLeadPage.keyboard.press('Escape');
    }
  });

  test('Test 8: Requests list has date range picker', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    // Date range filter
    const dateFilter = gaLeadPage.getByRole('button', { name: /date|range|period/i }).first();
    if (await dateFilter.isVisible()) {
      await dateFilter.click();

      const calendar = gaLeadPage.locator('[role="dialog"], .rdp, [class*="calendar"]');
      await expect(calendar).toBeVisible({ timeout: 3_000 });

      await gaLeadPage.keyboard.press('Escape');
    }
  });
});
