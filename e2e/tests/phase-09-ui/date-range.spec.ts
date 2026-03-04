/**
 * Phase 09 — Tests 7-8: Date range picker on jobs and requests
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 09 — Date Range', () => {
  test('Test 7: Jobs list has date range picker', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    // Date range filter button — look for "Pick date range" or calendar-related button
    const dateFilter = gaLeadPage.getByRole('button', { name: /date|range|period|pick date/i }).first();
    await expect(dateFilter).toBeVisible({ timeout: 5_000 });

    // Click to open calendar popover
    await dateFilter.click();
    await gaLeadPage.waitForTimeout(500);

    // Calendar dialog/popover should appear (use role="dialog" for the popover content)
    const calendarDialog = gaLeadPage.locator('[role="dialog"]').first();
    await expect(calendarDialog).toBeVisible({ timeout: 3_000 });

    // Close by pressing Escape
    await gaLeadPage.keyboard.press('Escape');
  });

  test('Test 8: Requests list has date range picker', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const dateFilter = gaLeadPage.getByRole('button', { name: /date|range|period|pick date/i }).first();
    await expect(dateFilter).toBeVisible({ timeout: 5_000 });

    await dateFilter.click();
    await gaLeadPage.waitForTimeout(500);

    const calendarDialog = gaLeadPage.locator('[role="dialog"]').first();
    await expect(calendarDialog).toBeVisible({ timeout: 3_000 });

    await gaLeadPage.keyboard.press('Escape');
  });
});
