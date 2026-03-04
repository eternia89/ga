/**
 * Phase 09 — Breadcrumb navigation on all interior pages
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 09 — Breadcrumbs', () => {
  test('Requests page shows Dashboard > Requests breadcrumb', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const breadcrumb = gaLeadPage.locator('nav[aria-label="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();
    await expect(breadcrumb.getByText('Requests')).toBeVisible();
  });

  test('Jobs page shows Dashboard > Jobs breadcrumb', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/jobs');
    await gaLeadPage.waitForLoadState('networkidle');

    const breadcrumb = gaLeadPage.locator('nav[aria-label="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();
    await expect(breadcrumb.getByText('Jobs')).toBeVisible();
  });

  test('Inventory page shows Dashboard > Inventory breadcrumb', async ({ gaStaffPage }) => {
    await gaStaffPage.goto('/inventory');
    await gaStaffPage.waitForLoadState('networkidle');

    const breadcrumb = gaStaffPage.locator('nav[aria-label="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Inventory')).toBeVisible();
  });

  test('Settings page shows Dashboard > Settings breadcrumb', async ({ adminPage }) => {
    await adminPage.goto('/admin/settings');
    await adminPage.waitForLoadState('networkidle');

    const breadcrumb = adminPage.locator('nav[aria-label="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();
    await expect(breadcrumb.getByText('Settings')).toBeVisible();
  });

  test('Notifications page shows Dashboard > Notifications breadcrumb', async ({ adminPage }) => {
    await adminPage.goto('/notifications');
    await adminPage.waitForLoadState('networkidle');

    const breadcrumb = adminPage.locator('nav[aria-label="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Notifications')).toBeVisible();
  });

  test('Breadcrumb Dashboard link navigates to home', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const breadcrumb = gaLeadPage.locator('nav[aria-label="breadcrumb"]').first();
    const dashLink = breadcrumb.getByRole('link', { name: 'Dashboard' });
    await expect(dashLink).toBeVisible();
    await expect(dashLink).toHaveAttribute('href', '/');
  });
});
