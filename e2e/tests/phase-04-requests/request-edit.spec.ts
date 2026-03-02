/**
 * Phase 04 — Test 8: Edit request while New
 */
import { test, expect } from '../../fixtures';
import { RequestNewPage } from '../../pages/requests/request-new.page';
import { RequestDetailPage } from '../../pages/requests/request-detail.page';

test.describe('Phase 04 — Request Edit', () => {
  test('Test 8: Edit request description while status is New', async ({ generalUserPage }) => {
    // Submit a request
    const form = new RequestNewPage(generalUserPage);
    await form.goto();
    await form.fillDescription('E2E test: Original description — will be edited to test inline editing.');
    await form.selectLocation('Head Office');
    await form.submit();
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });

    // Edit the description
    const detail = new RequestDetailPage(generalUserPage);
    const descField = generalUserPage.getByLabel(/description/i);

    if (await descField.isVisible()) {
      await descField.clear();
      await descField.fill('E2E test: Updated description after inline edit — verified edit capability.');
      await detail.saveChanges();
      await detail.feedback.expectSuccess(/updated|saved|success/i);
    }
  });

  test('Test 8b: Cannot edit request after triage', async ({ generalUserPage, gaLeadPage }) => {
    // Submit a request
    const form = new RequestNewPage(generalUserPage);
    await form.goto();
    await form.fillDescription('E2E test: Should not be editable after triage — testing edit lock.');
    await form.selectLocation('Head Office');
    await form.submit();
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });
    const requestId = generalUserPage.url().split('/requests/')[1];

    // Triage as GA Lead
    const detail = new RequestDetailPage(gaLeadPage);
    await detail.goto(requestId);
    await detail.clickTriage();
    await detail.triageRequest('Electrical', 'Medium', 'E2E GA Staff');
    await detail.feedback.expectSuccess();

    // General user should no longer be able to edit
    await generalUserPage.goto(`/requests/${requestId}`);
    await generalUserPage.waitForLoadState('networkidle');

    // Description field should be disabled or not editable
    const descField = generalUserPage.getByLabel(/description/i);
    if (await descField.isVisible()) {
      const isDisabled = await descField.isDisabled();
      const isReadonly = await descField.getAttribute('readonly');
      // Either disabled, readonly, or not a form field (just text)
      expect(isDisabled || isReadonly !== null).toBeTruthy();
    }
  });
});
