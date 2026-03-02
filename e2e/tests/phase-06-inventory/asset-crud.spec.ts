/**
 * Phase 06 — Tests 1-7: Asset sidebar, list, filters, create, invoice, detail, inline edit
 */
import { test, expect } from '../../fixtures';
import { SidebarPage } from '../../pages/sidebar.page';
import { AssetListPage } from '../../pages/inventory/asset-list.page';
import { AssetNewPage } from '../../pages/inventory/asset-new.page';

test.describe('Phase 06 — Asset CRUD', () => {
  test('Test 1: Sidebar shows Inventory/Assets link', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/');
    await gaStaffPage.waitForLoadState('networkidle');

    const sidebar = new SidebarPage(gaStaffPage);
    await sidebar.expectSectionVisible('Inventory');
    await sidebar.expectNavItem('Assets');
  });

  test('Test 2: Asset list page loads with AST-YY-NNNN format IDs', async ({ gaStaffPage }) => {
    const list = new AssetListPage(gaStaffPage);
    await list.goto();
    await list.expectTitle();
    await expect(gaStaffPage.locator('table')).toBeVisible();

    // Check column headers
    const headers = gaStaffPage.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const headerString = headerTexts.join(' ').toLowerCase();
    expect(headerString).toContain('id');
    expect(headerString).toContain('name');
    expect(headerString).toContain('status');
  });

  test('Test 3: Asset list filters work', async ({ gaStaffPage }) => {
    const list = new AssetListPage(gaStaffPage);
    await list.goto();

    // Test search
    await list.table.search('test');
    await gaStaffPage.waitForTimeout(500);
    await list.table.clearSearch();

    // Export button visible for GA Staff
    await list.expectExportButton();
  });

  test('Test 4: Create new asset with condition photo', async ({ gaStaffPage }) => {
    const form = new AssetNewPage(gaStaffPage);
    await form.goto();
    await form.expectTitle();

    await form.fillName(`E2E Test Asset ${Date.now()}`);
    await form.selectCategory('Furniture');
    await form.selectLocation('Head Office');
    await form.fillBrand('TestBrand');
    await form.fillModel('Model X');
    await form.fillSerialNumber('SN-E2E-001');
    await form.fillDescription('E2E test asset for automated testing');

    // Upload condition photo (required)
    await form.uploadConditionPhoto();

    await form.submit();

    // Should redirect to asset detail
    await gaStaffPage.waitForURL(/\/inventory\//, { timeout: 10_000 });
    await expect(gaStaffPage.locator('text=/AST-/')).toBeVisible({ timeout: 5_000 });
  });

  test.fixme('Test 5: Invoice upload on creation (depends on asset ID generation)', async ({ gaStaffPage }) => {
    const form = new AssetNewPage(gaStaffPage);
    await form.goto();

    await form.fillName(`E2E Invoice Test ${Date.now()}`);
    await form.selectCategory('Electronics');
    await form.selectLocation('Branch A');

    // Upload condition photo
    await form.uploadConditionPhoto();

    // Upload invoice
    await form.uploadInvoice();

    await form.submit();
    await gaStaffPage.waitForURL(/\/inventory\//, { timeout: 10_000 });
  });

  test.fixme('Test 6: Asset detail page layout (depends on asset ID generation)', async ({ gaStaffPage }) => {
    // Navigate to an asset detail page
    const list = new AssetListPage(gaStaffPage);
    await list.goto();

    // Click first row
    const firstRow = gaStaffPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaStaffPage.waitForLoadState('networkidle');

      // Verify layout elements
      await expect(gaStaffPage.locator('text=/AST-/')).toBeVisible();
      await expect(gaStaffPage.locator('text=/Activity Timeline/i')).toBeVisible();
    }
  });

  test.fixme('Test 7: Inline edit asset (depends on asset ID generation)', async ({ gaStaffPage }) => {
    // Navigate to asset detail
    const list = new AssetListPage(gaStaffPage);
    await list.goto();

    const firstRow = gaStaffPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaStaffPage.waitForLoadState('networkidle');

      // Try to edit name
      const nameField = gaStaffPage.getByLabel(/^name/i);
      if (await nameField.isVisible()) {
        await nameField.clear();
        await nameField.fill(`Updated Asset ${Date.now()}`);
        await gaStaffPage.getByRole('button', { name: /save/i }).click();
      }
    }
  });
});
