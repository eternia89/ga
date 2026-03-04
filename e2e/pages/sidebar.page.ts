import { Page, Locator, expect } from '@playwright/test';

export class SidebarPage {
  private sidebar = this.page.locator('aside');

  constructor(private page: Page) {}

  /** Locate a sidebar link by its label text (matches the span inside the link). */
  private navLink(label: string): Locator {
    return this.sidebar.locator('a').filter({
      has: this.page.locator(`span:text-is("${label}")`),
    });
  }

  async navigateTo(label: string) {
    await this.navLink(label).click();
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
    await expect(this.navLink(label)).toBeVisible();
  }

  async expectNavItemHidden(label: string) {
    await expect(this.navLink(label)).not.toBeVisible();
  }

  async expectCompanyName(name: string | RegExp) {
    await expect(this.sidebar.locator('h1')).toContainText(name);
  }

  async expectActiveLink(label: string) {
    await expect(this.navLink(label)).toHaveClass(/bg-blue-50/);
  }
}
