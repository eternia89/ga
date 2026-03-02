import { Page, expect } from '@playwright/test';
import { DataTablePage } from '../shared/data-table.page';

export class ScheduleListPage {
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.table = new DataTablePage(page);
  }

  async goto() {
    await this.page.goto('/maintenance');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: /schedule/i })).toBeVisible();
  }

  async clickNewSchedule() {
    await this.page.getByRole('link', { name: /new schedule/i }).click();
  }

  async expectNewScheduleButton() {
    await expect(this.page.getByRole('link', { name: /new schedule/i })).toBeVisible();
  }

  async expectScheduleInList(text: string | RegExp) {
    await this.table.expectRowContaining(text);
  }

  async clickSchedule(text: string | RegExp) {
    await this.table.clickRow(text);
  }

  async expectStatusBadge(text: string | RegExp) {
    await expect(this.page.locator('.badge, [class*="badge"]').filter({ hasText: text }).first()).toBeVisible();
  }

  async expectColumns() {
    const headers = this.page.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const h = headerTexts.join(' ').toLowerCase();
    expect(h).toContain('template');
    expect(h).toContain('asset');
    expect(h).toContain('interval');
    expect(h).toContain('status');
  }
}
