/**
 * Phase 04 — Test 7: Request detail page & timeline
 */
import { test, expect } from '../../fixtures';
import { RequestNewPage } from '../../pages/requests/request-new.page';
import { RequestDetailPage } from '../../pages/requests/request-detail.page';

test.describe('Phase 04 — Request Detail', () => {
  test('Test 7: Request detail shows layout and timeline', async ({ generalUserPage }) => {
    // Submit a request
    const form = new RequestNewPage(generalUserPage);
    await form.goto();
    await form.fillDescription('E2E test: Detail page test — broken window handle in the meeting room needs fixing.');
    await form.selectLocation('Head Office');
    await form.submit();
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });

    // Verify detail layout
    const detail = new RequestDetailPage(generalUserPage);

    // Request ID visible
    await expect(generalUserPage.locator('text=/REQ-/')).toBeVisible();

    // Status badge visible
    await expect(generalUserPage.locator('text=/new|submitted/i')).toBeVisible();

    // Timeline section visible
    await detail.expectTimeline();

    // Location should be shown
    await expect(generalUserPage.locator('text=/Head Office/')).toBeVisible();

    // Max width constraint on detail page
    const mainContent = generalUserPage.locator('[class*="max-w"]').first();
    await expect(mainContent).toBeVisible();
  });
});
