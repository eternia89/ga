/**
 * Phase 03 — Test 7: Create a location
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';
import { LocationTabPage } from '../../pages/admin/location-tab.page';

test.describe('Phase 03 — Location CRUD', () => {
  test('Test 7: Create a location', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const locationTab = new LocationTabPage(adminPage);
    await settings.goto();
    await settings.switchTab('Locations');

    const uniqueName = `Test Location ${Date.now()}`;
    await locationTab.createLocation(uniqueName, '123 Test Street');

    await locationTab.feedback.expectSuccess(/created|success/i);
    await locationTab.expectLocationInTable(uniqueName);
  });
});
