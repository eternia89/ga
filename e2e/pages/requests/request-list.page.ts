import { Page, expect } from '@playwright/test';
import { DataTablePage } from '../shared/data-table.page';

export class RequestListPage {
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.table = new DataTablePage(page);
  }

  async goto() {
    await this.page.goto('/requests');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'Requests' })).toBeVisible();
  }

  async clickNewRequest() {
    await this.page.getByRole('link', { name: /new request/i }).click();
  }

  async expectExportButton() {
    await expect(this.page.getByRole('button', { name: /export/i })).toBeVisible();
  }

  async clickExport() {
    await this.page.getByRole('button', { name: /export/i }).click();
  }

  async filterByStatus(status: string) {
    // Status filter is typically a select or combobox
    const statusFilter = this.page.locator('[role="combobox"]').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await this.page.locator('[cmdk-item]', { hasText: status }).click();
    }
  }

  async expectRequestInList(displayId: string | RegExp) {
    await this.table.expectRowContaining(displayId);
  }
}
