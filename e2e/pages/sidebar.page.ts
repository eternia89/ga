import { Page, expect } from '@playwright/test';

export class SidebarPage {
  private sidebar = this.page.locator('aside');

  constructor(private page: Page) {}

  async navigateTo(label: string) {
    await this.sidebar.getByRole('link', { name: label, exact: true }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectSectionVisible(sectionTitle: string) {
    await expect(
      this.sidebar.locator('h2', { hasText: sectionTitle })
    ).toBeVisible();
  }

  async expectSectionHidden(sectionTitle: string) {
    await expect(
      this.sidebar.locator('h2', { hasText: sectionTitle })
    ).not.toBeVisible();
  }

  async expectNavItem(label: string) {
    await expect(
      this.sidebar.getByRole('link', { name: label, exact: true })
    ).toBeVisible();
  }

  async expectNavItemHidden(label: string) {
    await expect(
      this.sidebar.getByRole('link', { name: label, exact: true })
    ).not.toBeVisible();
  }

  async expectCompanyName(name: string | RegExp) {
    await expect(this.sidebar.locator('h1')).toContainText(name);
  }

  async expectActiveLink(label: string) {
    const link = this.sidebar.getByRole('link', { name: label, exact: true });
    await expect(link).toHaveClass(/bg-blue-50/);
  }
}
