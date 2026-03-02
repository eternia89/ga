import { Page, expect } from '@playwright/test';
import { DataTablePage } from '../shared/data-table.page';

export class TemplateListPage {
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.table = new DataTablePage(page);
  }

  async goto() {
    await this.page.goto('/maintenance/templates');
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle() {
    await expect(this.page.locator('h1', { hasText: /templates/i })).toBeVisible();
  }

  async clickNewTemplate() {
    await this.page.getByRole('link', { name: /new template/i }).click();
  }

  async expectNewTemplateButton() {
    await expect(this.page.getByRole('link', { name: /new template/i })).toBeVisible();
  }

  async expectTemplateInList(name: string | RegExp) {
    await this.table.expectRowContaining(name);
  }

  async clickTemplate(name: string | RegExp) {
    await this.table.clickRow(name);
  }

  async deactivateTemplate(name: string) {
    const row = this.table.rows.filter({ hasText: name });
    await row.getByRole('button', { name: /deactivate/i }).click();
  }

  async reactivateTemplate(name: string) {
    const row = this.table.rows.filter({ hasText: name });
    await row.getByRole('button', { name: /reactivate/i }).click();
  }
}
