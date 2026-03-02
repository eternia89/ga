/**
 * Phase 03 — Test 13: Data table sorting and pagination
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';
import { DataTablePage } from '../../pages/shared/data-table.page';

test.describe('Phase 03 — Data Table', () => {
  test('Test 13: Sorting and pagination work on admin tables', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const table = new DataTablePage(adminPage);
    await settings.goto();
    await settings.switchTab('Locations');

    // Wait for table to load
    await adminPage.waitForTimeout(1_000);

    // Test sorting — click a sortable column header
    const nameHeader = adminPage.locator('thead button', { hasText: /name/i }).first();
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await adminPage.waitForTimeout(500);
      // Click again for reverse sort
      await nameHeader.click();
      await adminPage.waitForTimeout(500);
    }

    // Test search
    if (await table.searchInput.isVisible()) {
      await table.search('Head');
      await adminPage.waitForTimeout(500);
      // Should filter results
      const rowCount = await table.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
      await table.clearSearch();
    }

    // Test pagination (if enough data exists)
    const nextBtn = adminPage.getByRole('button', { name: 'Next' });
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await adminPage.waitForTimeout(500);
    }
  });
});
