import { Page, expect } from '@playwright/test';

export class SettingsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/settings');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'Settings' })).toBeVisible();
  }

  async switchTab(tabName: string) {
    await this.page.getByRole('tab', { name: tabName }).click();
    await this.page.waitForTimeout(300);
  }

  async expectActiveTab(tabName: string) {
    await expect(
      this.page.getByRole('tab', { name: tabName })
    ).toHaveAttribute('data-state', 'active');
  }

  async expectUrlTab(tab: string) {
    await expect(this.page).toHaveURL(new RegExp(`tab=${tab}`));
  }

  async clickNewButton(entityType: string) {
    await this.page.getByRole('button', { name: new RegExp(`new ${entityType}`, 'i') }).click();
  }

  async expectShowDeactivatedToggle() {
    await expect(
      this.page.getByLabel(/show deactivated/i)
    ).toBeVisible();
  }

  async toggleShowDeactivated() {
    await this.page.getByLabel(/show deactivated/i).click();
    await this.page.waitForTimeout(500);
  }
}
