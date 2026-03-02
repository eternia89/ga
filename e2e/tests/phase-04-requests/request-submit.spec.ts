/**
 * Phase 04 — Test 1: Submit a new request
 */
import { test, expect } from '../../fixtures';
import { RequestNewPage } from '../../pages/requests/request-new.page';

test.describe('Phase 04 — Request Submit', () => {
  test('Test 1: Submit a new request with required fields', async ({ generalUserPage }) => {
    const form = new RequestNewPage(generalUserPage);
    await form.goto();
    await form.expectTitle();

    // Fill required fields
    await form.fillDescription('E2E test: The office air conditioning is not working properly and needs maintenance.');
    await form.selectLocation('Head Office');

    await form.submit();

    // Should redirect to request detail or list with success
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });

    // Verify request ID was generated (REQ-YY-NNNN format)
    await expect(generalUserPage.locator('text=/REQ-/')).toBeVisible({ timeout: 5_000 });
  });
});
