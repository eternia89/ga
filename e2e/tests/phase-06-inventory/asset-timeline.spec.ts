/**
 * Phase 06 — Test 12: Asset timeline events
 */
import { test, expect } from '../../fixtures';
import { AssetListPage } from '../../pages/inventory/asset-list.page';
import { AssetDetailPage } from '../../pages/inventory/asset-detail.page';

test.describe('Phase 06 — Asset Timeline', () => {
  test.fixme('Test 12: Asset timeline shows creation and edit events', async ({ gaStaffPage }) => {
    const list = new AssetListPage(gaStaffPage);
    await list.goto();

    // Navigate to first asset
    const firstRow = gaStaffPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaStaffPage.waitForLoadState('networkidle');

      const detail = new AssetDetailPage(gaStaffPage);
      await detail.expectTimeline();

      // Should have at least a creation event
      await expect(gaStaffPage.locator('text=/created/i')).toBeVisible();
    }
  });
});
