import { Page, expect } from '@playwright/test';
import { DialogHelper } from '../shared/dialog.page';
import { InlineFeedbackPage } from '../shared/inline-feedback.page';
import { DataTablePage } from '../shared/data-table.page';

export class CategoryTabPage {
  readonly dialog: DialogHelper;
  readonly feedback: InlineFeedbackPage;
  readonly table: DataTablePage;

  constructor(private page: Page) {
    this.dialog = new DialogHelper(page);
    this.feedback = new InlineFeedbackPage(page);
    this.table = new DataTablePage(page);
  }

  async clickNew() {
    await this.page.getByRole('button', { name: /new category/i }).click();
  }

  async createCategory(name: string, type: 'Request' | 'Asset', description?: string) {
    await this.clickNew();
    await this.dialog.expectOpen();
    await this.dialog.fillField('Name', name);
    // Select type
    await this.dialog.dialog.getByLabel(/type/i).click();
    await this.page.getByRole('option', { name: type }).click();
    if (description) {
      await this.dialog.fillField('Description', description);
    }
    await this.dialog.confirm();
  }

  async editCategory(name: string) {
    await this.table.rows.filter({ hasText: name }).getByRole('button', { name: /edit/i }).click();
  }

  async expectTypeImmutable() {
    // Type field should be disabled on edit
    await expect(this.dialog.dialog.getByLabel(/type/i)).toBeDisabled();
  }

  async expectCategoryInTable(name: string) {
    await this.table.expectRowContaining(name);
  }
}
