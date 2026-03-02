/**
 * Phase 04 — Test 4: Triage a request
 */
import { test, expect } from '../../fixtures';
import { RequestNewPage } from '../../pages/requests/request-new.page';
import { RequestDetailPage } from '../../pages/requests/request-detail.page';
import { RequestListPage } from '../../pages/requests/request-list.page';

test.describe('Phase 04 — Request Triage', () => {
  test('Test 4: GA Lead triages a submitted request', async ({ generalUserPage, gaLeadPage }) => {
    // Step 1: General user submits a request
    const form = new RequestNewPage(generalUserPage);
    await form.goto();
    await form.fillDescription('E2E test: Triage test request — light fixture needs replacement in conference room.');
    await form.selectLocation('Head Office');
    await form.submit();

    // Get the request URL
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });
    const requestUrl = generalUserPage.url();
    const requestId = requestUrl.split('/requests/')[1];

    // Step 2: GA Lead opens the request
    const detail = new RequestDetailPage(gaLeadPage);
    await detail.goto(requestId);

    // Should be in "New" / "Submitted" status
    await expect(gaLeadPage.locator('text=/new|submitted/i')).toBeVisible();

    // Triage the request
    await detail.clickTriage();
    await detail.triageRequest('Electrical', 'High', 'E2E GA Staff');

    await detail.feedback.expectSuccess(/triaged|success/i);
  });
});
