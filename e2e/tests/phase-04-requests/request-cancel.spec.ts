/**
 * Phase 04 — Test 6: Cancel own request
 */
import { test, expect } from '../../fixtures';
import { RequestNewPage } from '../../pages/requests/request-new.page';
import { RequestDetailPage } from '../../pages/requests/request-detail.page';

test.describe('Phase 04 — Request Cancel', () => {
  test('Test 6: General user cancels their own submitted request', async ({ generalUserPage }) => {
    // Submit a request
    const form = new RequestNewPage(generalUserPage);
    await form.goto();
    await form.fillDescription('E2E test: Request to be cancelled by the requester — false alarm on broken equipment.');
    await form.selectLocation('Branch B');
    await form.submit();
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });
    const requestId = generalUserPage.url().split('/requests/')[1];

    // Cancel the request
    const detail = new RequestDetailPage(generalUserPage);
    await detail.goto(requestId);
    await detail.clickCancel();
    await detail.confirmCancel();

    await detail.feedback.expectSuccess(/cancelled|success/i);

    // Status should show Cancelled
    await expect(generalUserPage.locator('text=/cancelled/i')).toBeVisible();
  });
});
