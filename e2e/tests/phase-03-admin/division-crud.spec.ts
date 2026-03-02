/**
 * Phase 03 — Test 6: Create a division (company-scoped)
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';
import { DivisionTabPage } from '../../pages/admin/division-tab.page';

test.describe('Phase 03 — Division CRUD', () => {
  test('Test 6: Create a division with company selection', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const divisionTab = new DivisionTabPage(adminPage);
    await settings.goto();
    await settings.switchTab('Divisions');

    const uniqueName = `Test Division ${Date.now()}`;
    await divisionTab.createDivision(uniqueName, 'E2E Test Corp');

    await divisionTab.feedback.expectSuccess(/created|success/i);
    await divisionTab.expectDivisionInTable(uniqueName);
  });
});
