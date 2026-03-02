/**
 * Phase 03 — Tests 14-18: User management CRUD, deactivate, reactivate
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';
import { UserTabPage } from '../../pages/admin/user-tab.page';

test.describe('Phase 03 — User Management', () => {
  const timestamp = Date.now();

  test('Test 14: Users tab shows user list', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.switchTab('Users');

    const userTab = new UserTabPage(adminPage);
    // Should show at least the seeded E2E users
    await userTab.expectUserInTable(/e2e/i);
  });

  test('Test 15: Create a new user', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.switchTab('Users');

    const userTab = new UserTabPage(adminPage);
    const email = `new-user-${timestamp}@e2e-test.local`;
    await userTab.createUser(email, 'New Test User', 'General User', 'E2E Test Corp');

    await userTab.feedback.expectSuccess(/created|success/i);
    await userTab.expectUserInTable(email);
  });

  test('Test 16: Edit a user', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.switchTab('Users');

    const userTab = new UserTabPage(adminPage);

    // Find a test user to edit (the one we created or a seeded one)
    const email = `new-user-${timestamp}@e2e-test.local`;
    await userTab.editUser(email);
    await userTab.dialog.expectOpen();

    // Change the name
    await userTab.dialog.fillField('Full Name', 'Updated Test User');
    await userTab.dialog.confirm();

    await userTab.feedback.expectSuccess(/updated|success/i);
  });

  test('Test 17: Deactivate a user', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.switchTab('Users');

    const userTab = new UserTabPage(adminPage);
    const email = `new-user-${timestamp}@e2e-test.local`;

    await userTab.deactivateUser(email);

    // May show confirmation dialog
    const dialog = adminPage.locator('[role="alertdialog"]');
    if (await dialog.isVisible()) {
      await dialog.getByRole('button', { name: /confirm|deactivate|yes/i }).click();
    }

    await userTab.feedback.expectSuccess(/deactivated|success/i);
  });

  test('Test 18: Reactivate a user', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.switchTab('Users');

    // Toggle to show deactivated users
    await settings.toggleShowDeactivated();

    const userTab = new UserTabPage(adminPage);
    const email = `new-user-${timestamp}@e2e-test.local`;

    await userTab.reactivateUser(email);

    await userTab.feedback.expectSuccess(/reactivated|restored|success/i);
  });
});
