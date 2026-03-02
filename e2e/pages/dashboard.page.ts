import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async expectGreeting(namePattern: string | RegExp) {
    const heading = this.page.locator('h1').first();
    await expect(heading).toBeVisible();
    // Greeting format: "Good morning/afternoon/evening, Name"
    await expect(heading).toContainText(namePattern);
  }

  async expectRoleBadge(roleText: string | RegExp) {
    // The role badge in the sidebar user menu
    const badge = this.page.locator('aside .border-t p.text-xs');
    await expect(badge).toContainText(roleText);
  }

  async expectKPICards() {
    // Operational dashboard has KPI cards in a grid
    const kpiGrid = this.page.locator('.grid').first();
    await expect(kpiGrid).toBeVisible();
  }

  async expectSimpleWelcome() {
    // Non-operational users see a simpler welcome card
    await expect(this.page.locator('text=/Welcome/')).toBeVisible();
  }
}
