/**
 * Phase 09.1 — Tests 1, 3, 6 + retest 1-4: CTA and export button positions
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 09 — CTA & Export Positions', () => {
  test('Test 1: Request list has CTA above table', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    // New Request button should be above the table
    const ctaButton = gaLeadPage.getByRole('link', { name: /new request/i });
    await expect(ctaButton).toBeVisible();

    // CTA should be positioned before (above) the table
    const ctaBox = await ctaButton.boundingBox();
    const tableBox = await gaLeadPage.locator('table').boundingBox();
    if (ctaBox && tableBox) {
      expect(ctaBox.y).toBeLessThan(tableBox.y);
    }
  });

  test('Test 3: Job list has CTA above table', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const ctaButton = gaLeadPage.getByRole('link', { name: /new job/i });
    await expect(ctaButton).toBeVisible();

    const ctaBox = await ctaButton.boundingBox();
    const tableBox = await gaLeadPage.locator('table').boundingBox();
    if (ctaBox && tableBox) {
      expect(ctaBox.y).toBeLessThan(tableBox.y);
    }
  });

  test('Test 6: Export button positioned correctly', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const exportBtn = gaLeadPage.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) {
      // Export should be above the table, next to CTA
      const exportBox = await exportBtn.boundingBox();
      const tableBox = await gaLeadPage.locator('table').boundingBox();
      if (exportBox && tableBox) {
        expect(exportBox.y).toBeLessThan(tableBox.y);
      }
    }
  });

  test('Retest 1: Request list CTA is a "New Request" link/button', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const cta = gaLeadPage.getByRole('link', { name: /new request/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/requests/new');
  });

  test('Retest 2: Job list CTA is a "New Job" link/button', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const cta = gaLeadPage.getByRole('link', { name: /new job/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/jobs/new');
  });

  test('Retest 3: Inventory CTA is a "New Asset" link/button', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/inventory');
    await gaStaffPage.waitForLoadState('networkidle');

    const cta = gaStaffPage.getByRole('link', { name: /new asset/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/inventory/new');
  });

  test('Retest 4: Export buttons on job list', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const exportBtn = gaLeadPage.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();
  });
});
