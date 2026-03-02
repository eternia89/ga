import { Page, expect } from '@playwright/test';

export class NotificationBellPage {
  constructor(private page: Page) {}

  get bellButton() {
    return this.page.locator('header button').filter({
      has: this.page.locator('svg'),
    }).first();
  }

  async expectVisible() {
    await expect(this.bellButton).toBeVisible();
  }

  async expectUnreadBadge(count?: number | string) {
    const badge = this.page.locator('header').locator('.bg-red-500, .bg-red-600, [class*="bg-red"]').first();
    await expect(badge).toBeVisible();
    if (count !== undefined) {
      await expect(badge).toContainText(String(count));
    }
  }

  async expectNoBadge() {
    const badge = this.page.locator('header').locator('.bg-red-500, .bg-red-600, [class*="bg-red"]');
    await expect(badge).not.toBeVisible();
  }

  async click() {
    await this.bellButton.click();
  }

  async expectDropdownOpen() {
    await expect(this.page.locator('text=/notifications/i').first()).toBeVisible();
  }

  async expectDropdownItems() {
    // Should show notification items in the dropdown
    await expect(this.page.locator('[class*="popover"], [role="dialog"]').first()).toBeVisible();
  }

  async clickMarkAllRead() {
    await this.page.getByRole('button', { name: /mark all.*read/i }).click();
  }

  async clickNotification(index: number = 0) {
    const items = this.page.locator('[class*="popover"] button, [class*="popover"] a').filter({
      hasNot: this.page.locator('text=/mark all/i'),
    });
    await items.nth(index).click();
  }

  async clickViewAll() {
    await this.page.getByRole('link', { name: /view all/i }).click();
  }
}
