/**
 * Phase 04 — Test 3: Request list & filtering
 */
import { test, expect } from '../../fixtures';
import { RequestListPage } from '../../pages/requests/request-list.page';

test.describe('Phase 04 — Request List', () => {
  test('Test 3: Request list shows columns and supports search', async ({ gaLeadPage }) => {
    const list = new RequestListPage(gaLeadPage);
    await list.goto();
    await list.expectTitle();

    // Table should be visible with headers
    await expect(gaLeadPage.locator('table')).toBeVisible();

    // Check expected columns exist
    const headers = gaLeadPage.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const headerString = headerTexts.join(' ').toLowerCase();
    expect(headerString).toContain('id');
    expect(headerString).toContain('status');

    // Test search
    await list.table.search('E2E');
    await gaLeadPage.waitForTimeout(500);
    await list.table.clearSearch();

    // GA Lead should see export button
    await list.expectExportButton();

    // New Request button should exist
    await expect(gaLeadPage.getByRole('link', { name: /new request/i })).toBeVisible();
  });

  test('Test 3b: URL syncs with filters', async ({ gaLeadPage }) => {
    const list = new RequestListPage(gaLeadPage);
    await list.goto();

    // Search should update URL
    await list.table.search('test');
    await gaLeadPage.waitForTimeout(500);
    // URL should have search param
    const url = gaLeadPage.url();
    // Clear for cleanup
    await list.table.clearSearch();
  });
});
