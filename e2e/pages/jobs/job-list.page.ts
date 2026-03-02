import { Page, expect } from '@playwright/test';
import { DataTablePage } from '../shared/data-table.page';

export class JobListPage {
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.table = new DataTablePage(page);
  }

  async goto() {
    await this.page.goto('/jobs');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'Jobs' })).toBeVisible();
  }

  async clickNewJob() {
    await this.page.getByRole('link', { name: /new job/i }).click();
  }

  async expectExportButton() {
    await expect(this.page.getByRole('button', { name: /export/i })).toBeVisible();
  }

  async expectJobInList(displayId: string | RegExp) {
    await this.table.expectRowContaining(displayId);
  }

  async filterByStatus(status: string) {
    const statusFilter = this.page.locator('[role="combobox"]').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await this.page.locator('[cmdk-item]', { hasText: status }).click();
    }
  }
}
