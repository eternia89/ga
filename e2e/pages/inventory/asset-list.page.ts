import { Page, expect } from '@playwright/test';
import { DataTablePage } from '../shared/data-table.page';

export class AssetListPage {
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.table = new DataTablePage(page);
  }

  async goto() {
    await this.page.goto('/inventory');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: 'Inventory' })).toBeVisible();
  }

  async clickNewAsset() {
    await this.page.getByRole('link', { name: /new asset/i }).click();
  }

  async expectExportButton() {
    await expect(this.page.getByRole('button', { name: /export/i })).toBeVisible();
  }

  async expectAssetInList(displayId: string | RegExp) {
    await this.table.expectRowContaining(displayId);
  }

  async filterByStatus(status: string) {
    const statusFilter = this.page.locator('[role="combobox"]').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await this.page.locator('[cmdk-item]', { hasText: status }).click();
    }
  }

  async filterByCategory(category: string) {
    const catFilter = this.page.locator('[role="combobox"]').filter({ hasText: /category/i }).first();
    if (await catFilter.isVisible()) {
      await catFilter.click();
      await this.page.locator('[cmdk-item]', { hasText: category }).click();
    }
  }

  async filterByLocation(location: string) {
    const locFilter = this.page.locator('[role="combobox"]').filter({ hasText: /location/i }).first();
    if (await locFilter.isVisible()) {
      await locFilter.click();
      await this.page.locator('[cmdk-item]', { hasText: location }).click();
    }
  }
}
