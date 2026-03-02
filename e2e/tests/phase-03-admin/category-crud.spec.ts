/**
 * Phase 03 — Tests 8-9: Category create and type immutable on edit
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';
import { CategoryTabPage } from '../../pages/admin/category-tab.page';

test.describe('Phase 03 — Category CRUD', () => {
  test('Test 8: Create request and asset categories', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const categoryTab = new CategoryTabPage(adminPage);
    await settings.goto();
    await settings.switchTab('Categories');

    // Create a request-type category
    const reqName = `Req Cat ${Date.now()}`;
    await categoryTab.createCategory(reqName, 'Request', 'Test request category');
    await categoryTab.feedback.expectSuccess(/created|success/i);
    await categoryTab.feedback.dismiss();
    await categoryTab.expectCategoryInTable(reqName);

    // Create an asset-type category
    const assetName = `Asset Cat ${Date.now()}`;
    await categoryTab.createCategory(assetName, 'Asset', 'Test asset category');
    await categoryTab.feedback.expectSuccess(/created|success/i);
    await categoryTab.expectCategoryInTable(assetName);
  });

  test('Test 9: Category type is immutable on edit', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const categoryTab = new CategoryTabPage(adminPage);
    await settings.goto();
    await settings.switchTab('Categories');

    // Create a category to edit
    const name = `Immutable Type ${Date.now()}`;
    await categoryTab.createCategory(name, 'Request');
    await categoryTab.feedback.expectSuccess();
    await categoryTab.feedback.dismiss();

    // Open edit dialog
    await categoryTab.editCategory(name);
    await categoryTab.dialog.expectOpen();

    // Type field should be disabled
    await categoryTab.expectTypeImmutable();

    await categoryTab.dialog.close();
  });
});
