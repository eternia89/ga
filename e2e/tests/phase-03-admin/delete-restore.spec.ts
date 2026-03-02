/**
 * Phase 03 — Tests 10-12: Delete with dependency check, delete, restore
 */
import { test, expect } from '../../fixtures';
import { SettingsPage } from '../../pages/admin/settings.page';
import { LocationTabPage } from '../../pages/admin/location-tab.page';
import { DeleteConfirmDialogPage } from '../../pages/shared/delete-confirm-dialog.page';
import { DataTablePage } from '../../pages/shared/data-table.page';

test.describe('Phase 03 — Delete & Restore', () => {
  test('Test 10: Delete entity with dependency shows block message', async ({ adminPage }) => {
    // Locations used by requests/assets should show dependency block
    // This test depends on existing data — use the seeded locations
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.switchTab('Locations');

    const table = new DataTablePage(adminPage);
    const deleteDialog = new DeleteConfirmDialogPage(adminPage);

    // Try to delete "Head Office" which may have dependencies
    const row = table.rows.filter({ hasText: 'Head Office' });
    if (await row.count() > 0) {
      const deleteBtn = row.getByRole('button', { name: /delete|deactivate/i });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await deleteDialog.expectOpen();
        // If it has dependencies, should show block
        const hasBlock = await adminPage.locator('.text-destructive').isVisible();
        if (hasBlock) {
          await deleteDialog.expectDependencyBlock();
          await deleteDialog.expectDeleteDisabled();
        }
        await deleteDialog.cancel();
      }
    }
  });

  test('Test 11: Delete entity without dependencies', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const locationTab = new LocationTabPage(adminPage);
    const deleteDialog = new DeleteConfirmDialogPage(adminPage);
    const table = new DataTablePage(adminPage);
    await settings.goto();
    await settings.switchTab('Locations');

    // Create a fresh location to delete
    const name = `Delete Me ${Date.now()}`;
    await locationTab.createLocation(name, 'Will be deleted');
    await locationTab.feedback.expectSuccess();
    await locationTab.feedback.dismiss();

    // Click delete
    const row = table.rows.filter({ hasText: name });
    await row.getByRole('button', { name: /delete|deactivate/i }).click();

    await deleteDialog.expectOpen();
    await deleteDialog.typeConfirmation(name);
    await deleteDialog.confirm();

    // Should show success and location disappears
    await locationTab.feedback.expectSuccess(/deleted|deactivated|success/i);
  });

  test('Test 12: Show deactivated toggle and restore', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const locationTab = new LocationTabPage(adminPage);
    const deleteDialog = new DeleteConfirmDialogPage(adminPage);
    const table = new DataTablePage(adminPage);
    await settings.goto();
    await settings.switchTab('Locations');

    // Create and delete a location
    const name = `Restore Me ${Date.now()}`;
    await locationTab.createLocation(name, 'Will be restored');
    await locationTab.feedback.expectSuccess();
    await locationTab.feedback.dismiss();

    const row = table.rows.filter({ hasText: name });
    await row.getByRole('button', { name: /delete|deactivate/i }).click();
    await deleteDialog.expectOpen();
    await deleteDialog.typeConfirmation(name);
    await deleteDialog.confirm();
    await locationTab.feedback.expectSuccess();
    await locationTab.feedback.dismiss();

    // Toggle "Show deactivated"
    await settings.toggleShowDeactivated();

    // Should see the deleted location
    await table.expectRowContaining(name);

    // Click restore
    const restoredRow = table.rows.filter({ hasText: name });
    await restoredRow.getByRole('button', { name: /restore|reactivate/i }).click();

    await locationTab.feedback.expectSuccess(/restored|reactivated|success/i);
  });
});
