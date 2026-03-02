/**
 * Phase 04 — Test 2: Photo upload & preview
 */
import { test, expect } from '../../fixtures';
import { RequestNewPage } from '../../pages/requests/request-new.page';

test.describe('Phase 04 — Photo Upload', () => {
  test('Test 2: Upload photos on request form', async ({ generalUserPage }) => {
    const form = new RequestNewPage(generalUserPage);
    await form.goto();

    // Fill required fields
    await form.fillDescription('E2E test: Photo upload test for request form with multiple images.');
    await form.selectLocation('Head Office');

    // Upload a photo
    await form.uploadPhoto();

    // Should show photo preview (at least 1 image visible)
    await generalUserPage.waitForTimeout(2_000);
    const images = generalUserPage.locator('img');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThanOrEqual(1);

    // Submit with photo
    await form.submit();
    await generalUserPage.waitForURL(/\/requests\//, { timeout: 10_000 });
  });
});
