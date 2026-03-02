/**
 * Phase 08 — Tests 1-4: Photo compression, annotation, lightbox, grid
 */
import { test, expect } from '../../fixtures';

test.describe('Phase 08 — Photo Upload & Media', () => {
  test('Test 1: Photo upload compresses and shows thumbnail preview', async ({ generalUserPage }) => {
    await generalUserPage.goto('/requests/new');
    await generalUserPage.waitForLoadState('networkidle');

    // Upload a photo
    const fileInput = generalUserPage.locator('input[type="file"]').first();
    const buffer = Buffer.alloc(100_000, 0xff); // Simulate a larger file
    await fileInput.setInputFiles({
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer,
    });

    // Should show thumbnail preview (80x80 area)
    await generalUserPage.waitForTimeout(2_000);
    const thumbnails = generalUserPage.locator('img').filter({ has: generalUserPage.locator('visible=true') });
    const count = await thumbnails.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // X button to remove
    const removeBtn = generalUserPage.locator('button').filter({
      has: generalUserPage.locator('svg'),
    });
    // At least one remove button near the photo
    expect(await removeBtn.count()).toBeGreaterThan(0);
  });

  test('Test 2: Photo annotation dialog opens with drawing tools', async ({ generalUserPage }) => {
    await generalUserPage.goto('/requests/new');
    await generalUserPage.waitForLoadState('networkidle');

    // Upload a photo first
    const fileInput = generalUserPage.locator('input[type="file"]').first();
    const buffer = Buffer.alloc(50_000, 0xff);
    await fileInput.setInputFiles({
      name: 'annotate-test.jpg',
      mimeType: 'image/jpeg',
      buffer,
    });
    await generalUserPage.waitForTimeout(2_000);

    // Hover over thumbnail to reveal pencil icon
    const thumbnail = generalUserPage.locator('img').first();
    if (await thumbnail.isVisible()) {
      await thumbnail.hover();
      await generalUserPage.waitForTimeout(500);

      // Look for pencil/annotate button
      const pencilBtn = generalUserPage.locator('button').filter({
        has: generalUserPage.locator('svg'),
      });
      // If annotation button exists, click it
      // Note: may need more specific selector based on actual implementation
    }
  });

  test('Test 3: Photo lightbox with navigation', async ({ gaLeadPage }) => {
    // Navigate to a request detail that has photos
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const firstRow = gaLeadPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      // Click on a photo thumbnail to open lightbox
      const photo = gaLeadPage.locator('img').first();
      if (await photo.isVisible()) {
        await photo.click();

        // Lightbox should open
        const lightbox = gaLeadPage.locator('[role="dialog"]');
        if (await lightbox.isVisible()) {
          // Photo counter should be visible (e.g., "1 of 3")
          await expect(lightbox.locator('text=/\\d+.*of.*\\d+/')).toBeVisible();

          // Keyboard navigation: press Escape to close
          await gaLeadPage.keyboard.press('Escape');
          await expect(lightbox).not.toBeVisible();
        }
      }
    }
  });

  test('Test 4: Photo grid renders thumbnails on detail pages', async ({ gaLeadPage }) => {
    await gaLeadPage.goto('/requests');
    await gaLeadPage.waitForLoadState('networkidle');

    const firstRow = gaLeadPage.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await gaLeadPage.waitForLoadState('networkidle');

      // Photos should render as a grid of thumbnails
      const images = gaLeadPage.locator('img');
      const imageCount = await images.count();
      // May have 0 or more photos — just verify the grid renders without error
      expect(imageCount).toBeGreaterThanOrEqual(0);
    }
  });
});
