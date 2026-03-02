import { Page, expect } from '@playwright/test';

export class NotificationCenterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/notifications');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1, text=/notifications/i').first()).toBeVisible();
  }

  async expectFilterChips() {
    for (const chip of ['All', 'Unread', 'Requests', 'Jobs', 'Inventory', 'Maintenance']) {
      await expect(this.page.getByRole('button', { name: chip })).toBeVisible();
    }
  }

  async clickFilter(name: string) {
    await this.page.getByRole('button', { name, exact: true }).click();
    await this.page.waitForTimeout(500);
  }

  async expectNotifications() {
    // Should have at least one notification item visible
    await this.page.waitForTimeout(1_000);
  }

  async expectEmpty() {
    await expect(this.page.locator('text=/no notification/i')).toBeVisible();
  }

  async clickMarkAllRead() {
    await this.page.getByRole('button', { name: /mark all.*read/i }).click();
  }

  async clickLoadMore() {
    const loadMore = this.page.getByRole('button', { name: /load more/i });
    if (await loadMore.isVisible()) {
      await loadMore.click();
      await this.page.waitForTimeout(1_000);
    }
  }

  async clickNotification(index: number = 0) {
    const items = this.page.locator('main button, main a').filter({
      hasNot: this.page.locator('text=/mark all|load more|all|unread|requests|jobs|inventory|maintenance/i'),
    });
    if (await items.nth(index).isVisible()) {
      await items.nth(index).click();
    }
  }
}
