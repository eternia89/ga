/**
 * Phase 03 — Test 5: Tab switching updates URL
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';

test.describe('Phase 03 — Tab Switching', () => {
  test('Test 5: Switching tabs updates URL with ?tab= param', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();

    // Switch to Divisions tab
    await settings.switchTab('Divisions');
    await expect(adminPage).toHaveURL(/tab=divisions/i);

    // Switch to Locations tab
    await settings.switchTab('Locations');
    await expect(adminPage).toHaveURL(/tab=locations/i);

    // Switch to Request Categories tab
    await settings.switchTab('Request Categories');
    await expect(adminPage).toHaveURL(/tab=request-categories/i);

    // Switch to Users tab
    await settings.switchTab('Users');
    await expect(adminPage).toHaveURL(/tab=users/i);
  });
});
