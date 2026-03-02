import { Page, expect } from '@playwright/test';

export class InlineFeedbackPage {
  constructor(private page: Page) {}

  async expectSuccess(text?: string | RegExp) {
    const feedback = this.page.locator('.bg-green-50').first();
    await expect(feedback).toBeVisible({ timeout: 10_000 });
    if (text) {
      await expect(feedback).toContainText(text);
    }
  }

  async expectError(text?: string | RegExp) {
    const feedback = this.page.locator('.bg-red-50').first();
    await expect(feedback).toBeVisible({ timeout: 10_000 });
    if (text) {
      await expect(feedback).toContainText(text);
    }
  }

  async dismiss() {
    const dismissBtn = this.page.locator('button[aria-label="Dismiss"]').first();
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
    }
  }

  async expectNone() {
    await expect(this.page.locator('.bg-green-50')).not.toBeVisible();
    await expect(this.page.locator('.bg-red-50')).not.toBeVisible();
  }
}
