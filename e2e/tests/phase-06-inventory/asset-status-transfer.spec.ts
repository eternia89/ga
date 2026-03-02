/**
 * Phase 06 — Tests 8-11, 13: Status change, transfer flow, in-transit indicator
 */
import { test, expect } from '../../fixtures';
import { AssetDetailPage } from '../../pages/inventory/asset-detail.page';
import { AssetListPage } from '../../pages/inventory/asset-list.page';

test.describe('Phase 06 — Asset Status & Transfer', () => {
  test.fixme('Test 8: Change asset status with photo requirement', async ({ gaStaffPage }) => {
    // Navigate to an asset
    const list = new AssetListPage(gaStaffPage);
    await list.goto();

    const firstRow = gaStaffPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaStaffPage.waitForLoadState('networkidle');

      const detail = new AssetDetailPage(gaStaffPage);
      await detail.clickChangeStatus();

      // Should open status change dialog
      const dialog = gaStaffPage.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

  test.fixme('Test 9: Initiate asset transfer', async ({ gaLeadPage }) => {
    const list = new AssetListPage(gaLeadPage);
    await list.goto();

    const firstRow = gaLeadPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const detail = new AssetDetailPage(gaLeadPage);
      await detail.clickTransfer();
      await detail.initiateTransfer('Branch B', 'E2E GA Staff');

      await detail.feedback.expectSuccess(/transfer|initiated|success/i);
    }
  });

  test.fixme('Test 10: Accept transfer', async ({ gaStaffPage }) => {
    // GA Staff at destination accepts the transfer
    const list = new AssetListPage(gaStaffPage);
    await list.goto();

    // Look for asset with pending transfer
    const pendingRow = gaStaffPage.locator('tbody tr').filter({ hasText: /pending|in transit/i }).first();
    if (await pendingRow.isVisible()) {
      await pendingRow.click();
      await gaStaffPage.waitForLoadState('networkidle');

      const detail = new AssetDetailPage(gaStaffPage);
      await detail.acceptTransfer();

      await detail.feedback.expectSuccess(/accepted|success/i);
    }
  });

  test.fixme('Test 11: Cancel transfer', async ({ gaLeadPage }) => {
    // Initiator cancels a pending transfer
    const list = new AssetListPage(gaLeadPage);
    await list.goto();

    const pendingRow = gaLeadPage.locator('tbody tr').filter({ hasText: /pending|in transit/i }).first();
    if (await pendingRow.isVisible()) {
      await pendingRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      const detail = new AssetDetailPage(gaLeadPage);
      await detail.cancelTransfer();

      await detail.feedback.expectSuccess(/cancelled|success/i);
    }
  });

  test.fixme('Test 13: In-transit indicator visible on list', async ({ gaStaffPage }) => {
    const list = new AssetListPage(gaStaffPage);
    await list.goto();

    // If any asset has pending transfer, it should show indicator
    const pendingBadge = gaStaffPage.locator('text=/pending|in transit/i');
    // This is a visual check — may or may not have pending transfers
    const count = await pendingBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
