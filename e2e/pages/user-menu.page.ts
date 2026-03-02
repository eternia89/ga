import { Page, expect } from '@playwright/test';

export class UserMenuPage {
  private menuArea = this.page.locator('aside .border-t');

  constructor(private page: Page) {}

  async open() {
    await this.menuArea.locator('button').first().click();
    // Wait for dropdown to appear
    await expect(this.menuArea.locator('.absolute')).toBeVisible();
  }

  async expectUserName(name: string | RegExp) {
    await expect(this.menuArea.locator('p.font-medium')).toContainText(name);
  }

  async expectRoleBadge(role: string | RegExp) {
    await expect(this.menuArea.locator('p.text-xs')).toContainText(role);
  }

  async clickProfile() {
    await this.menuArea.locator('[data-profile-trigger]').click();
  }

  async clickSettings() {
    await this.menuArea.locator('a[href="/admin/settings"]').click();
  }

  async clickSignOut() {
    await this.menuArea.locator('button:has-text("Sign out")').click();
  }

  async expectDropdownVisible() {
    await expect(this.menuArea.locator('.absolute')).toBeVisible();
  }

  async expectProfileOption() {
    await expect(this.menuArea.locator('[data-profile-trigger]')).toBeVisible();
  }

  async expectSignOutOption() {
    await expect(this.menuArea.locator('button:has-text("Sign out")')).toBeVisible();
  }

  async expectSettingsOption() {
    await expect(this.menuArea.locator('a[href="/admin/settings"]')).toBeVisible();
  }

  async expectNoSettingsOption() {
    await expect(this.menuArea.locator('a[href="/admin/settings"]')).not.toBeVisible();
  }
}
