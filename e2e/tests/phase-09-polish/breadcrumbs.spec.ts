/**
 * Phase 09 — Breadcrumb navigation on interior pages
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 09 — Breadcrumbs', () => {
  test('Requests page shows breadcrumb with Dashboard > Requests', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const breadcrumb = gaLeadPage.locator('nav[aria-label="breadcrumb"], nav:has(ol)').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();
    await expect(breadcrumb.getByText('Requests')).toBeVisible();
  });

  test('Jobs page shows breadcrumb with Dashboard > Jobs', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const breadcrumb = gaLeadPage.locator('nav[aria-label="breadcrumb"], nav:has(ol)').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();
    await expect(breadcrumb.getByText('Jobs')).toBeVisible();
  });

  test('Settings page shows breadcrumb with Dashboard > Settings', async ({ adminPage }) => {
    await adminPage.goto('/admin/settings');
    await adminPage.waitForLoadState('networkidle');

    const breadcrumb = adminPage.locator('nav[aria-label="breadcrumb"], nav:has(ol)').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();
    await expect(breadcrumb.getByText('Settings')).toBeVisible();
  });
});
