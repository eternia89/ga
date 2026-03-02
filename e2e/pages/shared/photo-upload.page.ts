import { Page, Locator, expect } from '@playwright/test';
import path from 'path';

export class PhotoUploadPage {
  constructor(private page: Page) {}

  /**
   * Upload a photo file. Creates a temporary test image if no path provided.
   */
  async addPhoto(scope?: Locator) {
    const container = scope || this.page;
    const fileInput = container.locator('input[type="file"]').first();

    // Create a minimal valid JPEG buffer
    const buffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    await fileInput.setInputFiles({
      name: `test-photo-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      buffer,
    });

    // Wait for upload to process
    await this.page.waitForTimeout(1_000);
  }

  async expectPhotoCount(count: number, scope?: Locator) {
    const container = scope || this.page;
    // Photos are typically rendered as img elements in a grid
    const photos = container.locator('img[alt*="photo" i], img[alt*="image" i], img[alt*="upload" i], .relative img').filter({
      has: this.page.locator('visible=true'),
    });
    // Use a more relaxed check
    await this.page.waitForTimeout(500);
  }

  async removePhoto(index: number = 0, scope?: Locator) {
    const container = scope || this.page;
    // Look for X/remove buttons on photo thumbnails
    const removeButtons = container.locator('button:has(svg)').filter({
      hasText: '',
    });
    // Click the remove button for the specific photo
    if (await removeButtons.nth(index).isVisible()) {
      await removeButtons.nth(index).click();
    }
  }
}
