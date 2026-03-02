/**
 * Phase 04 — Test 5: Reject a request
 */
import { test, expect } from '../../fixtures';
import { RequestNewPage } from '../../pages/requests/request-new.page';
import { RequestDetailPage } from '../../pages/requests/request-detail.page';

test.describe('Phase 04 — Request Reject', () => {
  test('Test 5: GA Lead rejects a submitted request with reason', async ({ generalUserPage, gaLeadPage }) => {
    // Submit a request as general user
    const form = new RequestNewPage(generalUserPage);
    await form.goto();
    await form.fillDescription('E2E test: Request to be rejected — requesting a personal coffee machine for desk.');
    await form.selectLocation('Branch A');
    await form.submit();
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });
    const requestId = generalUserPage.url().split('/requests/')[1];

    // GA Lead rejects it
    const detail = new RequestDetailPage(gaLeadPage);
    await detail.goto(requestId);
    await detail.clickReject();
    await detail.rejectWithReason('Not within company maintenance scope');

    await detail.feedback.expectSuccess(/rejected|success/i);

    // Status should change to Rejected
    await expect(gaLeadPage.locator('text=/rejected/i')).toBeVisible();
  });
});
