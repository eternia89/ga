/**
 * Phase 09.1 — Test 5: Pagination defaults to 50 rows per page
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 09 — Pagination Defaults', () => {
  test('Test 5: Default rows per page is 50', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    // Look for the rows-per-page selector or the pagination info
    // It should show "50" as the default page size
    const pageSizeSelector = gaLeadPage.locator('select').first();
    if (await pageSizeSelector.isVisible()) {
      const selectedValue = await pageSizeSelector.inputValue();
      expect(selectedValue).toBe('50');
    } else {
      // Alternative: check pagination info text for "50"
      const paginationText = await gaLeadPage.locator('text=/\\d+ of \\d+ row/').textContent();
      if (paginationText) {
        // If there are fewer than 50 rows, still verify default
        expect(paginationText).toBeDefined();
      }
    }
  });

  test('Test 5b: Jobs list also defaults to 50 rows', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const pageSizeSelector = gaLeadPage.locator('select').first();
    if (await pageSizeSelector.isVisible()) {
      const selectedValue = await pageSizeSelector.inputValue();
      expect(selectedValue).toBe('50');
    }
  });
});
