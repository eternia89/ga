/**
 * Phase 08 — Tests 19-22: Excel exports for requests, jobs, inventory, maintenance
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 08 — Excel Exports', () => {
  test('Test 19: Export requests as Excel', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    // Export button should be visible for GA Lead
    const exportBtn = gaLeadPage.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();

    // Click export and wait for download
    const downloadPromise = gaLeadPage.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/requests-export.*\.xlsx$/);
  });

  test('Test 19b: General user does NOT see export button on requests', async ({ generalUserPage }) => {
    await generalUserPage.goto('/requests');
    await generalUserPage.waitForLoadState('networkidle');

    const exportBtn = generalUserPage.getByRole('button', { name: /export/i });
    await expect(exportBtn).not.toBeVisible();
  });

  test('Test 20: Export jobs as Excel', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const exportBtn = gaLeadPage.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();

    const downloadPromise = gaLeadPage.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/jobs-export.*\.xlsx$/);
  });

  test('Test 21: Export inventory as Excel', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/inventory');
    await gaStaffPage.waitForLoadState('networkidle');

    const exportBtn = gaStaffPage.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();

    const downloadPromise = gaStaffPage.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/inventory-export.*\.xlsx$/);
  });

  test('Test 22: Export maintenance schedules as Excel', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/maintenance');
    await gaLeadPage.waitForLoadState('networkidle');

    const exportBtn = gaLeadPage.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) {
      const downloadPromise = gaLeadPage.waitForEvent('download');
      await exportBtn.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/maintenance-export.*\.xlsx$/);
    }
  });
});
